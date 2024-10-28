// src/components/EmbeddingModal.js

import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../contexts/AuthContext';
import AddEmbedding from './AddEmbedding';
import styles from '../styles/EmbeddingModal.module.css';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
=======
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd

const EmbeddingModal = ({ onClose }) => {
    const { responseEmbeddings = {}, setResponseEmbeddings } = useAuth();
    const [embeddings, setEmbeddings] = useState(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);
<<<<<<< HEAD
	const navigate = useNavigate();
=======
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd

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
	
<<<<<<< HEAD
    const handleBackToChat = () => {
        navigate('/chat-component');
    };	
	
    return (
=======
    return (
        <Draggable handle=".handle" defaultPosition={{ x: 50, y: 50 }}>
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
            <div className={styles.modalContainer}>
				{/* Title bar with three sections */}
				<div className="handle">
				  <div className={styles.modalTitleBar}>
					<div className={styles.modalTitleLeft}></div> {/* Empty left space */}
					<div className={styles.modalTitleCenter}>Add Embeddings from Response</div> {/* Centered title */}
					<div className={styles.modalTitleRight}>
<<<<<<< HEAD
					  <button className={styles.closeXButton} onClick={handleBackToChat}>×</button> {/* Close button */}
=======
					  <button className={styles.closeXButton} onClick={onClose}>×</button> {/* Close button */}
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
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
<<<<<<< HEAD
                              	{/* Delete button for each embedding */}
								<button
									className={styles.deleteButton}
									onClick={() => handleDelete(index)}
                              	>
                                  	X
                              	</button>		
=======
                                {/* Delete button */}
                                <button className={styles.deleteButton} onClick={() => handleDelete(index)}>X</button>
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
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

<<<<<<< HEAD
                <button onClick={handleBackToChat} className={styles.closeButton}>Close</button>
            </div>
=======
                <button onClick={onClose} className={styles.closeButton}>Close</button>
            </div>
        </Draggable>
>>>>>>> 459daa780fb2c9c66b93a49dbba649027f0b55cd
    );
};

export default EmbeddingModal;
