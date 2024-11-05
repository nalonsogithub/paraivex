import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmbeddingAigent } from '../../contexts/embedding_aigent/EmbeddingAigentContext';
import styles from '../../styles/embedding_aigent/MainUserPage.module.css';
import { useNavigate } from 'react-router-dom';

const MainUserPage = () => {
    const { auth, logout } = useAuth();
    const { fetchUserDocuments } = useEmbeddingAigent();
    const navigate = useNavigate();

//    useEffect(() => {
//        if (auth) {
//            fetchUserDocuments();
//        }
//    }, [auth, fetchUserDocuments]);

    const tiles = [
        { title: "Add an Embedding", onClick: () => navigate('/ea-add-embedding') },
        { title: "Manage Embeddings", onClick: () => navigate('/ea-manage-embeddings') },
        { title: "Chat", onClick: () => navigate('/ea-chat-component') },
        { 
            title: "Logout", 
            onClick: async () => {
                await logout(); // Ensure logout completes before navigating
                navigate('/login');
            } 
        },
    ];
	
    return (
        <div className={styles.container}>
            {/* Welcome Message */}
            {auth && (
                <div className={styles.welcomeMessage}>
                    <h2>Welcome, {auth.username}!</h2>
                    <p>Select an area to get started:</p>
                </div>
            )}

            {/* Dashboard Tiles */}
            <div className={styles.tilesContainer}>
                {tiles.map((tile, index) => (
                    <div key={index} className={styles.tile} onClick={tile.onClick}>
                        <h3>{tile.title}</h3>
                    </div>
                ))}
            </div>

            {/* Additional Sections (e.g., Account Settings) */}
            <div className={styles.accountSection}>
                <h4>Account Settings</h4>
            </div>
        </div>
    );
};

export default MainUserPage; 