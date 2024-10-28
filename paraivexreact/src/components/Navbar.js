// src/components/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className={styles.navbar}>
            <button onClick={() => navigate('/user')} className={styles.navButton}>
                Main Page
            </button>
            <button onClick={() => navigate('/add-embedding')} className={styles.navButton}>
                Add Embedding
            </button>
            <button onClick={() => navigate('/manage-embeddings')} className={styles.navButton}>
                Manage Embeddings
            </button>
            <button onClick={() => navigate('/chat-component')} className={styles.navButton}>
                Chat
            </button>
        </nav>
    );
};

export default Navbar;
