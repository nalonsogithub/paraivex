import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/embedding_aigent/ChatBot.module.css';
import { useSwipeable } from 'react-swipeable';
import getBaseURL from '../config';
//import { useAuth } from '../../contexts/AuthContext';
import { useChatAigent } from '../contexts/ChatContext';
import { jsonrepair } from 'jsonrepair';

const ChatBot = ({ prompt, setPrompt, onJsonDetected, selectedOptions, contextList, setResponseEmbeddingsInParent   }) => {
//  console.log('Received contextList:', contextList);	
    const handlePromptChange = (event) => {
        const newValue = event.target.value;
//        console.log('ChatBot is updating prompt:', newValue); 
        setPrompt(newValue); // Propagate the change to ChatComponent
    };	
//  const minHeight = maxHeight;
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false); // Track if streaming is cancelled
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [visibleQuestionCount, setVisibleQuestionCount] = useState(3);	
  const baseURL = getBaseURL();
  const { setResponseEmbeddings, chatHistory, updateChatHistory,  followup, setFollowup, fetchBingUrls} = useChatAigent();
	
	
  const showLabels = true;

  const chatLogRef = useRef(null);
  const controllerRef = useRef(null);
	
  // SCROLLING CODE
  // 1. Track if auto-scroll is enabled and if the scroll button should be shown
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false); // Control auto-scroll
  const [showScrollButton, setShowScrollButton] = useState(false); // Show when content exceeds the visible area

  // 2. Detect user scrolling and content overflow to show the scroll button
  useEffect(() => {
    const chatLog = chatLogRef.current;

    const handleScroll = () => {
      if (chatLog) {
		setShowScrollButton(false);
        const isAtBottom = chatLog.scrollHeight - chatLog.scrollTop === chatLog.clientHeight;
        setIsAutoScrollEnabled(false); 
      }
    };
	  
    // Function to copy text to clipboard
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        alert('Message copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    };	  

    if (chatLog) {
      chatLog.addEventListener('scroll', handleScroll);
      chatLog.addEventListener('touchmove', handleScroll); 
    }

    return () => {
      if (chatLog) {
        chatLog.removeEventListener('scroll', handleScroll);
        chatLog.removeEventListener('touchmove', handleScroll);
      }
    };
  }, [chatLogRef]);


    // Custom renderers for ReactMarkdown to apply CSS module styles
    const renderers = {
        strong: ({ children }) => <strong className={styles.markdownStrong}>{children}</strong>,
        p: ({ children }) => <p className={styles.markdownParagraph}>{children}</p>
    };	
	
	
  // 3. Check if content exceeds the visible area and show the scroll button
  useEffect(() => {
    const chatLog = chatLogRef.current;

    if (chatLog) {
      const isScrollable = chatLog.scrollHeight > chatLog.clientHeight;
      setShowScrollButton(isScrollable); 
    }
  }, [messages]); 
	
	
	

  // 5. Handle when the user clicks the scroll button to enable auto-scroll and hide the button immediately
  const handleScrollToBottom = () => {
    // Hide the button immediately when clicked, regardless of whether the chat log reaches the bottom or not
    setShowScrollButton(false);
    // Enable auto-scroll
    setIsAutoScrollEnabled(true);

    // Scroll to the bottom (auto-scroll will handle the rest for new messages)
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({
        top: chatLogRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
	
  // END SCROLLING CODE

	
  // Quick question carousel state
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);

  // State for questions and system prompts
  const [questions, setQuestions] = useState([]); // Will hold the fetched questions
  const [questionPrompts, setQuestionPrompts] = useState([]); // Will hold the system prompts
  const [aIgentQuickQuestion, setAIgentQuickQuestion] = useState(null); // State to hold OWQQ question
	


  const handleNext = () => {
    setVisibleStartIndex((prevIndex) => (prevIndex + 1) % questions.length);
  };

  const handlePrevious = () => {
    setVisibleStartIndex((prevIndex) => (prevIndex === 0 ? questions.length - 1 : prevIndex - 1));
  };
	
	

  const getVisibleQuestions = () => {
    const endSlice = questions.slice(visibleStartIndex, visibleStartIndex + visibleQuestionCount);
    const remainingItems = visibleStartIndex + visibleQuestionCount > questions.length 
      ? questions.slice(0, (visibleStartIndex + visibleQuestionCount) % questions.length) 
      : [];
    return [...endSlice, ...remainingItems];
  };	
	

	
	
	
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });
  // END QUICK QUESTIONS
  // UseEffect to watch for updates to questions
  useEffect(() => {
    if (aIgentQuickQuestion) {
      setQuestions((prevQuestions) => [...prevQuestions, aIgentQuickQuestion]);
    }
  }, [aIgentQuickQuestion]);	
	
	

  const bufferRef = useRef('');	


  const stripJSONSummary = (inputString) => {
    return inputString.replace(/JSON Summary:/g, '').trim();
  };
const handleSubmit = async (event, promptOverride = null) => {
    // Prevent default form submission behavior
    if (event) {
        event.preventDefault();
    }
    const currentPrompt = promptOverride || prompt;
    
    if (!currentPrompt.trim()) {
        console.log("Prompt is empty.");
        return;
    }	
	
	

    const input = currentPrompt;
    const question = currentPrompt;
	
    // Prepare initial buffer with chat history for streaming
//	bufferRef.current = chatHistory.map(msg => `${msg.user}: ${msg.text}`).join("\n") + `\nUser: ${currentPrompt}\n`;
	
	
	// CLEAR PROMPT
    const newMessage = { user: 'User', text: question };
    updateChatHistory(newMessage);
	setPrompt("");
	setFollowup('');
	
    setIsLoading(true);
    setIsCancelled(false); // Reset cancel status
	  
	  

    if (!question.trim()) {
      setMessages(prevMessages => [...prevMessages, { user: "AIgent", text: "Please enter a question." }]);
      setIsLoading(false);
      return;
    }

    setMessages(prevMessages => [...prevMessages, { user: "User", text: question }]);
    setUserInput("");

	
    // Initialize AbortController to allow canceling
    const controller = new AbortController();
    controllerRef.current = controller; // Store reference to the controller
	
    try {
      const payload = {
        system_prompt: question,
		selected_options: selectedOptions,
		context_list: contextList, 
		isearch_depth: 1,
      };


	  const response = await fetch(`${baseURL}/api/ask_stream`, {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify(payload),
		  signal: controller.signal
	  });		

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
		

  // Function to check for and parse JSON at the end of a message
	const checkAndParseJSON = (message) => {
		console.log('IN PARSING', message);

		let jsonContent = null;
		let textContent = message;

		// Regex to match JSON within Markdown block or at the end of the message
		const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```|\{[\s\S]*\}$/);	
		if (jsonMatch) {
			const jsonSnippet = jsonMatch[1] || jsonMatch[0]; // Handle both cases

			try {
				// Attempt to repair and parse the JSON
				const repairedJson = jsonrepair(jsonSnippet);
				jsonContent = JSON.parse(repairedJson);
				console.log("Repaired and parsed JSON:", jsonContent);

				// Remove the JSON part from text content
				textContent = message.replace(jsonMatch[0], '').trim();
			} catch (error) {
				console.error("Error repairing and parsing JSON:", error);
			}
		}	

		// Return both text content and JSON
		return { textContent, jsonContent };
	};	
		
		
		
      const processText = async ({ done, value }) => {
        try {
		
          if (done || isCancelled) {
            setIsLoading(false);
            if (bufferRef.current.trim()) {
                // Check for JSON-like content at the end of the buffer
				
				
              let cleanedBuffer = bufferRef.current;  // Clean the buffer
				
              cleanedBuffer = removeTrailingBracket(cleanedBuffer);	
			  console.log('cleanedBuffer', cleanedBuffer);

				
			  const result = checkAndParseJSON(cleanedBuffer);
			  result.textContent = stripJSONSummary(result.textContent);
			  console.log("Text Content:", result.textContent);
			  console.log("JSON Content:", result.jsonContent);				
			  if (result.jsonContent) {
				  setResponseEmbeddings(result.jsonContent);
				  setResponseEmbeddingsInParent(result.jsonContent);
				  setFollowup(result.jsonContent.followup || '');
				  onJsonDetected(true);
			  }
				
			  // UPDATE RESPONSE
			  const aiResponse = { user: 'AIgent', text: result.textContent };
			  updateChatHistory(aiResponse);
				
				
			  // LEAVE THE BUFFER FULL FOR CLEARITY
//			  cleanedBuffer = result.textContent;
			  cleanedBuffer = cleanedBuffer;

				
				
              setMessages(prevMessages => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage.user === "AIgent") {
                  // Instead of appending, we now replace the entire message text with the cleaned buffer
                  return [...prevMessages.slice(0, -1), { ...lastMessage, text: cleanedBuffer }];
                } else {
                  return [...prevMessages, { user: "AIgent", text: cleanedBuffer }];
                }
              });				
				
				
				
              bufferRef.current = '';  // Clear the buffer after processing
				
			  // Call fetchBingUrls and wait for it to complete
			  console.log("Before calling fetchBingUrls");		
			  await fetchBingUrls();
			  console.log("After calling fetchBingUrls");	
			  console.log(fetchBingUrls);
				
            }
            return;
          }			
			
          const chunk = decoder.decode(value, { stream: true });
          bufferRef.current += chunk; 

          setMessages(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage.user === "AIgent") {
              return [...prevMessages.slice(0, -1), { ...lastMessage, text: lastMessage.text + chunk }];
            } else {
              return [...prevMessages, { user: "AIgent", text: chunk }];
            }
          });

          return reader.read().then(processText);
        } catch (err) {
          if (err.name === 'AbortError') {
//            console.log("Stream has been aborted");
            return;
          } else {
            console.error("Error during reading stream: ", err);
            throw err;  // Re-throw other errors
          }
        }
      };

      reader.read().then(processText);

    } catch (error) {
      if (error.name === 'AbortError') {
//        console.log("Fetch request was aborted");
      } else {
        console.error("Error fetching data: ", error);
        setMessages(prevMessages => [...prevMessages, { user: "AIgent", text: "Failed to connect to the server." }]);
      }
	setIsLoading(false);
    }
  };
	
    // Handle follow-up click without preventing default
	const handleFollowupClick = () => {
		console.log("Follow-up clicked with question:", followup);
		handleSubmit(null, followup); // Pass `null` for event and `false` for preventDefault
	};
	
  // Helper function to extract the OWQQ word (single word response)
  const extractOWQQWord = (message) => {
    const match = message.match(/\[OWQQ:\s*([^\]]*)\]/i); // Regex to match [OWQQ: {word}]
    if (match && match[1]) {
      return match[1].trim();  // Return the single word inside {}
    }
    return null;
  };	

// Helper function to extract the conversation topic (case-insensitive)
  const extractConversationTopic = (message) => {
    // Update the regex to match square brackets and extract the conversation topic
    const match = message.match(/\[CONVOTOP:\s*([^\]]*)\]/i);  // Square brackets, case-insensitive


    if (match && match[1]) {
      return match[1];  // Return the conversation topic
    }
    return 'default';  // If not found, return 'default'
  };
	
  const removeConvoTopString = (message) => {
    // Remove only the [CONVOTOP: ...] part
    let cleanedMessage = message.replace(/\[CONVOTOP:\s*[^\]]*\]/i, '').trim();
  
    // Do NOT remove all brackets here yet, leave it for further processing
    return cleanedMessage;
  };

  const removeOWQQString = (message) => {
    // Remove only the [OWQQ: ...] part
    let cleanedMessage = message.replace(/\[OWQQ:\s*[^\]]*\]/i, '').trim();
  
    // Do NOT remove all brackets here yet, leave it for further processing
    return cleanedMessage;
  };	
  const removeTrailingBracket = (message) => {
    // Check if the message ends with a "]" and remove it if it does
    if (message.endsWith(']')) {
      return message.slice(0, -1).trim(); // Remove the last character and trim any extra spaces
    }
    return message;
  };	
	
	
  const cancelResponse = async () => {
    setIsCancelled(true); // Set cancel status
    setIsLoading(false);  // Stop the loading state
    if (controllerRef.current) {
      controllerRef.current.abort(); // Abort the fetch request
//      console.log("Fetch request aborted");
    }
  };

  useEffect(() => {
      setMessages(chatHistory);
  }, [chatHistory]);

  const adjustTextareaHeight = (event) => {
	 const textarea = event.target;
	 textarea.style.height = "auto"; // Reset height to calculate new scroll height
	 textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height based on content
  };
	
  return (
    <div className={`${styles.AigentContainer} ${isLoading ? styles.waitingCursor : ''}`}>	  
      {/* Add Cancel Button */}
      <div 
        className={`${styles.AigentchatbotContainer}`} 
      >	  

			{/* Display chat history */}
			<div 
			  className={`${styles.AigentchatLog}`} 
			  ref={chatLogRef}
			>	  
			  {messages.map((message, index) => (
				<div key={index} className={styles.AigentmessageContainer}>
				  {/* Only display the user label if showLabels is true */}
				  {showLabels && (
					<strong>{message.user}:</strong>
				  )}

				  {/* Conditionally render the message text */}
				  {!(showLabels === false && message.user === "User") && (
				    <>
					  <ReactMarkdown components={renderers}>{message.text}</ReactMarkdown>
					  {/* Copy icon for copying the message to the clipboard */}
					  <span 
					    className={styles.copyIcon} 
					    onClick={() => {
						  navigator.clipboard.writeText(message.text).then(() => {
						    alert('Message copied to clipboard!');
						  }).catch(err => {
						    console.error('Failed to copy: ', err);
						  });
					    }}
					    title="Copy to clipboard"
					  >
					    📋
					  </span>
				    </>
				  )}



				</div>
			  ))}


			  {/* Scroll Button */}
			  <div className={styles.AigentscrollButtonContainer}>
				<button onClick={handleScrollToBottom} className={styles.AigentscrollButton} style={{ display: showScrollButton ? 'block' : 'none' }}>
				  v
				</button>
			  </div>

			</div>

                {/* Follow-up Button */}
                {followup && (
                    <div className={styles.followupContainer}>
                        <button onClick={handleFollowupClick} className={styles.followupButton}>
                            {followup}
                        </button>
                    </div>
                )}

		<form onSubmit={handleSubmit} className={styles.AigentinputForm}>
		<textarea
		  className={styles.AigentinputField}
		  value={prompt}
  		  onChange={(event) => {
//			  console.log('ChatBot textarea onChange:', event.target.value); 
			  handlePromptChange(event);
		  }}
		  onFocus={(e) => e.target.rows = 3} // Expand to 3 lines on focus
		  onBlur={(e) => e.target.rows = 1} // Collapse back to 1 line when focus is lost, if no content
		  onInput={(e) => adjustTextareaHeight(e)} // Adjust height dynamically as the user types
		  onKeyDown={(e) => {
			if (e.key === 'Enter' && !e.shiftKey) { // Check for Enter without Shift
			  e.preventDefault(); // Prevent adding a new line
			  handleSubmit(e); // Call the submit function
			}
		  }}
		  placeholder="Type your prompt..."
		  rows={1} // Initial number of rows
		/>
{/*
		  <textarea
			className={styles.AigentinputField}
			value={prompt}
			onChange={handlePromptChange}
			placeholder="Type your prompt..."
			rows={2} // Start with 2 lines
		  />
			<input
				type="text"
				className={styles.AigentinputField}
				value={prompt}
				onChange={handlePromptChange}
				placeholder="Type your prompt..."
			  />
*/}
			  {isLoading ? (
				<button onClick={cancelResponse} className={styles.AigentcancelButton}>✕</button>

			  ) : (
				<button type="submit" className={styles.AigentsubmitButton}>
				  ➤
				</button>
			  )}

		</form>
      </div>
    </div>
  );
};

export default ChatBot;

