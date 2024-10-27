// src/components/Signup.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Signup.module.css';

const Signup = ({ navigateToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const { signup } = useAuth();

    const handleSignup = async (e) => {
        e.preventDefault();
        const response = await signup(username, password);
        if (response.success) {
            setMessage(response.message);
            setError(null);
        } else {
            setError(response.message);
            setMessage(null);
        }
    };

    return (
        <div className={styles.background}>
            <div className={styles.signupContainer}>
                <h2 className={styles.title}>Create an Account</h2>
                {message && <p className={styles.success}>{message}</p>}
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleSignup} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                    />
                    <button type="submit" className={styles.button}>Sign Up</button>
                </form>
                <button onClick={navigateToLogin} className={styles.loginLink}>
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default Signup;
