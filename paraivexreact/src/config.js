// src/config.js
const getBaseURL = () => {
    const hostname = window.location.hostname;

	
	
    if (hostname === 'localhost') {
        return 'http://localhost:5000';
    } else if (hostname === 'www.nightengalecelephus.com') {
        return 'https://www.nightengalecelephus.com';
    } else if (hostname === 'staging.nightengalecelephus.com') {
        return 'https://staging.nightengalecelephus.com';
    }

    // Default to production URL if no match
    return 'http://localhost:5000';
};

export default getBaseURL;
