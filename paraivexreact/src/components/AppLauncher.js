// src/components/AppLauncher.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AppLauncher.module.css';

const MainUserPage = () => {
    const navigate = useNavigate();

    const tiles = [
        { title: "Smart Chat", onClick: () => navigate('/ea-user') },
        { title: "AI Workout", onClick: () => navigate('/workout-mainpage') },
    ];

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <h2>Welcome to Your Launch Pad</h2>
                <p>Select an app to get started:</p>
            </div>

            {/* Dashboard Tiles */}
            <div className={styles.tilesContainer}>
                {tiles.map((tile, index) => (
                    <div key={index} className={styles.tile} onClick={tile.onClick}>
                        <h3>{tile.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MainUserPage;
