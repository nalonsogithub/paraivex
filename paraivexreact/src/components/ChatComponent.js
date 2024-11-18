// src/components/ChatComponent.js
import React, { useState, useEffect  } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/ChatComponent.module.css';
import Navbar from './Navbar';
import ChatBot from './ChatBot';
import { FaLink } from 'react-icons/fa'; // Add this line
import UrlModal from './UrlModal';
import { useNavigate } from 'react-router-dom';

const ChatComponent = () => {
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
        { label: 'Use Image Model', value: 'image' }
    ];
	
    const [topK, setTopK] = useState(3);
	const [selectedTags, setSelectedTags] = useState([]);
	const [allTags, setAllTags] = useState([]);
	const [enhancedPrompt, setEnhancedPrompt] = useState("");
	const { brains, performSimilaritySearch, similaritySearchResults, setResponseEmbeddings, tags, getUserTags, fetchBingUrls, bingUrls  } = useAuth();
	const [cosineSimilarityThreshold, setCosineSimilarityThreshold] = useState(0.7);
	const [originalResults, setOriginalResults] = useState([]);
	const [displayedResults, setDisplayedResults] = useState([]);
	const [maxResults, setMaxResults] = useState(3);
	const [jsonDetected, setJsonDetected] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const navigate = useNavigate();
	

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };	
	
    // Fetch tags on mount if they haven't been loaded
    useEffect(() => {
        if (!tags.length) {
            getUserTags();
        }
		setAllTags(tags);
    }, [tags, getUserTags]);	
	
	// Update originalResults when data arrives from the backend
	useEffect(() => {
		// Assuming similaritySearchResults is the response data from Flask
		setOriginalResults(similaritySearchResults);
		filterResults(similaritySearchResults, maxResults, cosineSimilarityThreshold);
	}, [similaritySearchResults]);
	
    // Fetch URLs on initial load
    useEffect(() => {
        fetchBingUrls(); // Fetch URLs when the component mounts
    }, [fetchBingUrls]);
	
	// Hanlde when a user clicks the search augmentation checkbox
//    const handleCheckboxChange = (option) => {
//        setSelectedOptions((prev) =>
//            prev.includes(option)
//                ? prev.filter((item) => item !== option)
//                : [...prev, option]
//        );
//    };
	const handleCheckboxChange = (option) => {
		setSelectedOptions((prev) => {
			const updatedOptions = prev.includes(option)
				? prev.filter((item) => item !== option)
				: [...prev, option];
			console.log('Updated selectedOptions:', updatedOptions);
			return updatedOptions;
		});

		// Ensure isPassContext is updated when the 'Pass Context' checkbox is clicked
		if (option === 'context') {
			setIsPassContext(!selectedOptions.includes(option));
		}
	};
	
	
    // Callback function to be called by ChatBot when JSON is detected
    const handleJsonDetected = (detected) => {
      setJsonDetected(detected);
    };
	
    const handleEmbeddingClick = () => {
        navigate('/embedding-modal');
    };
	
	// Filtering function
	const filterResults = () => {
//		console.log("Filtering with maxResults:", maxResults, "and cosineSimilarityThreshold:", cosineSimilarityThreshold);

		const filtered = originalResults
			.filter(result => result.score >= cosineSimilarityThreshold)
			.slice(0, maxResults);

//		console.log("Filtered Results:", filtered);
		setDisplayedResults(filtered);
	};	
	
	useEffect(() => {
		if (displayedResults.length > 0) {
			setEnhancedPrompt(enhanceUserPrompt(userPrompt, displayedResults));
		}
	}, [displayedResults, userPrompt]);	

	
	useEffect(() => {
		setMaxResults(topK);
	}, [topK]);	
	
	useEffect(() => {
		filterResults();
	}, [maxResults, cosineSimilarityThreshold, originalResults]);	
	
	
	useEffect(() => {
		if (similaritySearchResults.length > 0) {
			const { formattedPrompt, contextList } = enhanceUserPrompt(userPrompt, similaritySearchResults);
			setEnhancedPrompt(formattedPrompt); // Set the enhanced prompt
			console.log('setting context_list', contextList);
			setContextList(contextList); // Set the context list for passing to ChatBot
		}
	}, [similaritySearchResults, userPrompt]);	
	

	const enhanceUserPrompt = (userPrompt, similarResponses) => {
		const contextList = similarResponses
			.map((res, index) => `Context ${index + 1}: ${res.answer}`); // Each item as a list element

		// Return both the formatted user prompt and the context list
		return {
			formattedPrompt: `${userPrompt} [\n  ${contextList.join(",\n  ")}\n]`,
			contextList: contextList
		};
	};
	
	// Update prompt and userPrompt in sync
	const handleUserPromptChange = (value) => {
		console.log('Updating userPrompt and prompt:', value);
		setUserPrompt(value); // Update userPrompt state
		setPrompt(value); // Ensure prompt remains in sync
	};
	
	
	const handleSendEnhancedPrompt = () => {
		console.log('in handleSendEnhancedPrompt', enhancedPrompt);
		setPrompt(enhancedPrompt);
	};
	
	
