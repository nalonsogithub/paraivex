// src/components/MainUserPage.js
import React, { useState, useEffect  } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/MainUserPage.module.css';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const MainUserPage = () => {
    const {
		auth,
        brains,
        configurations,
        addBrain,
        updateBrain,
        deleteBrain,
        addConfiguration,
        updateConfiguration,
        deleteConfiguration,
		submitChanges,
		fetchUserDocuments, 
		tags,
		getUserTags
    } = useAuth();
	
	const navigate = useNavigate();

	
	
    const [formattedNames, setFormattedNames] = useState(brains.map(() => ''));
	const [formattedConfigNames, setFormattedConfigNames] = useState(configurations.map(() => ''));
	
	
    const handleConfigNameChange = (index, name) => {
        const formatted = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const newFormattedConfigNames = [...formattedConfigNames];
        newFormattedConfigNames[index] = formatted;
        setFormattedConfigNames(newFormattedConfigNames);
        updateConfiguration(index, { ...configurations[index], name });
    };
	
    const handleBrainNameChange = (index, name) => {
        const formatted = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const newFormattedNames = [...formattedNames];
        newFormattedNames[index] = formatted;
        setFormattedNames(newFormattedNames);
        updateBrain(index, { name, description: brains[index].description });
    };

    const handleBrainDescriptionChange = (index, description) => {
        updateBrain(index, { name: brains[index].name, description });
    };

    const addNewBrain = () => {
        addBrain();
        setFormattedNames([...formattedNames, '']); // Add blank formatted name for new brain
    };
	
    const addNewConfiguration = () => {
        addConfiguration();
        setFormattedConfigNames([...formattedConfigNames, '']);
    };	
	
	useEffect(() => {
		if (auth) {
//			console.log("Fetching user documents for user:", auth.username);  // Log the username
			fetchUserDocuments();
		}
	}, [auth]);

	
    return (
        <div className={styles.container}>
			<Navbar />
            {/* Brains Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Brains</h3>
                {brains.map((brain, index) => (
                    <div key={index} className={styles.tile}>
                        <div className={styles.tileHeader}>
                            <div className={styles.tileIndex}>{index + 1}</div>
                            <div className={styles.formattedText}>
                                Formatted Tag: <strong>{`brain_${formattedNames[index]}`}</strong>
                            </div>
                            <button onClick={() => deleteBrain(index)} className={styles.deleteButton}>X</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Brain Name"
                            value={brain.brainName}
                            onChange={(e) => handleBrainNameChange(index, e.target.value)}
                            className={styles.inputField}
                        />
                        <textarea
                            placeholder="Brain Description"
                            value={brain.description}
                            onChange={(e) => handleBrainDescriptionChange(index, e.target.value)}
                            className={styles.textareaField}
                        />
                    </div>
                ))}
                <button onClick={addNewBrain} className={styles.addButton}>Add Brain</button>
            </div>


            {/* Configurations Section */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Configurations</h3>
                {configurations.map((config, index) => (
                    <div key={index} className={styles.tile}>
                        <div className={styles.tileHeader}>
                            <div className={styles.tileIndex}>{index + 1}</div>
                            <div className={styles.formattedText}>
                                Config Tag: <strong>{`config_${formattedConfigNames[index]}`}</strong>
                            </div>
                            <button onClick={() => deleteConfiguration(index)} className={styles.deleteButton}>X</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Configuration Name"
                            value={config.configName}
                            onChange={(e) => handleConfigNameChange(index, e.target.value)}
                            className={styles.inputField}
                        />

                        <div className={styles.labelDiv}>Cosine Similarity Threshold (0.0 - 1.0)</div>
                        <input
                            type="number"
                            placeholder="0.0 to 1.0"
                            value={config.similarityThreshold}
                            min="0"
                            max="1"
                            step="0.01"
                            onChange={(e) => updateConfiguration(index, { ...config, similarityThreshold: parseFloat(e.target.value) })}
                            className={styles.inputField}
                        />

                        <input
                            type="number"
                            placeholder="Minimum Results"
                            value={config.minResults}
                            onChange={(e) => updateConfiguration(index, { ...config, minResults: parseInt(e.target.value) })}
                            className={styles.inputField}
                        />

                        <input
                            type="number"
                            placeholder="Maximum Results"
                            value={config.maxResults}
                            onChange={(e) => updateConfiguration(index, { ...config, maxResults: parseInt(e.target.value) })}
                            className={styles.inputField}
                        />

                        <div className={styles.labelDiv}>Search Depth</div>
                        <select
                            value={config.searchDepth}
                            onChange={(e) => updateConfiguration(index, { ...config, searchDepth: e.target.value })}
                            className={styles.selectField}
                        >
                            <option value="shallow">Shallow</option>
                            <option value="medium">Medium</option>
                            <option value="deep">Deep</option>
                        </select>
                    </div>
                ))}
                <button onClick={addNewConfiguration} className={styles.addButton}>Add Configuration</button>
            </div>

			<button onClick={() => submitChanges().then(response => {
				if (response.success) {
					alert("Data saved successfully!");
				} else {
					alert("Failed to save data.");
				}
			})} className={styles.saveButton}>
				Save Data
			</button>
        </div>
    );
};

export default MainUserPage;
