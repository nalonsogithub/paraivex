// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// CONTEXTS
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EmbeddingAigentProvider } from './contexts/embedding_aigent/EmbeddingAigentContext';
import { ChatProvider } from './contexts/ChatContext';
import { WOAigentProvider } from './contexts/workout_aigent/WOAigentContext';


// MAIN ROUTES
import AppLauncher from './components/AppLauncher';

// MAIN AUTHENTICATION ROUTES
import Login from './components/Login';
import Signup from './components/Signup';

// EMBEDDING AIGENT
import EA_AddEmbedding from './components/embedding_aigent/AddEmbedding';
import EA_MainUserPage from './components/embedding_aigent/MainUserPage';
import EA_ManageEmbeddings from './components/embedding_aigent/ManageEmbeddings';
import EA_UnderConstruction from './components/embedding_aigent/UnderConstruction';
import EA_ChatComponent from './components/embedding_aigent/ChatComponent';
import EA_EmbeddingModal from './components/embedding_aigent/EmbeddingModal';
import EA_SplashScreen from './components/embedding_aigent/SplashScreen';

// WORKOUT AIGENT
import WO_MainPage from './components/workout_aigent/MainWOPage';
import WOChatComponent from './components/workout_aigent/WOChatComponent';

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

    return (
        <AuthProvider>
		<ChatProvider>
            <Router>
                <div className="App">
                    {showSplash ? (
                        <EA_SplashScreen onDismiss={handleDismissSplash} />
                    ) : (
                        <Routes>
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/app-launcher" element={<PrivateRoute><AppLauncher /></PrivateRoute>} />
		
							

                            {/* Wrap all /ea- routes in the EmbeddingAigentProvider */}
                            <Route 
                                path="/ea-user" 
                                element={
                                    <PrivateRoute>
                                        <EmbeddingAigentProvider>
                                            <EA_MainUserPage />
                                        </EmbeddingAigentProvider>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/ea-add-embedding" 
                                element={
                                    <EmbeddingAigentProvider>
                                        <EA_AddEmbedding />
                                    </EmbeddingAigentProvider>
                                } 
                            />
                            <Route 
                                path="/ea-manage-embeddings" 
                                element={
                                    <EmbeddingAigentProvider>
                                        <EA_ManageEmbeddings />
                                    </EmbeddingAigentProvider>
                                } 
                            />
                            <Route 
                                path="/ea-under-construction" 
                                element={
                                    <EmbeddingAigentProvider>
                                        <EA_UnderConstruction />
                                    </EmbeddingAigentProvider>
                                } 
                            />
                            <Route 
                                path="/ea-chat-component" 

                                element={
                                    <EmbeddingAigentProvider>
                                        <EA_ChatComponent />
                                    </EmbeddingAigentProvider>
                                } 
                            />
                            <Route 
                                path="/ea-embedding-modal" 
                                element={
                                    <EmbeddingAigentProvider>
                                        <EA_EmbeddingModal />
                                    </EmbeddingAigentProvider>
                                } 
                            />
                            {/* Wrap the /workout-mainpage route only in AuthProvider and WOAigentProvider */}
                            <Route 
                                path="/workout-mainpage" 
                                element={
                                    <PrivateRoute>
                                        <WOAigentProvider>
                                            <WO_MainPage />
                                        </WOAigentProvider>
                                    </PrivateRoute>
                                } 
                            />		
							<Route 
								path="/workout-chat-component" 
								element={
									<PrivateRoute>
										<WOAigentProvider>
											<WOChatComponent />
										</WOAigentProvider>
									</PrivateRoute>
								} 
							/>		
                        </Routes>
                    )}
                </div>
            </Router>
		</ChatProvider>

        </AuthProvider>
    );
}

// PrivateRoute component to restrict access to authenticated users
const PrivateRoute = ({ children }) => {
    const { auth } = useAuth();
    return auth ? children : <Navigate to="/" />;
};

export default App;