//    const handleUserPromptChange = (value) => {
//        setUserPrompt(value);
//    };


	const handleEnhancePrompt = (similarResponses) => {
        const { formattedPrompt, contextList } = enhanceUserPrompt(userPrompt, similarResponses);
        setUserPrompt(formattedPrompt);
        setContextList(contextList);
    };	
	
	
    const handleTagToggle = (tag) => {
        setSelectedTags(prev => prev.includes(tag)
            ? prev.filter(t => t !== tag)
            : [...prev, tag]);
    };

    const selectAllTags = () => setSelectedTags(allTags);
    const clearAllTags = () => setSelectedTags([]);	
	
    // Function to handle user prompt submission
    const handleSearch = async () => {
        await performSimilaritySearch(userPrompt, selectedTags, topK, cosineSimilarityThreshold);
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

                        {/* Display an icon below the "Internet Search" checkbox if there are URLs */}
                        {checkbox.value === 'internet' && bingUrls.length > 0 && (
                            <div className={styles.iconContainer}  onClick={toggleModal}>
                                <FaLink title="URLs available" />
                            </div>
                        )}

                    </div>
                ))}
            </div>

            {/* Chatbot Section */}
			<ChatBot
				prompt={prompt}
				setPrompt={(value) => {
				    console.log('ChatBot setPrompt:', value);
					setPrompt(value); // Update centralized prompt state
					setUserPrompt(value); // Keep userPrompt in sync
				}}
				onSubmit={() => handleSendEnhancedPrompt()} // Triggered when enhanced prompt is sent
				onJsonDetected={handleJsonDetected}
				selectedOptions={selectedOptions}
				contextList={isPassContext ? contextList : []}
			/>

            {/* Similarity Search Section */}
		  <div className={styles.header}>
			<div className={styles.leftSpace}></div>
			<div className={styles.title}>
			  <h2>Chat with Similarity Search</h2>
				{/* Render modal when open */}
				{/* isModalOpen && <EmbeddingModal onClose={() => setIsModalOpen(false)} />*/ }
			</div>
			<div className={styles.jsonButtonContainer}>
			  {jsonDetected && (
				<button 
				  className={styles.jsonButton} 
				  onClick={() => handleEmbeddingClick()}
				>
				  ⚙️ {/* You can replace this with any symbol, such as 🛠️ or 📜 */}
				</button>
			  )}
			</div>
		  </div>

            <div className={styles.searchSection}>
                <label htmlFor="userPrompt">Enter your question:</label>
                <input
                    type="text"
                    id="userPrompt"
                    value={userPrompt}
                    onChange={(e) => handleUserPromptChange(e.target.value)}
                    className={styles.input}
                    placeholder="Type your question here..."
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
					onChange={(e) => {
						const newValue = Number(e.target.value);
						setTopK(newValue);
					}}
                    className={styles.input}
                    min={0}
                />
                <label htmlFor="cosineSimilarityThreshold">Cosine Similarity Threshold:</label>
                <input
                    type="number"
                    id="cosineSimilarityThreshold"
                    value={cosineSimilarityThreshold}
                    onChange={(e) => setCosineSimilarityThreshold(Number(e.target.value))}
                    className={styles.input}
                    min={0}
                    max={1}
                    step={0.1}
                />
				<div className={styles.SubmitButtonContainer}>
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
							<p><strong>Question:</strong> {result.question}</p>
							<p><strong>Answer:</strong> {result.answer}</p>
							<p><strong>Score:</strong> {result.score}</p>
						</div>
					))
				) : (
					<p>No results found. Try adjusting your query or tags.</p>
				)}
			</div>

            {/* URL Modal */}
            {isModalOpen && <UrlModal urls={bingUrls} onClose={toggleModal} />}

        </div>
    );
};

export default ChatComponent;
