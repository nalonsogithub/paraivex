import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWOAigent } from '../../contexts/workout_aigent/WOAigentContext';
import styles from '../../styles/workout_aigent/MainWOPage.module.css';
import { useNavigate } from 'react-router-dom';

const MainWOPage = () => {
    const { auth, logout } = useAuth();
    const { fetchWorkouts } = useWOAigent();
    const navigate = useNavigate();

//    useEffect(() => {
//        if (auth) {
//            fetchUserDocuments();
//        }
//    }, [auth, fetchUserDocuments]);

    const tiles = [
        { title: "Add an Workout", onClick: () => navigate('/workout-add-workout') },
        { title: "Manage Workouts", onClick: () => navigate('/workout-manage-workout') },
        { title: "Chat", onClick: () => navigate('/workout-chat-component') },
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

export default MainWOPage; 