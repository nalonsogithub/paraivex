// src/components/StageEmbeddings.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/StageEmbeddings.module.css';
import Navbar from './Navbar';


const StageEmbeddings = () => {
    const { auth, tags, getUserTags } = useAuth(); // Fetch tags from AuthContext
    const [selectedTags, setSelectedTags] = useState([]); // Track selected tags

    useEffect(() => {
        if (auth) {
            getUserTags(auth.username); // Fetch tags when component mounts
        }
    }, [auth, getUserTags]);

    // Handle selection of individual tags
    const handleTagChange = (tag) => {
        setSelectedTags((prevSelected) =>
            prevSelected.includes(tag)
                ? prevSelected.filter((t) => t !== tag)
                : [...prevSelected, tag]
        );
    };

    // Select all tags
    const handleSelectAll = () => {
        setSelectedTags(tags);
    };

    // Clear all selected tags
    const handleClearAll = () => {
        setSelectedTags([]);
    };

    return (
        <div className={styles.container}>
			<Navbar />

            <h3 className={styles.title}>Select Tags to Load Embeddings</h3>

            <div className={styles.buttonContainer}>
                <button onClick={handleSelectAll} className={styles.selectButton}>Select All</button>
                <button onClick={handleClearAll} className={styles.clearButton}>Clear All</button>
            </div>

            <div className={styles.tagsContainer}>
                {tags.map((tag, index) => (
                    <div key={index} className={styles.tagItem}>
                        <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => handleTagChange(tag)}
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
    );
};

export default StageEmbeddings;
