// src/config.js
const getBaseURL = () => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost') {
        return 'http://localhost:5000';
    } else if (hostname === 'www.paraivex.com') {
        return 'https://www.paraivex.com';
    } else if (/\.paraivex\.com$/.test(hostname)) {
        // Matches any subdomain of paraivex.com (e.g., go.paraivex.com, staging.paraivex.com, etc.)
        return 'https://www.paraivex.com';
    } else if (hostname === 'paraivex-bmd3d3h2gmgda6cf.eastus2-01.azurewebsites.net') {
        return 'https://paraivex-bmd3d3h2gmgda6cf.eastus2-01.azurewebsites.net';
    }

    // Default to production URL
    return 'https://www.paraivex.com';
};

export default getBaseURL;