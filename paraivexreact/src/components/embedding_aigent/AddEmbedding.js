// src/components/AddEmbedding.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmbeddingAigent } from '../../contexts/embedding_aigent/EmbeddingAigentContext';
import styles from '../../styles/embedding_aigent/AddEmbedding.module.css';
import Navbar from './Navbar';

const AddEmbedding = ({ initialQuestion = '', 
					   initialAnswer = '',
					   initialTags = [],
					   showNavbar = true, 
					   onSaveSuccess, 
					   onUpdateTags  = null}) => {
    const { auth} = useAuth();  
    const { submitEmbedding, fetchUserDocuments, getUserTags, getEmbeddings } = useEmbeddingAigent();  

//    const { auth, brains, submitEmbedding, fetchUserDocuments, getUserTags, getEmbeddings } = useAuth();  
//    const { submitEmbedding, fetchUserDocuments, getUserTags, getEmbeddings } = useEmbeddingAigent();  
	const [question, setQuestion] = useState(initialQuestion);
    const [answer, setAnswer] = useState(initialAnswer);
//	const [selectedTags, setSelectedTags] = useState(initialTags);
	const [selectedTags, setSelectedTags] = useState(initialTags);
    const [customTags, setCustomTags] = useState([]);
    const [newTag, setNewTag] = useState('');  // For entering a new custom tag
	const [loading, setLoading] = useState(true); // Loading state for documents
	const [confirmationMessage, setConfirmationMessage] = useState('');
    const [embeddings, setEmbeddings] = useState([]);
    const [filteredEmbeddings, setFilteredEmbeddings] = useState([]);
    const [tags, setTags] = useState([]);

	
	

    useEffect(() => {
        if (auth?.username) {
            fetchUserTags(auth.username);
            fetchEmbeddings(auth.username);
        }
    }, [auth]);
			
    const fetchUserTags = async (username) => {
        const userTags = await getUserTags(username);
        setTags(userTags);
    };

    const fetchEmbeddings = async (username, tags = []) => {
        const documents = await getEmbeddings(username, tags);
        setEmbeddings(documents);
        setFilteredEmbeddings(documents); // Initially set filtered embeddings to all embeddings
    };	
			
    // Update state when props change
    useEffect(() => {
        setQuestion(initialQuestion);
    }, [initialQuestion]);

    useEffect(() => {
        setAnswer(initialAnswer);
    }, [initialAnswer]);

    useEffect(() => {
        setSelectedTags(initialTags);
    }, [initialTags]);			
	
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
