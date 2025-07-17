// eslint-disable-next-line no-unused-vars
import React from 'react';
import '../LoadingSpinner.css';

const LoadingSpinner = () => {
    return (
        <div className="spinner-cont">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;