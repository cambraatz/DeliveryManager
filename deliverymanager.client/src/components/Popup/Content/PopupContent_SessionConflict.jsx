// eslint-disable-next-line no-unused-vars
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Fail from '../../../assets/error.svg';
import "../Popup.css";

const handleKeyPress = (reference) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && reference.current) {
            e.preventDefault();
            reference.current.click();
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    }
}

const PopupContent_SessionConflict = ({closePopup, handleSubmit}) => {
    const releaseSessionButtonRef = useRef(null);
    useEffect(() => {
        handleKeyPress(releaseSessionButtonRef);
    }, [releaseSessionButtonRef]);

    return (
        <div className="popupContent">
            <div id="popupPrompt" className="content">
                <img id="fail" src={Fail} alt="fail"/>
                <p>Existing session already exists, proceed to logout of the previous session.</p>
            </div>
            <div id="submit_company">
                <button 
                    className="popup_button"
                    onClick={handleSubmit}
                    ref={releaseSessionButtonRef}
                >Login</button>
            </div>
            <div id="cancel_user">
                <button className="popup_button" onClick={closePopup}>Cancel</button>
            </div>
        </div>
    );
};

export default PopupContent_SessionConflict;

PopupContent_SessionConflict.propTypes = {
    closePopup: PropTypes.func,
    handleSubmit: PropTypes.func
}