// src/components/EmbeddingModal.js

import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../contexts/AuthContext';
import AddEmbedding from './AddEmbedding';
import styles from '../styles/EmbeddingModal.module.css';

const EmbeddingModal = ({ onClose }) => {
    const { responseEmbeddings = {}, setResponseEmbeddings } = useAuth();
    const [embeddings, setEmbeddings] = useState(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);

    useEffect(() => {
        console.log("responseEmbeddings in EmbeddingModal:", responseEmbeddings);
        setEmbeddings(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);
    }, [responseEmbeddings]);

    const handleDelete = (index) => {
        const updatedEmbeddings = embeddings.filter((_, i) => i !== index);
        setEmbeddings(updatedEmbeddings);
        setResponseEmbeddings({ ...responseEmbeddings, embeddings: updatedEmbeddings });
    };
    // New function to handle successful save and remove the embedding from view
    const handleSaveSuccess = (index) => {
        alert("Embedding saved successfully!");
        handleDelete(index); // Remove the saved embedding from the list
    };
	
    return (
        <Draggable handle=".handle" defaultPosition={{ x: 50, y: 50 }}>
            <div className={styles.modalContainer}>
				{/* Title bar with three sections */}
				<div className="handle">
				  <div className={styles.modalTitleBar}>
					<div className={styles.modalTitleLeft}></div> {/* Empty left space */}
					<div className={styles.modalTitleCenter}>Add Embeddings from Response</div> {/* Centered title */}
					<div className={styles.modalTitleRight}>
					  <button className={styles.closeXButton} onClick={onClose}>×</button> {/* Close button */}
					</div>
				  </div>
				</div>		
				{/*
                <div className="handle" style={{ cursor: 'move', padding: '10px', backgroundColor: '#f0f0f0' }}>
                    <h2>Add Embeddings from Response</h2>
                </div>
				*/}

                <div className={styles.modalContent}>
                    {embeddings.length > 0 ? (
                        embeddings.map((embedding, index) => (
                            <div key={index} className={styles.embeddingContainer}>
                                {/* Delete button */}
                                <button className={styles.deleteButton} onClick={() => handleDelete(index)}>X</button>
                                <AddEmbedding
                                    initialQuestion={embedding.question}
                                    initialAnswer={embedding.response}
                                    showNavbar={false}
									onSaveSuccess={() => handleSaveSuccess(index)}
                                />
                            </div>
                        ))
                    ) : (
                        <p>No embeddings to display.</p>
                    )}
                </div>

                <button onClick={onClose} className={styles.closeButton}>Close</button>
            </div>
        </Draggable>
    );
};

export default EmbeddingModal;
