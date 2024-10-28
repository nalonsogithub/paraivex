// src/App.js
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React from 'react';
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import AddEmbedding from './components/AddEmbedding';
import MainUserPage from './components/MainUserPage';
import ManageEmbeddings from './components/ManageEmbeddings';
import UnderConstruction from './components/UnderConstruction';
import ChatComponent from './components/ChatComponent';
<<<<<<< HEAD
import EmbeddingModal from './components/EmbeddingModal';
import SplashScreen from './components/SplashScreen';
import './App.css';

function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
        if (hasSeenSplash) {
            setShowSplash(false);
        }
    }, []);

    const handleDismissSplash = () => {
        setShowSplash(false);
        sessionStorage.setItem('hasSeenSplash', 'true');
    };	
=======
import './App.css';

function App() {
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
    return (
        <AuthProvider>
            <Router>
                <div className="App">
<<<<<<< HEAD
                    {showSplash ? (
                        <SplashScreen onDismiss={handleDismissSplash} />
                    ) : (
                        <Routes>
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/user" element={<PrivateRoute><MainUserPage /></PrivateRoute>} />
                            <Route path="/add-embedding" element={<AddEmbedding />} />
                            <Route path="/manage-embeddings" element={<ManageEmbeddings />} />
                            <Route path="/under-construction" element={<UnderConstruction />} />
                            <Route path="/chat-component" element={<ChatComponent />} />
                            <Route path="/embedding-modal" element={<EmbeddingModal />} />
                        </Routes>
                    )}		
		
=======
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/user" element={<PrivateRoute><MainUserPage /></PrivateRoute>} />
						<Route path="/add-embedding" element={<AddEmbedding />} />
						<Route path="/manage-embeddings" element={<ManageEmbeddings />} />
						<Route path="/under-construction" element={<UnderConstruction />} />
						<Route path="/chat-component" element={<ChatComponent />} />
                    </Routes>
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
                </div>
            </Router>
        </AuthProvider>
    );
}

// PrivateRoute component to restrict access to authenticated users
const PrivateRoute = ({ children }) => {
    const { auth } = useAuth();
    return auth ? children : <Navigate to="/" />;
};

export default App;
