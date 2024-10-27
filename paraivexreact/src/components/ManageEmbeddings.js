import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/ManageEmbeddings.module.css';
import Navbar from './Navbar';


const ManageEmbeddings = () => {
    const { auth, brains, getEmbeddings, deleteEmbedding, updateEmbeddingTags, updateEmbedding } = useAuth();
    const [embeddings, setEmbeddings] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentEmbedding, setCurrentEmbedding] = useState(null);
    const [initialEmbedding, setInitialEmbedding] = useState(null);  // Track initial state
    const [hasChanges, setHasChanges] = useState(false);  // Track changes for update button
	
    const [selectedBrains, setSelectedBrains] = useState([]);
    const [customTags, setCustomTags] = useState([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (auth?.username) {
            fetchEmbeddings(auth.username);
        }
    }, [auth]);

    // Track changes to enable or disable the "Update" button
    useEffect(() => {
        if (currentEmbedding) {
            const isChanged = initialEmbedding !== JSON.stringify(currentEmbedding);
            setHasChanges(isChanged);
        }
    }, [currentEmbedding, selectedBrains, customTags]);			
			
    const handleUpdateEmbedding = () => {
        updateEmbedding(currentEmbedding); // Calls the function to update embedding in backend
        setShowEditModal(false);
    };			
			
    const fetchEmbeddings = async (username) => {
        const documents = await getEmbeddings(username);
        setEmbeddings(documents);
    };

    const handleDelete = async (doc_id) => {
        const result = await deleteEmbedding(doc_id);
        if (result.success) {
            setEmbeddings(embeddings.filter((embedding) => embedding.id !== doc_id));
        } else {
            alert(`Failed to delete embedding: ${result.message}`);
        }
    };

    const handleEditTags = (embedding) => {
        setCurrentEmbedding(embedding);
        setSelectedBrains(
            embedding.tags.filter(tag => tag.startsWith("brain_"))
        );
        setCustomTags(
            embedding.tags.filter(tag => !tag.startsWith("brain_"))
        );
        setShowEditModal(true);
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






    const handleUpdateTags = async () => {
        const updatedTags = [...selectedBrains, ...customTags];
        const result = await updateEmbeddingTags(currentEmbedding.id, updatedTags);

        if (result.success) {
            setEmbeddings(embeddings.map((embedding) =>
                embedding.id === currentEmbedding.id ? { ...embedding, tags: updatedTags } : embedding
            ));
            setShowEditModal(false);
        } else {
            alert(`Failed to update tags: ${result.message}`);
        }
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
            <div className={styles.embeddingList}>
                {embeddings.map((embedding) => (
                    <div key={embedding.id} className={styles.embeddingItem}>
                        <p><strong>Question:</strong> {embedding.question}</p>
                        <p><strong>Tags:</strong> {embedding.tags.join(', ')}</p>
                        <button onClick={() => handleEditTags(embedding)} className={styles.editButton}>Edit Tags</button>
                        <button onClick={() => handleDelete(embedding.id)} className={styles.deleteButton}>Delete</button>
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

						{/* Brain Tag Selection */}
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Associate with Brains</label>
							<div className={styles.multiSelect}>
								{brains.map((brain, index) => {
									const brainTag = `brain_${brain.brainName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
									return (
										<div key={index} className={styles.brainOption}>
											<input
												type="checkbox"
												checked={selectedBrains.includes(brainTag)}
												onChange={() => handleBrainSelection(brainTag)}
												className={styles.checkbox}
											/>
											<label className={styles.brainLabel}>{brain.brainName || 'Unnamed Brain'}</label>
										</div>
									);
								})}
							</div>
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
						<button onClick={handleUpdateEmbedding} className={styles.updateButton} disabled={!hasChanges}>
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
