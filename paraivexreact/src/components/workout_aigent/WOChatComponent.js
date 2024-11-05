// src/components/WOChatComponent.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWOAigent } from '../../contexts/workout_aigent/WOAigentContext';
import styles from '../../styles/workout_aigent/WOChatComponent.module.css';
import Navbar from './Navbar';
import ChatBot from './../ChatBot';
import { FaLink } from 'react-icons/fa'; // Add this line
import UrlModal from './UrlModal';
import { useNavigate } from 'react-router-dom';

const WOChatComponent = () => {
    const [userPrompt, setUserPrompt] = useState("");
    const [prompt, setPrompt] = useState(""); // Centralized prompt state	
    const [contextList, setContextList] = useState([]);
    const [isPassContext, setIsPassContext] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const checkboxes = [
        { label: 'Internet Search', value: 'internet' },
        { label: 'Pass Context', value: 'context' },
        { label: 'Start New Thread', value: 'new_thread' },
        { label: 'Add Voice', value: 'voice' },
        { label: 'Use Workout Tips', value: 'workout' }
    ];
	
    const [topK, setTopK] = useState(3);
    const [maxResults, setMaxResults] = useState(3);

    const [selectedTags, setSelectedTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [enhancedPrompt, setEnhancedPrompt] = useState("");
    const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
    const [originalResults, setOriginalResults] = useState([]);
    const [displayedResults, setDisplayedResults] = useState([]);
    const [jsonDetected, setJsonDetected] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		fetchWorkouts = () => {},
		addWorkout = () => {},
		editWorkout = () => {},
		deleteWorkout = () => {},
		workouts = [],
		workoutTips = [],
		tags = [],
	} = useWOAigent();
	
    const navigate = useNavigate();
	
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };	
	
    // Fetch tags on mount if they haven't been loaded
//    useEffect(() => {
//        if (!tags.length) {
//            getUserTags();
//        }
//        setAllTags(tags);
//    }, [tags, getUserTags]);	
	
    // Update originalResults when data arrives from the backend
//    useEffect(() => {
//        setOriginalResults(workoutSearchResults);
//        filterResults(workoutSearchResults, topK, similarityThreshold);
//    }, [workoutSearchResults]);

    // Fetch workout tips on initial load
//    useEffect(() => {
//        fetchWorkoutTips(); // Fetch workout tips when the component mounts
//    }, [fetchWorkoutTips]);

    const handleCheckboxChange = (option) => {
        setSelectedOptions((prev) => {
            const updatedOptions = prev.includes(option)
                ? prev.filter((item) => item !== option)
                : [...prev, option];
            return updatedOptions;
        });

        if (option === 'context') {
            setIsPassContext(!selectedOptions.includes(option));
        }
    };
	
    const handleJsonDetected = (detected) => {
        setJsonDetected(detected);
    };
	
    const handleWorkoutClick = () => {
        navigate('/workout-modal');
    };
	
    const filterResults = () => {
        const filtered = originalResults
            .filter(result => result.score >= similarityThreshold)
            .slice(0, topK);
        setDisplayedResults(filtered);
    };	
	
