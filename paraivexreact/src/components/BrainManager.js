// src/components/BrainManager.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/BrainManager.module.css';

const BrainManager = () => {
    const { brains, addBrain, editBrain, deleteBrain } = useAuth();
    const [newBrainName, setNewBrainName] = useState('');
    const [newBrainDescription, setNewBrainDescription] = useState('');

    const handleAddBrain = () => {
        addBrain(newBrainName, newBrainDescription);
        setNewBrainName('');
        setNewBrainDescription('');
    };

    return (
        <div className={styles.brainContainer}>
            <h4>Brains</h4>
            {brains.map((brain, index) => (
                <div key={index} className={styles.brainItem}>
                    <p className={styles.brainName}>{brain.name}</p>
                    <p className={styles.brainDescription}>{brain.description}</p>
                    <div className={styles.brainActions}>
                        <button onClick={() => editBrain(index, { ...brain, name: "Updated Name" })}>Edit</button>
                        <button onClick={() => deleteBrain(index)} className={styles.deleteButton}>X</button>
                    </div>
                </div>
            ))}
            <input
                type="text"
                placeholder="New Brain Name"
                value={newBrainName}
                onChange={(e) => setNewBrainName(e.target.value)}
            />
            <textarea
                placeholder="Description"
                value={newBrainDescription}
                onChange={(e) => setNewBrainDescription(e.target.value)}
            />
            <button onClick={handleAddBrain}>Add Brain</button>
        </div>
    );
};

export default BrainManager;
