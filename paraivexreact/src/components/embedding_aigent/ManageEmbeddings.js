import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmbeddingAigent } from '../../contexts/embedding_aigent/EmbeddingAigentContext';
import styles from '../../styles/embedding_aigent/ManageEmbeddings.module.css';
import Navbar from './Navbar';

const ManageEmbeddings = () => {
    const { auth} = useAuth();
    const { getUserTags, getEmbeddings, deleteEmbedding, updateEmbeddingTags, updateEmbedding } = useEmbeddingAigent();
    const [embeddings, setEmbeddings] = useState([]);
    const [filteredEmbeddings, setFilteredEmbeddings] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentEmbedding, setCurrentEmbedding] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedBrains, setSelectedBrains] = useState([]);
    const [customTags, setCustomTags] = useState([]);
    const [newTag, setNewTag] = useState('');

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

    // Filter embeddings based on selected tags
    useEffect(() => {
        if (selectedTags.length > 0) {
            const filtered = embeddings.filter(embedding =>
                selectedTags.every(tag => embedding.tags.includes(tag))
            );
            setFilteredEmbeddings(filtered);
        } else {
            setFilteredEmbeddings(embeddings); // No tags selected, show all
        }
    }, [selectedTags, embeddings]);

    // Handle tag selection
    const toggleTagSelection = (tag) => {
        setSelectedTags((prevSelected) =>
            prevSelected.includes(tag)
                ? prevSelected.filter((t) => t !== tag)
                : [...prevSelected, tag]
        );
    };

    const handleSelectAllTags = () => setSelectedTags(tags);
    const handleClearAllTags = () => setSelectedTags([]);

    const handleEditTags = (embedding) => {
        setCurrentEmbedding(embedding);
        setSelectedBrains(embedding.tags.filter(tag => tag.startsWith("brain_")));
        setCustomTags(embedding.tags.filter(tag => !tag.startsWith("brain_")));
        setShowEditModal(true);
    };

    const handleDelete = async (doc_id) => {
        const result = await deleteEmbedding(doc_id);
        if (result.success) {
            setEmbeddings(embeddings.filter((embedding) => embedding.id !== doc_id));
        } else {
            alert(`Failed to delete embedding: ${result.message}`);
        }
    };

    const handleBrainSelection = (brainTag) => {
        setSelectedBrains((prevSelected) =>
            prevSelected.includes(brainTag)
                ? prevSelected.filter(tag => tag !== brainTag)
                : [...prevSelected, brainTag]
        );
        updateCurrentEmbeddingTags([...selectedBrains, brainTag]);
    };

    const addCustomTag = () => {
        const formattedTag = newTag.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (formattedTag && !customTags.includes(formattedTag)) {
            const updatedCustomTags = [...customTags, formattedTag];
            setCustomTags(updatedCustomTags);
            setNewTag('');
            updateCurrentEmbeddingTags([...selectedBrains, ...updatedCustomTags]);
        }
    };

    const deleteCustomTag = (tag) => {
        const updatedCustomTags = customTags.filter((t) => t !== tag);
        setCustomTags(updatedCustomTags);
        updateCurrentEmbeddingTags([...selectedBrains, ...updatedCustomTags]);
    };

    const updateCurrentEmbeddingTags = (updatedTags) => {
        setCurrentEmbedding((prevEmbedding) => ({
            ...prevEmbedding,
            tags: updatedTags
        }));
    };

    const handleUpdateEmbedding = () => {
		console.log('UPDATING EMBEDDING', currentEmbedding);
        updateEmbedding(currentEmbedding);
        setShowEditModal(false);
    };

    const closeModal = () => {
        setShowEditModal(false);
        setCurrentEmbedding(null);
        setSelectedBrains([]);
        setCustomTags([]);
        setHasChanges(false);
    };

    return (
        <div className={styles.container}>
            <Navbar />

            <h2>Your Embeddings</h2>

            {/* Tag Filtering Section */}
            <div className={styles.filterContainer}>
                <h3>Filter by Tags</h3>
                <div className={styles.buttonContainer}>
                    <button onClick={handleSelectAllTags} className={styles.selectButton}>Select All</button>
                    <button onClick={handleClearAllTags} className={styles.clearButton}>Clear All</button>
                </div>
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
		

            {/* Embedding List Section */}
            <div className={styles.embeddingList}>
                {filteredEmbeddings.map((embedding, index) => (
                    <div key={embedding.id} className={styles.embeddingItem}>
                        <div className={styles.titleBar}>
                            <div className={styles.titleLeft}>
                                <span>{index + 1}</span>
                            </div>
                            <div className={styles.titleCenter}>
                                <span>Created At: {new Date(embedding.created_at).toLocaleDateString()} | Last Updated: {new Date(embedding.last_updated).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.titleRight}></div>
                        </div>

                        <div className={styles.questionBox}>
                            <label><strong>Question:</strong></label>
                            <textarea
                                value={embedding.question}
                                readOnly
                                rows={3}
                                className={styles.questionText}
                            />
                        </div>

                        <div className={styles.tagBox}>
                            <label><strong>Tags:</strong></label>
                            <p className={styles.tags}>{embedding.tags.join(', ')}</p>
                        </div>

                        <div className={styles.buttonBox}>
                            <button onClick={() => handleEditTags(embedding)} className={styles.editButton}>
                                Edit Tags
                            </button>
                            <button onClick={() => handleDelete(embedding.id)} className={styles.deleteButton}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showEditModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Edit Tags</h3>

                        {/* Question (Read-Only) */}
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Question</label>
                            <input
                                type="text"
                                value={currentEmbedding?.question || ''}
                                className={`${styles.input} ${styles.readOnly}`}
                                readOnly
                            />
                        </div>

                        {/* Editable Answer */}
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Answer</label>
                            <textarea
                                value={currentEmbedding?.answer || ''}
                                onChange={(e) => setCurrentEmbedding({ ...currentEmbedding, answer: e.target.value })}
                                className={styles.textarea}
                            />
                        </div>



                        {/* Custom Tags */}
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Custom Tags</label>
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

                        {/* Update and Cancel Buttons */}
                        <div className={styles.buttonContainer}>
                            <button onClick={handleUpdateEmbedding} className={styles.updateButton} >
                                Update
                            </button>
                            <button onClick={closeModal} className={styles.cancelButton}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEmbeddings;
