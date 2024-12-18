// src/components/Login.js
import React, { useState, useEffect  } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Login.module.css';

const Login = ({ navigateToSignup }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { auth, login, logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (auth) {
			// Check if auth.username is "nalonsoa"
			if (auth.username.toLowerCase() === 'nalonsoa') {
				navigate('/app-launcher'); // Redirect to /app-launcher for "nalonsoa"
			} else {
				navigate('/ea-user'); // Redirect to /ea-user for other users
			}
		}
	}, [auth, navigate]); 
	
	
    const handleLogin = async (e) => {
        e.preventDefault();
//		logout();
        const response = await login(username, password);
        // Check if the logged-in username is "nalonsoa"
        if (username.toLowerCase() === 'nalonsoa') {
            navigate('/app-launcher'); // Redirect to the app launcher for this user
        } else {
            navigate('/ea-user'); // Redirect to /ea-user for other users
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
