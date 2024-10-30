// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect  } from 'react';
import getBaseURL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [brains, setBrains] = useState([]);
    const [configurations, setConfigurations] = useState([]);
	const [similaritySearchResults, setSimilaritySearchResults] = useState([]);
    const baseURL = getBaseURL();
	const [responseEmbeddings, setResponseEmbeddings] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
	const [tags, setTags] = useState([]);
	const [followup, setFollowup] = useState('');
    // Function to add a new message to chat history
    const updateChatHistory = (newMessage) => {
        setChatHistory((prevHistory) => [...prevHistory, newMessage]);
    };

    // Optional: Function to clear the chat history
    const clearChatHistory = () => {
        setChatHistory([]);
    };
	
	
    // Function to fetch user documents from the backend
	const fetchUserDocuments = async () => {
		if (!auth?.username) return;  // Only fetch if user is authenticated

		try {
			const response = await fetch(`${baseURL}/api/get_user_config?username=${auth.username}`);
			const data = await response.json();

			if (data.success) {
				setBrains(data.brains || []);
				setConfigurations(data.configurations || []);
//				console.log("Fetched Brains in AuthContext:", data.brains);  // Log fetched brains
//				console.log("Fetched Configurations in AuthContext:", data.configurations);  // Log Fetched configurations
			} else {
				console.error("Failed to fetch user documents:", data.message);
			}
		} catch (error) {
			console.error("Error fetching user documents:", error);
		}
	};

    const getUserTags = async (username) => {
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
    };
	const getEmbeddings = async (username, tags = []) => {
//		console.log("Calling getEmbeddings for username:", username);  // Debug log
		try {
			const tagsQuery = tags.length > 0 ? `&tags=${tags.join(",")}` : "";
			const response = await fetch(`${baseURL}/api/get_user_embeddings?username=${username}${tagsQuery}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
//			console.log("Data received from server:", data);  // Debug log

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
//                console.log("Embedding deleted successfully");
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
//            if (data.success) {
//                console.log("Embedding saved successfully:", data);
//            } else {
//                console.error("Failed to save embedding:", data.message);
//            }
            return data;

        } catch (error) {
            console.error("Error saving embedding:", error);
            return { success: false, message: "Network error occurred" };
        }
    };
	
	const login = (username, password) => {
		return fetch(`${baseURL}/api/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		})
		.then(response => {
			if (response.status === 401) {
				// Handle 401 Unauthorized without logging an error
				return { success: false, message: "Invalid username or password." };
			} else if (!response.ok) {
				// Handle other non-OK statuses
				return { success: false, message: "Login failed due to server error" };
			}
			return response.json();
		})
		.then(data => {
			if (data.success) {
				// Set auth state with username and tags directly from the response
				setAuth({ username: data.username, tags: data.tags });
			}
			return data;
		})
		.catch(() => {
			// Handle network errors without logging
			return { success: false, message: "Network error during login" };
		});
	};
	
	// src/contexts/AuthContext.js
	const signup = (username, password, nda) => {
//		console.log("Signup function called with:", { username, password });  // Debug print

		return fetch(`${baseURL}/api/signup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password, nda }),
		})
			.then(response => {
//				console.log("Fetch response received:", response);  // Debug print
				if (!response.ok) {
					console.error("Fetch response not OK:", response.statusText);
					throw new Error("Signup request failed");
				}
				return response.json();
			})
			.then(data => {
//				console.log("Data parsed from JSON response:", data);  // Debug print
				return data;
			})
			.catch(error => {
				console.error("Error during signup request:", error);  // Error print
				return { success: false, message: "Signup failed due to network error" };
			});
	};


    const addBrain = () => setBrains([...brains, { name: '', description: '' }]);

    const updateBrain = (index, updatedBrain) => {
        setBrains(brains.map((brain, i) => (i === index ? updatedBrain : brain)));
    };

    const deleteBrain = (index) => {
        setBrains(brains.filter((_, i) => i !== index));
    };

    const addConfiguration = () => setConfigurations([...configurations, { name: '', similarityThreshold: 0.8 }]);

    const updateConfiguration = (index, updatedConfig) => {
        setConfigurations(configurations.map((config, i) => (i === index ? updatedConfig : config)));
    };

    const deleteConfiguration = (index) => {
        setConfigurations(configurations.filter((_, i) => i !== index));
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
//            if (data.success) {
//                console.log("Embedding updated successfully.");
//            } else {
//                console.error("Failed to update embedding:", data.message);
//            }
        } catch (error) {
            console.error("Error updating embedding:", error);
        }
    };

	const performSimilaritySearch = async (userPrompt, tags, top_k, cosine_similarity_threshold) => {
		try {
//			console.log("Calling similarity search with params:", {
//				userPrompt, tags, top_k, cosine_similarity_threshold
//			});

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

//			console.log("Response status:", response.status);
			const data = await response.json();

//			console.log("Received data:", data);

			if (data.results) {
				setSimilaritySearchResults(data.results);
			} else {
				console.error("Failed to retrieve results:", data.message);
			}
		} catch (error) {
			console.error("Error during similarity search:", error);
		}
	};
	const logout = () => {
		// Optionally, make a request to Flask to handle server-side session management if needed
		setAuth(null);                // Clear authentication state
		setBrains([]);                // Reset brains data
		setConfigurations([]);        // Reset configurations data
		setSimilaritySearchResults([]); // Clear similarity search results
		setResponseEmbeddings([]);     // Clear response embeddings
		setChatHistory([]);            // Clear chat history
		setTags([]);                   // Clear tags
	};

    return (
        <AuthContext.Provider
            value={{
                auth,
                login,
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
				submitEmbedding,
				deleteEmbedding,
				getEmbeddings,
                updateEmbedding,
				performSimilaritySearch,
				similaritySearchResults, 
                responseEmbeddings, 
                setResponseEmbeddings,
				signup, 
				chatHistory, 
				updateChatHistory, 
				clearChatHistory,
				getUserTags,
			    tags,
				logout,
				followup, 
				setFollowup

            }}
        >
            {children}
        </AuthContext.Provider>
    );
};



export const useAuth = () => useContext(AuthContext);
