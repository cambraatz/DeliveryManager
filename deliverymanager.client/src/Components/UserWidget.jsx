import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";

import userIcon from "../images/userIcon.png";
import { API_URL, clearMemory } from '../Scripts/helperFunctions';
import toggleDots from '../images/Toggle_Dots.svg';

const UserWidget = (props) => {
    const [user, setUser] = useState(props.driver);
    //const [status, setStatus] = useState(props.status);

    useEffect(() => {        
        /*if (props.status === "Off"){
            document.getElementById("Return").style.display = "none";
        }
        else {
            document.getElementById("Return").style.display = "flex";
        }*/

        if (props.toggle === "close") {
            document.getElementById("main_title").style.display = "none";
            document.getElementById("title_div").style.display = "none";
            document.getElementById("buffer").style.height = "10px";
            setStatus("close");
        } else {
            document.getElementById("main_title").style.display = "flex";
            document.getElementById("title_div").style.display = "flex";
            document.getElementById("buffer").style.height = "20px";
            setStatus("open");
        }

        setUser(props.driver);
    }, [props.status, props.driver, props.toggle]);

    const navigate = useNavigate();

    const handleLogout = () => {
        //logout();
        Logout();
        if (localStorage.getItem('accessToken') == null && localStorage.getItem('refreshToken') == null) {
            console.log("Logged out, redirecting to login!");
        }
        //setUser("Signed Out");
        //navigate('/', {state: props.company});
        setTimeout(() => {
            window.location.href = `https://www.login.tcsservices.com`;
        },1500)
        
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

    //console.log("header: ", props.header)
    
    const [status,setStatus] = useState(props.toggle);

    const collapseHeader = (e) => {
        //console.log(e.target.id);
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            if (status === "open") {
                document.getElementById("main_title").style.display = "none";
                document.getElementById("title_div").style.display = "none";
                document.getElementById("buffer").style.height = "10px";
                setStatus("close");
                //e.target.id = "openToggle";
            } else {
                document.getElementById("main_title").style.display = "flex";
                document.getElementById("title_div").style.display = "flex";
                document.getElementById("buffer").style.height = "20px";
                setStatus("open");
                //e.target.id = "collapseToggle";
            }
        }
    } 

    async function Logout() {
        clearMemory();
        const response = await fetch(API_URL + "api/Registration/Logout", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
        })
        if (response.ok) {
            console.log("Logout Successful!");
        } else {
            console.alert("Cookie removal failed, Logout failure.")
        }
    }

    async function Return() {
        const handleGoBack = () => {
            //window.history.back();
            const path = window.location.pathname;
            let oneBack = path.substring(0, path.lastIndexOf('/'));

            if (oneBack === "") {
                oneBack = "/";
            }
            navigate(oneBack);
        };

        console.log(window.location.pathname);
        if (window.location.pathname !== '/') {
            handleGoBack();
            return;
        }
        const response = await fetch(`${API_URL}api/Registration/Return`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: "include"
        });

        if (response.ok) {
            console.log("Return Successful!");
            setTimeout(() => {
                window.location.href = `https://login.tcsservices.com`;
            },1500)
        } else {
            console.error("Return cookie generation failed, return failure.");
        }
    }
    
    return(
        <>
            <div id="collapseToggle" onClick={collapseHeader}>
                <img id="toggle_dots" src={toggleDots} alt="toggle dots" />
            </div>
            <div id="AccountTab" onClick={collapseHeader}>
                <div id="sticky_creds">
                    <div id="UserWidget">
                        <img id="UserIcon" src={userIcon} alt="User Icon"/>
                        <p>{user}</p>
                    </div>
                    <div id="nav-buttons">
                        <div id="Return">
                            <button onClick={Return}>Go Back</button>
                        </div>
                        <div id="Logout">
                            <button onClick={handleLogout}>Log Out</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserWidget;

UserWidget.propTypes = {
    driver: PropTypes.string, //username
    status: PropTypes.string, // button visibility state
    toggle: PropTypes.string, // header collapse state
};