const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

// Allow all origins — needed for mobile devices on local network
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

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
            // Remove existing entry for this user if it exists to avoid old socketIds
            onlineUsers = onlineUsers.filter(u => u.userId !== userData._id);
            onlineUsers.push({ userId: userData._id, socketId: socket.id });
        }
        io.emit('online-users', onlineUsers);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach((user) => {
            if (user._id === newMessageRecieved.sender._id) return;

            socket.in(user._id).emit('message recieved', newMessageRecieved);
        });
    });

    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
        io.emit('online-users', onlineUsers);
        console.log('USER DISCONNECTED');
    });
});
