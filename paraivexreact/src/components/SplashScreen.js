// src/components/SplashScreen.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/SplashScreen.module.css';

const SplashScreen = ({ onDismiss }) => {
    const navigate = useNavigate();

    const handleClickOutside = () => {
        onDismiss();
        navigate('/');
    };

    return (
        <div className={styles.overlay} onClick={handleClickOutside}>
            <div className={styles.splashContent} onClick={(e) => e.stopPropagation()}>
                <ReactMarkdown>
                    {`# ParAIveX

Introducing ParAIveX – The AI That Knows You

Ever been in a learning environment that didn’t match your level? Maybe the content was a step too advanced, or conversely, it covered things you’d already mastered. While humans naturally adapt their communication based on who they're talking to, AI typically doesn’t—it aims for an average. 


ParAIveX is here to change that.

Unlike typical AI, which only remembers fragments of your conversation, ParAIveX lets you build a personalized model of your knowledge. By organizing your insights into custom “brains,” you create a lasting foundation that enriches every interaction. With each question you ask, ParAIveX draws from your unique context, transforming your prompts and shaping answers that are tuned precisely to your world.

Currently in beta, ParAIveX is offering limited access. If you're intrigued by the chance to make AI truly personal, reach out to [info@paraivex.com](mailto:info@paraivex.com) with a brief introduction. We look forward to helping you explore the future of intelligent, context-aware AI.

Click anywhere outside of this box to continue.

`}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default SplashScreen;
