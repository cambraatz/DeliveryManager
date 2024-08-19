/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import userIcon from "../images/userIcon.png";
import { useNavigate } from "react-router-dom";

const UserWidget = (props) => {
    const [user, setUser] = useState(props.driver);
    //const [status, setStatus] = useState(props.status);

    useEffect(() => {
        if (props.status === "Off"){
            document.getElementById("Logout").style.visibility = "hidden";
        }
        else {
            document.getElementById("Logout").style.visibility = "visible";
        }
    });

    const navigate = useNavigate();

    const handleLogout = () => {
        setUser("Signed Out");
        navigate('/');
    }

    /*
    const handleClick = () => {
        document.getElementById("popupLogoutWindow").style.visibility = "visible";
        document.getElementById("popupLogoutWindow").style.opacity = 1;
        document.getElementById("popupLogoutWindow").style.pointerEvents = "auto";
    };

    const handleClose = () => {
        document.getElementById("popupLogoutWindow").style.visibility = "hidden";
        document.getElementById("popupLogoutWindow").style.opacity = 0;
        document.getElementById("popupLogoutWindow").style.pointerEvents = "none";
    };
    */
    
    return(
        <div>
            <div id="AccountTab">
                <div id="UserWidget">
                    <img id="UserIcon" src={userIcon} alt="User Icon"/>
                    <p>{user}</p>
                </div>
                <div id="Logout">
                    <button onClick={handleLogout}>Log Out</button>
                </div>
            </div>
            {/*
            <div id="popupLogoutWindow" className="overlay">
                <div className="popupLogout">
                    <div id="popupExit" className="content">
                        <h1 id="close" onClick={handleClose}>&times;</h1>
                    </div>
                    <div id="popupLogoutPrompt" className="content">
                        <p>Are you sure you want to log out? </p>
                    </div>
                    <div className="content">
                        <div id="popupLogoutInner">
                            <button onClick={handleLogout}>Yes</button>
                        </div>
                    </div>
                </div>
            </div>
            */}
        </div>
    );
};

export default UserWidget;