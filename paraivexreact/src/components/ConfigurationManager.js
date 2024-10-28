// src/components/ConfigurationManager.js
import React, { useState } from 'react';

const ConfigurationManager = () => {
    const [minResults, setMinResults] = useState(5);
    const [maxResults, setMaxResults] = useState(20);
    const [cosineThreshold, setCosineThreshold] = useState(0.8);

    const saveConfiguration = () => {
        const configuration = {
            minResults,
            maxResults,
            cosineThreshold,
        };
        // Save configuration to Cosmos DB here
        alert("Configuration saved!");
    };

    return (
        <div>
            <h4>Configure Search</h4>
            <label>Minimum Results</label>
            <input
                type="number"
                value={minResults}
                onChange={(e) => setMinResults(e.target.value)}
            />

            <label>Maximum Results</label>
            <input
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
            />

            <label>Cosine Similarity Threshold</label>
            <input
                type="number"
                step="0.01"
                value={cosineThreshold}
                onChange={(e) => setCosineThreshold(e.target.value)}
            />

            <button onClick={saveConfiguration}>Save Configuration</button>
        </div>
    );
};

export default ConfigurationManager;
