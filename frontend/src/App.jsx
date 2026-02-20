import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useChatState } from './context/ChatProvider';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { useState } from 'react';
import NotesDisguise from './components/NotesDisguise';
import useVisualViewport from './hooks/useVisualViewport';

const ProtectedRoute = ({ children, user }) => {
    if (!user && !localStorage.getItem("userInfo")) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    const { user } = useChatState();
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Keeps --app-height CSS var in sync with the real visible viewport
    // (accounts for on-screen keyboard on mobile)
    useVisualViewport();

    const handleUnlock = () => setIsUnlocked(true);

    if (!isUnlocked) {
        return <NotesDisguise onUnlock={handleUnlock} />;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute user={user}>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;

