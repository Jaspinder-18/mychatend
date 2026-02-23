require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


connectDB();

// Cloudinary connection check
const cloudinary = require('cloudinary').v2;
const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const api_key = (process.env.CLOUDINARY_API_KEY || "").trim();
const api_secret = (process.env.CLOUDINARY_API_SECRET || "").trim();

cloudinary.config({ cloud_name, api_key, api_secret });

(async () => {
    console.log(`[Cloudinary] Status: Checking ${cloud_name || 'MISSING NAME'}...`);
    try {
        await cloudinary.api.ping();
        console.log("Cloudinary Connection: SUCCESSFUL");
    } catch (error) {
        console.error("Cloudinary Connection: FAILED");
        console.error("- Cloud Name:", cloud_name ? 'OK' : 'MISSING');
        console.error("- API Key:", api_key ? 'OK' : 'MISSING');
        console.error("- API Secret:", api_secret ? `Loaded (Length: ${api_secret.length})` : 'MISSING');
        console.error("- Error Details:", error.message || error);
    }
})();

const app = express();

app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logger
app.use(cookieParser()); // Cookie parsing
app.use(cors({
    origin: ["https://mychatends.onrender.com", "http://localhost:5173", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vault', vaultRoutes);

app.get('/', (req, res) => {
    res.send('API is running....');
});

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Listen on 0.0.0.0 so mobile devices on the same Wi-Fi can reach the backend
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server started on PORT ${PORT}`));

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: '*', // Accept connections from any origin (local network mobile)
    },
});

let onlineUsers = [];

io.on('connection', (socket) => {
    console.log('Connected to socket.io');

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        if (userData) {
            // Remove existing entry
            onlineUsers = onlineUsers.filter(u => u.userId !== userData._id);

            // Only broadcast as online if NOT in ghost mode
            if (!userData.ghost_mode?.hide_online) {
                onlineUsers.push({ userId: userData._id, socketId: socket.id });
                io.emit('online-users', onlineUsers);
            }
        }
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (data) => {
        // data should contain { room, ghostMode }
        if (!data.ghostMode?.disable_typing) {
            socket.in(data.room).emit('typing');
        }
    });
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));


    socket.on('new message', (newMessageRecieved) => {
        const receiver = newMessageRecieved.receiver;
        if (!receiver) return console.log('receiver not defined');

        socket.in(receiver._id.toString()).emit('message recieved', newMessageRecieved);
    });

    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
        io.emit('online-users', onlineUsers);
        console.log('USER DISCONNECTED');
    });
});
