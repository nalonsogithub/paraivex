// src/contexts/EmbeddingAigentContext.js
import React, { createContext, useState, useContext, useEffect, useCallback   } from 'react';
import getBaseURL from '../../config';
import { useAuth } from '../AuthContext';

const EmbeddingAigentContext = createContext();

export const EmbeddingAigentProvider  = ({ children }) => {
	const { auth, setAuth } = useAuth();
    const [brains, setBrains] = useState([]);
    const [configurations, setConfigurations] = useState([]);
	const [similaritySearchResults, setSimilaritySearchResults] = useState([]);
    const baseURL = getBaseURL();
	const [responseEmbeddings, setResponseEmbeddings] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
	const [tags, setTags] = useState([]);
	const [followup, setFollowup] = useState('');
	const [bingUrls, setBingUrls] = useState([]);
	
    // Function to add a new message to chat history
    const updateChatHistory = (newMessage) => {
        setChatHistory((prevHistory) => [...prevHistory, newMessage]);
    };

    // Optional: Function to clear the chat history
    const clearChatHistory = () => {
        setChatHistory([]);
    };
	
    // Function to fetch BING_URLS from Flask
	// Inside your AuthContext component:
	const fetchBingUrls = useCallback(async () => {
		console.log('In Fethcing URLS');
		try {
			const response = await fetch(`${baseURL}/api/get_bing_urls`);
			if (response.ok) {
				const data = await response.json();
				setBingUrls(data); // Update state with the fetched URLs
				console.log("Fetched BING URLs:", data);
			} else {
				console.error("No BING URLs available");
			}
		} catch (error) {
			console.error("Error fetching BING URLs:", error);
		}
	}, [baseURL, setBingUrls]);

	

    // Function to fetch user documents from the backend
	const fetchUserDocuments = async () => {
		if (!auth?.username) return;  // Only fetch if user is authenticated

		try {
			const response = await fetch(`${baseURL}/api/get_user_config?username=${auth.username}`);
			const data = await response.json();

			if (data.success) {
				setBrains(data.brains || []);
				setConfigurations(data.configurations || []);
			} else {
				console.error("Failed to fetch user documents:", data.message);
			}
		} catch (error) {
			console.error("Error fetching user documents:", error);
		}
	};
	const getUserTags = useCallback(async (username) => {
		if (!username) return [];
		try {
			const response = await fetch(`${baseURL}/api/get_user_tags?username=${username}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();

			if (data.success) {
				setTags(data.tags);  // Update the context with retrieved tags
				return data.tags;
			} else {
				console.error("Failed to retrieve tags:", data.message);
				return [];
			}
		} catch (error) {
			console.error("Error retrieving tags:", error);
			return [];
		}
	}, [baseURL]); // Dependency array includes `baseURL` to re-memoize if it changes

	const getEmbeddings = async (username, tags = []) => {
		try {
			const tagsQuery = tags.length > 0 ? `&tags=${tags.join(",")}` : "";
			const response = await fetch(`${baseURL}/api/get_user_embeddings?username=${username}${tagsQuery}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();

			if (data.success) {
				return data.documents;
			} else {
				console.error("Failed to retrieve embeddings:", data.message);
				return [];
			}
		} catch (error) {
			console.error("Error retrieving embeddings:", error);
			return [];
		}
	};

    const deleteEmbedding = async (doc_id) => {
        try {
            const response = await fetch(`${baseURL}/api/delete_embedding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ doc_id })
            });

            const data = await response.json();
            if (data.success) {
                return { success: true };
            } else {
                console.error("Failed to delete embedding:", data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Error deleting embedding:", error);
            return { success: false, message: "Network error occurred" };
        }
    };

    // Function to submit embedding data to Flask route
    const submitEmbedding = async (embeddingData) => {
        if (!auth?.username) {
            console.error("User is not authenticated");
            return { success: false, message: "User not authenticated" };
        }

        try {
            const response = await fetch(`${baseURL}/api/add_embedding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...embeddingData, username: auth.username })
            });

            const data = await response.json();
            return data;

        } catch (error) {
            console.error("Error saving embedding:", error);
            return { success: false, message: "Network error occurred" };
        }
    };
	

    const submitChanges = async () => {
        // Prepare brains with tags and filter out entries with empty names
        const processedBrains = brains
            .filter((brain) => brain.name)
            .map((brain) => ({
                ...brain,
                tags: `brain_${brain.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
            }));

        // Prepare configurations with tags and set default values
        const processedConfigurations = configurations
            .filter((config) => config.name)
            .map((config) => ({
                ...config,
                tags: `config_${config.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                minResults: config.minResults || 1,
                maxResults: config.maxResults || 3,
                searchDepth: config.searchDepth || "shallow",
                similarityThreshold: config.similarityThreshold || 0.5,
            }));

        const payload = {
            username: auth?.username,
            brains: processedBrains,
            configurations: processedConfigurations,
        };

        try {
            const response = await fetch(`${baseURL}/api/update_user_config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error saving data:", error);
            return { success: false };
        }
    };

    const updateEmbedding = async (embedding) => {
        try {
            const response = await fetch(`${baseURL}/api/update_embedding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(embedding),
            });
            const data = await response.json();
        } catch (error) {
            console.error("Error updating embedding:", error);
        }
    };

	const performSimilaritySearch = async (userPrompt, tags, top_k, cosine_similarity_threshold) => {
		try {

			const response = await fetch(`${baseURL}/api/similarity_search`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userPrompt,
					tags,
					top_k,
					cosine_similarity_threshold
				}),
			});

			const data = await response.json();


			if (data.results) {
				setSimilaritySearchResults(data.results);
			} else {
				console.error("Failed to retrieve results:", data.message);
			}
		} catch (error) {
			console.error("Error during similarity search:", error);
		}
	};


    return (
        <EmbeddingAigentContext.Provider
            value={{
                submitChanges,
                fetchUserDocuments,
				submitEmbedding,
				deleteEmbedding,
				getEmbeddings,
                updateEmbedding,
				performSimilaritySearch,
				similaritySearchResults, 
                responseEmbeddings, 
                setResponseEmbeddings,
				chatHistory, 
				updateChatHistory, 
				clearChatHistory,
				getUserTags,
			    tags,
				followup, 
				setFollowup,
				bingUrls,
        		fetchBingUrls,
            }}
        >
            {children}
        </EmbeddingAigentContext.Provider>
    );
};



export const useEmbeddingAigent  = () => useContext(EmbeddingAigentContext);
