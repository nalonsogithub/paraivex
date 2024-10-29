// src/components/SplashScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/SplashScreen.module.css';

const SplashScreen = ({ onDismiss }) => {
    const navigate = useNavigate();
    const fullText = `
# ParAIveX

Introducing ParAIveX – The AI That Knows You

Ever been in a learning environment that didn’t match your level? Maybe the content was a step too advanced, or conversely, it covered things you’d already mastered. While humans naturally adapt their communication based on who they're talking to, AI typically doesn’t—it aims for an average.

ParAIveX is here to change that.

Unlike typical AI, which only remembers fragments of your conversation, ParAIveX lets you build a personalized model of your knowledge. By organizing your insights into custom “brains,” you create a lasting foundation that enriches every interaction. With each question you ask, ParAIveX draws from your unique context, transforming your prompts and shaping answers that are tuned precisely to your world.

Currently in beta, ParAIveX is offering limited access. If you're intrigued by the chance to make AI truly personal, reach out to [info@paraivex.com](mailto:hogartmike@gmail.com) with a brief introduction. We look forward to helping you explore the future of intelligent, context-aware AI.

Click anywhere outside of this box to continue.
    `;

    const [displayedText, setDisplayedText] = useState('');
    const typingSpeed = 15; // Adjust typing speed here

    useEffect(() => {
        let index = 0;

        const typeText = () => {
            setDisplayedText(fullText.slice(0, index));
            index++;

            if (index <= fullText.length) {
                setTimeout(typeText, typingSpeed);
            }
        };

        typeText(); // Start the typing effect

        // Run the effect only once
    }, []); // empty dependency array ensures this runs only once

    const handleClickOutside = () => {
        onDismiss();
        navigate('/');
    };

    return (
        <div className={styles.overlay} onClick={handleClickOutside}>
            <div className={styles.splashContent} onClick={(e) => e.stopPropagation()}>
                <ReactMarkdown>{displayedText}</ReactMarkdown>
            </div>
        </div>
    );
};

export default SplashScreen;
