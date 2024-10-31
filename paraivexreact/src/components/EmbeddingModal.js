import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useAuth } from '../contexts/AuthContext';
import AddEmbedding from './AddEmbedding';
import styles from '../styles/EmbeddingModal.module.css';
import { useNavigate } from 'react-router-dom';

const EmbeddingModal = ({ onClose }) => {
    const { responseEmbeddings = {}, setResponseEmbeddings, submitEmbedding, tags, getUserTags  } = useAuth();
    const [embeddings, setEmbeddings] = useState(Array.isArray(responseEmbeddings.embeddings) ? responseEmbeddings.embeddings : []);
    const [universalTags, setUniversalTags] = useState([]);
    const [useAiTags, setUseAiTags] = useState(false);
    const [isChronological, setIsChronological] = useState(false);	
	const navigate = useNavigate();


	
    // Format the current date to be displayed in the label
    const currentDate = new Date().toLocaleDateString();
	
    useEffect(() => {
		if (!embeddings.length && Array.isArray(responseEmbeddings.embeddings)) {
			setEmbeddings(responseEmbeddings.embeddings);
		}
        // Fetch tags on load
        if (tags.length === 0) {
            getUserTags();
        }
		setUniversalTags(tags);
		
    }, [responseEmbeddings, tags.length, getUserTags]);
	
    // Function to update answers to include the date if 'isChronological' is true
    const applyChronologicalToAnswers = (checked) => {
        const updatedEmbeddings = embeddings.map(embedding => {
            let updatedAnswer = embedding.response;

            if (checked) {
//				console.log('checked');
                // Prepend the date only if it isn't already included
                if (!updatedAnswer.startsWith(`This answer was supplied on ${currentDate}`)) {
                    updatedAnswer = `This answer was supplied on ${currentDate}. ${updatedAnswer}`;
                }
            } else {
//				console.log('un checked');
                // Remove the prepended date if 'isChronological' is unchecked
                updatedAnswer = updatedAnswer.replace(new RegExp(`^This answer was supplied on ${currentDate}\\.\\s*`), '');
            }

            return { ...embedding, response: updatedAnswer };
        });

        setEmbeddings(updatedEmbeddings);
//        console.log("Embeddings updated with chronological change:", updatedEmbeddings);
    };

    const handleChronologicalChange = (checked) => {
        setIsChronological(checked);
        applyChronologicalToAnswers(checked);
    };	
    // Update tags for a specific embedding
    const updateTagsForEmbedding = (index, tags) => {
        const updatedEmbeddings = [...embeddings];
        updatedEmbeddings[index] = { ...updatedEmbeddings[index], tags };
        setEmbeddings(updatedEmbeddings);
        console.log("Updated embeddings with new tags:", updatedEmbeddings);
    };
	
    const handleTagCheckboxChange = (tag, checked) => {
        const updatedEmbeddings = embeddings.map(embedding => {
            const updatedTags = checked
                ? Array.from(new Set([...(embedding.tags || []), tag]))
                : embedding.tags?.filter(existingTag => existingTag !== tag) || [];
            return { ...embedding, tags: updatedTags };
        });
        setEmbeddings(updatedEmbeddings);
//        console.log("Updated embeddings after tag checkbox change:", updatedEmbeddings);
    };
	
    const prepareEmbeddingData = (embedding) => {
        let answer = embedding.response;
        if (isChronological) {
            const currentDate = new Date().toLocaleDateString();
            answer = `This answer was supplied on ${currentDate}. ${answer}`;
        }
        return {
            question: embedding.question,
            answer,
            tags: embedding.tags || []
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
		
		
            {/* Universal Tags Section */}
            <div className={styles.universalTagsSection}>
                <h4>Universal Tags</h4>
                <div className={styles.tagContainer}>
                    {universalTags.map((tag, index) => (
                        <label key={index}>
                            <input
                                type="checkbox"
                                onChange={(e) => handleTagCheckboxChange(tag, e.target.checked)}
                            />
                            {tag}
                        </label>
                    ))}
                </div>
            </div>

            {/* AI Generated Tags Section */}
            {responseEmbeddings.ai_tags && (
                <div className={styles.aiTagsSection}>
                    <h4>AI Generated Tags</h4>
                    <div className={styles.tagContainer}>
                        {responseEmbeddings.ai_tags.map((tag, index) => (
                            <label key={index}>
                                <input
                                    type="checkbox"
                                    onChange={(e) => handleTagCheckboxChange(tag, e.target.checked)}
                                />
                                {tag}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Chronological Checkbox Section */}
            <div className={styles.chronologicalSection}>
                <label>
                    <input
                        type="checkbox"
                        checked={isChronological}
                        onChange={(e) => handleChronologicalChange(e.target.checked)}
                    />
                    Make Chronological (Adds: "This answer was supplied on {currentDate}" at the beginning)
                </label>
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
								initialTags={embedding.tags}
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
            <button onClick={handleSaveAllEmbeddings} className={styles.saveAllButton}>Save All Embeddings</button>
            <button onClick={handleBackToChat} className={styles.closeButton}>Close</button>
        </div>
    );
};

export default EmbeddingModal;
