// src/components/ChatComponent.js
import React, { useState, useEffect  } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/ChatComponent.module.css';
import Navbar from './Navbar';
import ChatBot from './ChatBot';
//import EmbeddingModal from './EmbeddingModal';
import { useNavigate } from 'react-router-dom';

const ChatComponent = () => {
    const [userPrompt, setUserPrompt] = useState("");
    const [prompt, setPrompt] = useState(""); // Centralized prompt state	
    const [tags, setTags] = useState([]);  // Allow the user to select tags
    const [topK, setTopK] = useState(3);
	const [selectedTags, setSelectedTags] = useState([]);
	const [allTags, setAllTags] = useState([]);
	const [enhancedPrompt, setEnhancedPrompt] = useState("");
	const { brains, performSimilaritySearch, similaritySearchResults, setResponseEmbeddings  } = useAuth();
	const [cosineSimilarityThreshold, setCosineSimilarityThreshold] = useState(0.7);
	const [originalResults, setOriginalResults] = useState([]);
	const [displayedResults, setDisplayedResults] = useState([]);
	const [maxResults, setMaxResults] = useState(3);
	const [jsonDetected, setJsonDetected] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const navigate = useNavigate();
	
	
	// Update originalResults when data arrives from the backend
	useEffect(() => {
		// Assuming similaritySearchResults is the response data from Flask
		setOriginalResults(similaritySearchResults);
		filterResults(similaritySearchResults, maxResults, cosineSimilarityThreshold);
	}, [similaritySearchResults]);
	
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
			setEnhancedPrompt(enhanceUserPrompt(userPrompt, similaritySearchResults));
		}
	}, [similaritySearchResults]);
	
	
	useEffect(() => {
		brains.forEach((brain, index) => {
//			console.log(`Brain ${index}:`, brain);
		});

		const tags = brains.flatMap(brain => brain.tags || []);

		const uniqueTags = [...new Set(tags)];

		setAllTags(uniqueTags);
	}, [brains]);
	

const enhanceUserPrompt = (userPrompt, similarResponses) => {
    const contextList = similarResponses
        .map((res, index) => `Context ${index + 1}: ${res.answer}`); // Each item as a list element

    // Format the user prompt with the contexts as a list
    return `${userPrompt} [\n  ${contextList.join(",\n  ")}\n]`;
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
		if (selectedTags.length === 0) {
			alert("Please select at least one tag before searching.");
			return;
		}		
        await performSimilaritySearch(userPrompt, selectedTags, topK, cosineSimilarityThreshold);
    };
	
    // Synchronize userPrompt and prompt
    const handleUserPromptChange = (value) => {
        setUserPrompt(value);
        setPrompt(value); // Keep prompt in sync with userPrompt
    };
	
	
	const handleSendEnhancedPrompt = () => {
//		console.log("Enhanced Prompt sent:", enhancedPrompt);
		setPrompt(enhancedPrompt);
		// Future implementation for sending or processing the enhanced prompt
	};
	
	const adjustTextareaHeight = (event) => {
		event.target.style.height = "auto";
		event.target.style.height = `${event.target.scrollHeight}px`;
	};	
    return (
        <div className={styles.chatContainer}>
		    <Navbar />
            <ChatBot
                prompt={prompt}
                setPrompt={setPrompt} // Pass setPrompt to allow updates from ChatBot
                onSubmit={() => handleSendEnhancedPrompt()} // Triggered when enhanced prompt is sent
				onJsonDetected={handleJsonDetected}
            />

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
						{allTags.map(tag => (
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

        </div>
    );
};

export default ChatComponent;
