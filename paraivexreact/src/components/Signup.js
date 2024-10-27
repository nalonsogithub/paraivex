// src/components/Signup.js
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Signup.module.css';

const Signup = ({ navigateToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [securityFragment, setSecurityFragment] = useState('');
    const [view, setView] = useState('signup'); // Tracks 'signup', 'nda', 'confirmation', 'success'
    const [error, setError] = useState(null);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    const ndaRef = useRef(null);

    // Dictionary of valid security fragments
    const securityFragments = {
        "xman": "Nick",
        "secureB": "Jane Smith",
        "secureC": "Alice Johnson",
    };

    // NDA Text content
    const NDA_TEXT = `
### Non-Disclosure Agreement (NDA)
**Welcome to ParAIveX.** By signing up, you agree to the following terms:

**1. Definition of Confidential Information**  
All proprietary information, technical data, and intellectual property disclosed by ParAIveX, either verbally or written, is considered Confidential.

**2. Obligations of the Receiving Party**  
You agree to use Confidential Information solely for purposes authorized by ParAIveX. Disclosure is restricted to those with a need to know and under similar obligations.

**3. Exclusions from Confidential Information**  
Information that is public or rightfully received without confidentiality obligations is excluded.

**4. Non-Competition and Intellectual Property**  
You may not use or replicate Confidential Information for any competitive purpose for two years following access.

**5. Non-Disclosure Period**  
The obligations of confidentiality remain in effect until the Confidential Information is publicly disclosed or ParAIveX terminates the agreement.

**6. Governing Law**  
This agreement is governed by the laws of the Commonwealth of Massachusetts.

Click "I Agree" after reading to proceed.`;

	
    // Validate security fragment and navigate based on result
    const handleFragmentValidation = (e) => {
		// Check if securityFragment exists in the securityFragments dictionary
		if (securityFragments[securityFragment]) {
			setView('nda'); // Move to NDA view if fragment is valid
		} else {
			navigate('/under-construction'); // Redirect to under-construction page if invalid
		}
    };
	
    const handleNDAAgreement = (agree) => {
			console.log('signing up', agree);
        if (agree) {
            handleSignup(); // Go to final confirmation if NDA is agreed
			console.log('signing up');
        } else {
            navigate('/'); // Redirect to home if NDA is declined
        }
    };


    // Final signup action
    const handleSignup = async () => {
        const response = await signup(username, password, NDA_TEXT);
        if (response.success) {
            navigate('/user'); // Redirect to login on successful signup
        } else {
            // Show an alert for username taken error, then redirect back to signup
            if (response.message === "Account already exists") {
                alert("An account with this username already exists. Please choose a different username.");
            } else {
                alert("An account with this username already exists. Please choose a different username.");
            }
            navigate('/'); // Redirect back to signup
        }	
	
    };	
	
	
    const handleFinalSignup = async (e) => {
		console.log('in handFial');
        e.preventDefault();

        const response = await signup(username, password);
        if (response.success) {
            navigate('/user'); // Redirect to login on successful signup
        } else {
            // Show an alert for username taken error, then redirect back to signup
            if (response.message === "Account already exists") {
                alert("An account with this username already exists. Please choose a different username.");
            } else {
                alert("An account with this username already exists. Please choose a different username.");
            }
            navigate('/login'); // Redirect back to signup
        }	
	
    };

    // Handle scroll to bottom to enable "I Agree" button
    const handleScroll = () => {
        const ndaElement = ndaRef.current;
        if (ndaElement && ndaElement.scrollTop + ndaElement.clientHeight >= ndaElement.scrollHeight) {
            setHasScrolledToEnd(true);
        }
    };

    return (
        <div className={styles.background}>
            <div className={styles.signupContainer}>
                {view === 'signup' && (
                    <>
                        <h2 className={styles.title}>Create an Account</h2>
                        {error && <p className={styles.error}>{error}</p>}
                        <form onSubmit={handleFragmentValidation} className={styles.form}>
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
                            <input
                                type="text"
                                placeholder="Security Fragment"
                                value={securityFragment}
                                onChange={(e) => setSecurityFragment(e.target.value)}
                                className={styles.input}
                            />
                            <button type="submit" className={styles.button}>Next</button>
                        </form>
                        <button onClick={navigateToLogin} className={styles.loginLink}>Back to Login</button>
                    </>
                )}

                {view === 'nda' && (
                    <>
                        <h2 className={styles.title}>Non-Disclosure Agreement</h2>
                        <p>Hi, {securityFragments[securityFragment]}! Please read the NDA below.</p>
                        <div className={styles.ndaContainer} ref={ndaRef} onScroll={handleScroll}>
                            <ReactMarkdown>{NDA_TEXT}</ReactMarkdown>
                        </div>
                        <button
                            onClick={() => handleNDAAgreement(true)}
                            className={styles.NDAIAgreebutton}
                            disabled={!hasScrolledToEnd}
                        >
                            I Agree
                        </button>
                        <button onClick={() => handleNDAAgreement(false)} className={styles.NDAIAgreebutton}>
                            Disagree
                        </button>
                    </>
                )}

                {view === 'confirmation' && (
                    <>
                        <h2 className={styles.title}>Confirm Account</h2>
                        <p>Confirm your information to complete the signup.</p>
                        {error && <p className={styles.error}>{error}</p>}
                        <form onSubmit={handleFinalSignup} className={styles.form}>
                            <button type="submit" className={styles.button}>Confirm and Sign Up</button>
                        </form>
                    </>
                )}

                {view === 'success' && (
                    <>
                        <h2 className={styles.title}>Signup Successful</h2>
                        <p>Your account has been created. You may now log in.</p>
                        <button onClick={navigateToLogin} className={styles.button}>Go to Login</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Signup;
