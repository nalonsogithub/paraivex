// src/components/UnderConstruction.js
import React from 'react';
import styles from '../../styles/embedding_aigent/UnderConstruction.module.css';

const UnderConstruction = () => {
    return (
        <div className={styles.container}>
            <h1>🚧 Site Under Construction 🚧</h1>
            <p>This site is forthcoming. Please check back later.</p>
            <p>If you have questions, feel free to reach out: <a href="mailto:nn@dfg.com">nn@dfg.com</a></p>
        </div>
    );
};

export default UnderConstruction;
