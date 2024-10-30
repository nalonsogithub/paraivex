import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../contexts/AuthContext';
import AddEmbedding from './AddEmbedding';
import styles from '../styles/EmbeddingModal.module.css';
import { useNavigate } from 'react-router-dom';

const EmbeddingModal = ({ onClose }) => {
    const { responseEmbeddings = {}, setResponseEmbeddings, submitEmbedding, tags, getUserTags  } = useAuth();
    const [embeddings, setEmbeddings] = useState(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);
	const navigate = useNavigate();

	
	
    useEffect(() => {
        setEmbeddings(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);

        // Fetch tags on load
        if (tags.length === 0) {
            getUserTags();
        }
    }, [responseEmbeddings, tags.length, getUserTags]);
	
	
    // Update tags for a specific embedding
    const updateTagsForEmbedding = (index, tags) => {
        const updatedEmbeddings = [...embeddings];
        updatedEmbeddings[index] = { ...updatedEmbeddings[index], tags };
        setEmbeddings(updatedEmbeddings);
    };
	
    // Prepare the embedding data to match the required format
    const prepareEmbeddingData = (embedding) => {
        return {
            question: embedding.question,
            answer: embedding.response,
            tags: embedding.tags || [] // Ensure tags exist, even if empty
        };
    };	

    const handleDelete = (index) => {
        const updatedEmbeddings = embeddings.filter((_, i) => i !== index);
        setEmbeddings(updatedEmbeddings);
        setResponseEmbeddings({ ...responseEmbeddings, embeddings: updatedEmbeddings });
    };

    const handleSaveSuccess = async (index) => {
        // Simulate a save operation with confirmation
       const embeddingData = prepareEmbeddingData(embeddings[index]);
	   const result = await submitEmbedding(embeddingData); // Use an async save function here
        if (result.success) {
            handleDelete(index); // Only delete after successful save
        } else {
            alert("Failed to save embedding. Please try again.");
        }
    };

    const handleSaveAllEmbeddings = async () => {
        const failedEmbeddings = [];
        
        // Save each embedding and collect failed ones
        for (const embedding of embeddings) {
            const embeddingData = prepareEmbeddingData(embedding);
            const result = await submitEmbedding(embeddingData);
            if (!result.success) {
                console.warn("Failed to save embedding:", embedding);
                failedEmbeddings.push(embedding);
            }
        }
		
        if (failedEmbeddings.length === 0) {
            // Clear all embeddings only if all saves were successful
            setEmbeddings([]);
            setResponseEmbeddings({ ...responseEmbeddings, embeddings: [] });
            handleBackToChat();
        } else {
            alert("Some embeddings failed to save. Please try again.");
            setEmbeddings(failedEmbeddings); // Retain only failed embeddings
            setResponseEmbeddings({ ...responseEmbeddings, embeddings: failedEmbeddings });
        }
    };


    const handleBackToChat = () => {
        navigate('/chat-component');
    };

    return (
        <div className={styles.modalContainer}>
            <div className="handle">
                <div className={styles.modalTitleBar}>
                    <div className={styles.modalTitleLeft}></div>
                    <div className={styles.modalTitleCenter}>Add Embeddings from Response</div>
                    <div className={styles.modalTitleRight}>
                        <button className={styles.closeXButton} onClick={handleBackToChat}>×</button>
                    </div>
                </div>
            </div>

            <div className={styles.modalContent}>
                {embeddings.length > 0 ? (
                    embeddings.map((embedding, index) => (
                        <div key={index} className={styles.embeddingContainer}>
                            <button
                                className={styles.deleteButton}
                                onClick={() => handleDelete(index)}
                            >
                                X
                            </button>
                            <AddEmbedding
                                initialQuestion={embedding.question}
                                initialAnswer={embedding.response}
                                showNavbar={false}
                                onSaveSuccess={() => handleSaveSuccess(index)}
								onUpdateTags={(tags) => updateTagsForEmbedding(index, tags)} // Pass tag update handler
                            />
                        </div>
                    ))
                ) : (
                    <p>No embeddings to display.</p>
                )}
            </div>
            <button onClick={handleSaveAllEmbeddings} className={styles.saveAllButton}>Add All Embeddings</button>
            <button onClick={handleBackToChat} className={styles.closeButton}>Close</button>
        </div>
    );
};

export default EmbeddingModal;
