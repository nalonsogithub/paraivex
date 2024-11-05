import React from 'react';
import ReactMarkdown from 'react-markdown';

const ChatWindow = () => {
  // Inline styles for the chat window and input fields
  const chatWindowStyle = {
    width: '300px',
    height: '400px',
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid black',
    padding: '10px',
    overflowY: 'scroll',
    boxSizing: 'border-box'
  };

  const inputStyleText = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '2px solid blue',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'lightgray'
  };

  const inputStylePassword = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '2px solid green',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'lightyellow'
  };

  const markdownStyles = {
    strong: {
      fontWeight: 'bold',
      color: 'black'
    },
    p: {
      color: 'black',
      fontSize: '14px',
      lineHeight: '1.5'
    }
  };

  // Custom Markdown component to apply inline styles
  const renderers = {
    strong: ({ children }) => <strong style={markdownStyles.strong}>{children}</strong>,
    p: ({ children }) => <p style={markdownStyles.p}>{children}</p>
  };

  // Example markdown content for the chat window
  const markdownContent = `
  **Hello!** This is an example chat window.
  - *Markdown formatting* is supported.
  - Type your input below!
  `;

  return (
    <div style={chatWindowStyle}>
      <ReactMarkdown components={renderers}>{markdownContent}</ReactMarkdown>
      <input type="text" placeholder="Username" style={inputStyleText} />
      <input type="password" placeholder="Password" style={inputStylePassword} />
    </div>
  );
};

export default ChatWindow;
