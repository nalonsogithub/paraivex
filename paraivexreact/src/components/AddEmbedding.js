// src/components/AddEmbedding.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/AddEmbedding.module.css';
import Navbar from './Navbar';

const AddEmbedding = ({ initialQuestion = '', initialAnswer = '', showNavbar = true, onSaveSuccess }) => {

    const { brains, submitEmbedding, fetchUserDocuments } = useAuth();  // Access brains from AuthContext for multi-select

    // Debugging: Check the brains array
//    console.log("Brains array from AuthContext:", brains);

    const [question, setQuestion] = useState(initialQuestion);
    const [answer, setAnswer] = useState(initialAnswer);
    const [selectedBrains, setSelectedBrains] = useState([]);  // Multi-select for brains
    const [customTags, setCustomTags] = useState([]);
    const [newTag, setNewTag] = useState('');  // For entering a new custom tag
	const [loading, setLoading] = useState(true); // Loading state for documents

    useEffect(() => {
        // Fetch user documents (brains) if not already loaded
        if (!brains || brains.length === 0) {
            console.log('Fetching brains...');
            fetchUserDocuments().then(() => {
                setLoading(false); // Stop loading once brains are fetched
            });
        } else {
            setLoading(false); // Stop loading if brains are already available
        }
    }, [fetchUserDocuments, brains]);
	
    if (loading) {
        return <p>Loading documents...</p>; // Optional loading message
    }	
	
	
    // Handle brain selection
    const toggleBrainSelection = (brainTag) => {
        setSelectedBrains((prevSelected) => 
            prevSelected.includes(brainTag)
                ? prevSelected.filter(tag => tag !== brainTag)
                : [...prevSelected, brainTag]
        );
    };

    const handleSelectAllBrains = () => {
        setSelectedBrains(brains.map(brain => {
//            console.log("Processing brain for select all:", brain);  // Log each brain
            return `brain_${brain.brainName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        }));
    };

    const handleClearBrains = () => {
        setSelectedBrains([]);
    };

    // Handle adding and removing custom tags
    const addCustomTag = () => {
        const formattedTag = newTag.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (formattedTag && !customTags.includes(formattedTag)) {
            setCustomTags([...customTags, formattedTag]);
            setNewTag('');
        }
    };

    const deleteCustomTag = (tag) => {
        setCustomTags(customTags.filter((t) => t !== tag));
    };

    // Prepare the final JSON structure for submission
    const prepareEmbeddingData = () => {
        const tags = [...selectedBrains, ...customTags];
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
            alert("Embedding saved successfully!");
			
			// Reset all fields to clear them after success
			setQuestion('');
			setAnswer('');
			setSelectedBrains([]);
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

            <div className={styles.field}>
                <label>Associate with Brains</label>
                <div className={styles.multiSelect}>
                    {brains.map((brain, index) => {
                        // Log each brain object to ensure brainName exists
//                        console.log("Brain Object:", brain);

                        const brainName = brain?.brainName ? brain.brainName.toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
                        const brainTag = `brain_${brainName}`;

                        return (
                            <div key={index} className={styles.brainOption}>
                                <input
                                    type="checkbox"
                                    checked={selectedBrains.includes(brainTag)}
                                    onChange={() => toggleBrainSelection(brainTag)}
                                />
                                <label>{brain.brainName || 'Unnamed Brain'}</label>
                            </div>
                        );
                    })}
                </div>
                <button onClick={handleSelectAllBrains} className={styles.selectButton}>Select All</button>
                <button onClick={handleClearBrains} className={styles.clearButton}>Clear</button>
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
        </div>
    );
};

export default AddEmbedding;
