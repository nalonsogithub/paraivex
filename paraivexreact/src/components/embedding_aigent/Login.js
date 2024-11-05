// src/components/Login.js
import React, { useState, useEffect  } from 'react';
import { useAuth } from '../contexts/embedding_aigent/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/embedding_aigent/Login.module.css';

const Login = ({ navigateToSignup }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { auth, login, logout } = useAuth();
	const navigate = useNavigate();

    // useEffect to redirect if already logged in
    useEffect(() => {
        if (auth) {
            navigate('/user'); // Redirect to /user if authenticated
        }
    }, [auth, navigate]); // Run this effect when `auth` or `navigate` changes
	
	
    const handleLogin = async (e) => {
        e.preventDefault();
//		logout();
        const response = await login(username, password);
        if (response.success) {
            navigate('/user');  // Redirect to MainUserPage on success
        } else {
            setError(response.message);
        }
    };
	
    const handleSignupNavigation = () => {
        navigate('/signup'); // Navigate to the Signup component route
    };	
    return (
        <div className={styles.background}>
            <div className={styles.loginContainer}>
                <h2 className={styles.title}>Veiled Access Point</h2>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleLogin} className={styles.form}>
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
                    <button type="submit" className={styles.button}>Login</button>
                </form>
                <button onClick={handleSignupNavigation} className={styles.signupLink}>
                    Sign Up
                </button>
            </div>
        </div>
    );

};

export default Login;
