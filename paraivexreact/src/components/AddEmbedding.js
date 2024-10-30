// src/components/AddEmbedding.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/AddEmbedding.module.css';
import Navbar from './Navbar';

const AddEmbedding = ({ initialQuestion = '', initialAnswer = '', showNavbar = true, onSaveSuccess, onUpdateTags  = null}) => {

    const { brains, submitEmbedding, fetchUserDocuments, tags, getUserTags } = useAuth();  // Access brains from AuthContext for multi-select
    const [question, setQuestion] = useState(initialQuestion);
    const [answer, setAnswer] = useState(initialAnswer);
	const [selectedTags, setSelectedTags] = useState([]);
    const [customTags, setCustomTags] = useState([]);
    const [newTag, setNewTag] = useState('');  // For entering a new custom tag
	const [loading, setLoading] = useState(true); // Loading state for documents
	const [confirmationMessage, setConfirmationMessage] = useState('');


    // Handle adding or removing selected tags
    const toggleTagSelection = (tag) => {
        setSelectedTags((prevSelected) =>
            prevSelected.includes(tag)
                ? prevSelected.filter((t) => t !== tag)
                : [...prevSelected, tag]
        );
    };	


    // Handle adding and removing custom tags
    const addCustomTag = () => {
        const formattedTag = newTag.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (formattedTag && !customTags.includes(formattedTag)) {
			const updatedTags = [...customTags, formattedTag];
            setCustomTags([...customTags, formattedTag]);
			
            // Conditionally call onUpdateTags if it's provided
            if (onUpdateTags) {
                onUpdateTags(updatedTags);
            }			
			
            setNewTag('');
        }
    };

    const deleteCustomTag = (tag) => {
		const updatedTags = customTags.filter((t) => t !== tag);
        setCustomTags(customTags.filter((t) => t !== tag));
		        // Conditionally call onUpdateTags if it's provided
        if (onUpdateTags) {
            onUpdateTags(updatedTags);
        }
    };

    // Prepare the final JSON structure for submission
    const prepareEmbeddingData = () => {
        const tags = [...selectedTags, ...customTags];
        return {
            question,
            answer,
            tags
        };
    };
	
	

    const handleSubmit = async () => {
        const embeddingData = prepareEmbeddingData();
//        console.log("Embedding Data to Submit:", embeddingData);
        
        // Call submitEmbedding to send data to backend
        const result = await submitEmbedding(embeddingData);

        if (result.success) {
            setConfirmationMessage("Embedding saved successfully!"); 	
			getUserTags();
			
			// Clear the message after 3 seconds
            setTimeout(() => setConfirmationMessage(''), 3000);
			
			// Reset all fields to clear them after success
			setQuestion('');
			setAnswer('');
			setSelectedTags([]);
			setCustomTags([]);
			setNewTag('');
			
            if (onSaveSuccess) {
                onSaveSuccess(); // Call the onSaveSuccess callback to remove the embedding from view
            }			
        } else {
            alert(`Failed to save embedding: ${result.message}`);
        }
    };
	
	
    return (
        <div className={styles.container}>
			{showNavbar && <Navbar />}

            <h2>Add New Embedding</h2>

            <div className={styles.field}>
                <label>Question</label>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className={styles.input}
                />
            </div>

            <div className={styles.field}>
                <label>Answer</label>
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className={`${styles.input} ${styles.textarea}`}
                />
            </div>

            {/* Available Tags Section */}
            <div className={styles.field}>
                <label>Available Tags</label>
                <div className={styles.tagsGrid}>
                    {tags.map((tag, index) => (
                        <div key={index} className={styles.tagItem}>
                            <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={() => toggleTagSelection(tag)}
                                id={`tag-${index}`}
                                className={styles.checkbox}
                            />
                            <label htmlFor={`tag-${index}`} className={styles.tagLabel}>
                                {tag}
                            </label>
                        </div>
                    ))}
                </div>
            </div>



            <div className={styles.field}>
                <label>Custom Tags</label>
                <div className={styles.tagInput}>
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className={styles.input}
                    />
                    <button onClick={addCustomTag} className={styles.addTagButton}>+</button>
                </div>
                <div className={styles.tagList}>
                    {customTags.map((tag, index) => (
                        <div key={index} className={styles.tag}>
                            <span>{tag}</span>
                            <button onClick={() => deleteCustomTag(tag)} className={styles.deleteTagButton}>X</button>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleSubmit} className={styles.submitButton}>Save Embedding</button>
            {/* Confirmation Message */}
            {confirmationMessage && (
                <div className={styles.confirmationMessage}>
                    {confirmationMessage}
                </div>
            )}
        </div>
    );
};

export default AddEmbedding;
