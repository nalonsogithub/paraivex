// src/components/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/embedding_aigent/Navbar.module.css';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className={styles.navbar}>
            <button onClick={() => navigate('/ea-user')} className={styles.navButton}>
                Main Page
            </button>
            <button onClick={() => navigate('/ea-add-embedding')} className={styles.navButton}>
                Add Embedding
            </button>
            <button onClick={() => navigate('/ea-manage-embeddings')} className={styles.navButton}>
                Manage Embeddings
            </button>
            <button onClick={() => navigate('/ea-chat-component')} className={styles.navButton}>
                Chat
            </button>
        </nav>
    );
};

export default Navbar;
