import PropTypes from 'prop-types';
import { useState } from 'react';
import { Logout, Return } from '../../utils/api/sessions.js';
import userIcon from "../../assets/userIcon.png";
import Popup from '../Popup/Popup.jsx';
import './UserWidget.css';

const DEFAULT_POPUP = "Success";

const UserWidget = ({ logoutButton, currUser, root}) => {
    const [popupType, setPopupType] = useState(DEFAULT_POPUP);
    const [popupVisible, setVisible] = useState(false);

    // new popup rendering logic...
    const openPopup = (popupType) => {
        setPopupType(popupType);
        setVisible(true);
    };

    const closePopup = () => {
        setVisible(false);
        setPopupType(DEFAULT_POPUP);
        /*if (clearState != null) {
            clearStateStyling();
        }*/
    };

    const popupReturn = (root) => {
        if(root){
            openPopup("return");
        }

        Return(root);
    }
        
    const popupLogout = () => {
        openPopup("logout");
        Logout();
    }

    const showLogoutButton = logoutButton !== false;

    return (
        <>
            <div id="uw_div">
                <div id="uw_content">
                    <div id="uw_icon_div">
                        <img id="uw_icon" src={userIcon} alt="User Icon" />
                        <p>{currUser}</p>
                    </div>
                    <div id="uw_navButtons">
                        <div id="uw_return">
                            <button onClick={() => popupReturn(root)}>Go Back</button>
                        </div>
                        {showLogoutButton && (
                            <div id="uw_logout">
                                <button onClick={popupLogout}>Log Out</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {popupVisible && (
                <Popup 
                    popupType={popupType}
                    isVisible={popupVisible}
                    closePopup={closePopup}
                />
            )}
        </>
    );
};

export default UserWidget;

UserWidget.propTypes = {
    logoutButton: PropTypes.bool, // render logout button?
    currUser: PropTypes.string, // current username
    root: PropTypes.bool
};