//    useEffect(() => {
//        if (displayedResults.length > 0) {
//            setEnhancedPrompt(enhanceUserPrompt(userPrompt, displayedResults));
//        }
//    }, [displayedResults, userPrompt]);
//
//    useEffect(() => {
//        setMaxResults(topK);
//    }, [topK]);
//
//    useEffect(() => {
//        filterResults();
//    }, [topK, similarityThreshold, originalResults]);
//	
//    useEffect(() => {
//        if (workoutSearchResults.length > 0) {
//            const { formattedPrompt, contextList } = enhanceUserPrompt(userPrompt, workoutSearchResults);
//            setEnhancedPrompt(formattedPrompt);
//            setContextList(contextList);
//        }
//    }, [workoutSearchResults, userPrompt]);	
	
    const enhanceUserPrompt = (userPrompt, similarResponses) => {
        const contextList = similarResponses.map((res, index) => `Tip ${index + 1}: ${res.tip}`);
        return {
            formattedPrompt: `${userPrompt} [\n  ${contextList.join(",\n  ")}\n]`,
            contextList: contextList
        };
    };

    const handleUserPromptChange = (value) => {
        setUserPrompt(value);
        setPrompt(value);
    };

    const handleSendEnhancedPrompt = () => {
        setPrompt(enhancedPrompt);
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => prev.includes(tag)
            ? prev.filter(t => t !== tag)
            : [...prev, tag]);
    };

    const selectAllTags = () => setSelectedTags(allTags);
    const clearAllTags = () => setSelectedTags([]);

    const handleSearch = async () => {
//        await performWorkoutSearch(userPrompt, selectedTags, topK, similarityThreshold);
    };

    const adjustTextareaHeight = (event) => {
        event.target.style.height = "auto";
        event.target.style.height = `${event.target.scrollHeight}px`;
    };

    return (
        <div className={styles.chatContainer}>
            <Navbar />

            {/* Checkboxes Section */}
            <div className={styles.checkboxGroup}>
                {checkboxes.map((checkbox, index) => (
                    <div key={index} className={styles.checkboxContainer}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                value={checkbox.value}
                                checked={selectedOptions.includes(checkbox.value)}
                                onChange={() => handleCheckboxChange(checkbox.value)}
                            />
                            {checkbox.label}
                        </label>
                        {checkbox.value === 'internet' && workoutTips.length > 0 && (
                            <div className={styles.iconContainer} onClick={toggleModal}>
                                <FaLink title="Tips available" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Chatbot Section */}
            <ChatBot
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={() => handleSendEnhancedPrompt()}
                onJsonDetected={handleJsonDetected}
                selectedOptions={selectedOptions}
                contextList={isPassContext ? contextList : []}
            />

            {/* Workout Search Section */}
            <div className={styles.searchSection}>
                <label htmlFor="userPrompt">Enter your question:</label>
                <input
                    type="text"
                    id="userPrompt"
                    value={userPrompt}
                    onChange={(e) => handleUserPromptChange(e.target.value)}
                    className={styles.input}
                    placeholder="Type your workout question here..."
                />

                {/* Tag Selection */}
                <div className={styles.tagSection}>
                    <h3>Select Tags</h3>
                    <button onClick={selectAllTags} className={styles.selectButton}>Select All</button>
                    <button onClick={clearAllTags} className={styles.clearButton}>Clear All</button>
                    <div className={styles.tagOptions}>
                        {tags.map(tag => (
                            <label key={tag} className={styles.tagLabel}>
                                <input
                                    type="checkbox"
                                    checked={selectedTags.includes(tag)}
                                    onChange={() => handleTagToggle(tag)}
                                />
                                {tag}
                            </label>
                        ))}
                    </div>
                </div>

                <label htmlFor="topK">Top K Results:</label>
                <input
                    type="number"
                    id="topK"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className={styles.input}
                    min={0}
                />
                <label htmlFor="similarityThreshold">Similarity Threshold:</label>
                <input
                    type="number"
                    id="similarityThreshold"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                    className={styles.input}
                    min={0}
                    max={1}
                    step={0.1}
                />
                <div className={styles.submitButtonContainer}>
                    <button onClick={handleSearch} className={styles.searchButton}>Submit</button>
                </div>
            </div>

            {/* Enhanced Prompt Section */}
            <div className={styles.enhancedPromptSection}>
                <h3>Enhanced Prompt</h3>
                <textarea
                    value={enhancedPrompt}
                    onChange={(e) => {
                        setEnhancedPrompt(e.target.value);
                        adjustTextareaHeight(e);
                    }}
                    className={styles.enhancedPrompt}
                />
                <div className={styles.sendEnhancedPromptContainer}>
                    <button onClick={handleSendEnhancedPrompt} className={styles.sendEnhancedPromptButton}>
                        Send Enhanced Prompt
                    </button>
                </div>
            </div>
            <div className={styles.resultsSection}>
                {displayedResults.length > 0 ? (
                    displayedResults.map((result, index) => (
                        <div key={result.id || index} className={styles.resultItem}>
                            <p><strong>Workout:</strong> {result.workout}</p>
                            <p><strong>Tip:</strong> {result.tip}</p>
                            <p><strong>Score:</strong> {result.score}</p>
                        </div>
                    ))
                ) : (
                    <p>No results found. Try adjusting your query or tags.</p>
                )}
            </div>

            {/* URL Modal */}
            {isModalOpen && <UrlModal urls={workoutTips} onClose={toggleModal} />}
        </div>
    );
};

export default WOChatComponent;
