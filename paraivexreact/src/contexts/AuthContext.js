// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback   } from 'react';
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
	const [bingUrls, setBingUrls] = useState([]);
	
	const login = (username, password) => {
		const requestURL = `${baseURL}/api/login`;
		console.log('Request URL:', requestURL); // Print the request URL

		return fetch(requestURL, {
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


	const logout = async () => {
		console.log('LOGOUT');
		try {
			// Make a request to Flask to handle server-side session management if needed
			const response = await fetch(`${baseURL}/api/logout`, {
				method: 'GET',
				credentials: 'include', // Ensure cookies are included
			});

			if (response.ok) {
				console.log("Logged out successfully.");

				// Clear client-side state
				setAuth(null);                // Clear authentication state
				setBrains([]);                // Reset brains data
				setConfigurations([]);        // Reset configurations data
				setSimilaritySearchResults([]); // Clear similarity search results
				setResponseEmbeddings([]);     // Clear response embeddings
				setChatHistory([]);            // Clear chat history
				setTags([]);                   // Clear tags

				// Redirect to the login page
//				window.location.href = '/login';
			} else {
				console.error("Failed to log out:", response.statusText);
			}
		} catch (error) {
			console.error("Error during logout:", error);
		}
	};




    return (
        <AuthContext.Provider
            value={{
                auth,
                login,
				signup, 
				logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};



export const useAuth = () => useContext(AuthContext);
