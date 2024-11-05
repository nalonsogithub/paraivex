// src/components/UrlModal.js
import React from 'react';
import styles from '../../styles/embedding_aigent/UrlModal.module.css';

const UrlModal = ({ urls, onClose }) => {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button onClick={onClose} className={styles.closeButton}>Close</button>
                <h3>Search Results</h3>
                <ul>
                    {urls.map((urlObj, index) => (
                        <li key={index}>
                            <a href={urlObj.url} target="_blank" rel="noopener noreferrer">
                                {urlObj.url}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default UrlModal;
