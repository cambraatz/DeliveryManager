/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/7/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Header from './Header';
import Footer from './Footer';
import { scrapeDate, 
    renderDate, 
    getDate, 
    //API_URL,
    showFailFlag,
    FAIL_WAIT} from '../Scripts/helperFunctions';
import Logout from '../Scripts/Logout.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

import Success from '../assets/success.svg';
import Fail from '../assets/error.svg';

const API_URL = import.meta.env.VITE_API_URL;

/*/////////////////////////////////////////////////////////////////////

DriveryLogin() - Driver/Delivery Authentication

DriverLogin serves as the home page for the driver application...
Function handles log in credential and delivery validation...
DriverLogin Component takes no parameters and handles the user login
and validation phase.

After preliminary react functionality/state variables are initialized, the component
handles user credentials, validating the provided username and password against what
is currently on file for the driver. Error prompt styling is rendered and dynamically
managed as user input changes. Once credentials are validated a popup window opens 
that prompts the user to provide a date and powerunit to query deliveries.

The driver must be a valid user on file, but are allowed to query delivery data for
any valid powerunit and delivery date pair. The set of functions below manage and
package data for interaction with the .NET backend and MSSQL database.

///////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
// initialize rendered page...
    initialize date, navigation and states
    useEffect() => 
        check delivery validity onLoad and after message state change
    renderCompany() => 
        retrieve company name from database when not in memory

// page rendering helper functions...
    openPopup() => 
        open popup for delivery confirmation
    closePopup() => 
        close popup for delivery confirmation
    collapseHeader() => 
        open/close collapsible header

// state management functions...
    handleLoginChange() => 
        handle login form changes
    handleDeliveryChange() => 
        handle delivery query form changes

// API requests + functions...
    handleSubmit() => 
        handleClick on initial login button
    validateCredentials() => 
        prompt for correction in fail or open popup in success
    handleUpdate() => 
        validate delivery data + powerunit, navigate to /driverlog on success

    handleNewUser() => 
        open new user initialization menu
    updateDriver() =>
        collect password + powerunit to initialize new driver credentials
    pullDriver() =>
        fetch driver and ensure null password for new driver init
    cancelDriver() =>
        reset driver credentials on popup close
    updateNewUser() =>
        handle updates to new user credentials

// render template + helpers...
    package popup helper functions
    return render template

*//////////////////////////////////////////////////////////////////////

const DriverLogin = () => {
    // Date processing functions ...
    const currDate = getDate();
    const navigate = useNavigate();

    /* Site state & location processing functions... */

    // initialize company state to null, replace with company on file...
    const [company, setCompany] = useState("");

    const [loading,setLoading] = useState(true);

    // check delivery validity onLoad and after message state change...
    useEffect(() => {
        validateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // set popup render status...
    //const [message, setMessage] = useState(null);
    const [user,setUser] = useState("Sign In");

    // state 'driverCredentials' to be passed to next page...
    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: '',
        PASSWORD: '',
        POWERUNIT: ''
    })

    // state 'formData' for rendering forms on page...
    const [formData, setFormData] = useState({
        deliveryDate: currDate,
        powerUnit: driverCredentials.POWERUNIT
    });

    // state 'updateData' to be passed to next page...
    const [updateData, setUpdateData] = useState({
        MFSTDATE: scrapeDate(currDate),
        POWERUNIT: "000"
    });

    // state 'header' to maintain collapsible header...
    const [header,setHeader] = useState("open");

    // state for success/fail popups graphics...
    const [popup,setPopup] = useState("Success");

    /* Page rendering helper functions... */

    /*/////////////////////////////////////////////////////////////////
    [void] : openPopup() {
        make popup window visible on screen
        enable on click behavior
    }
    *//////////////////////////////////////////////////////////////////

    const openPopup = () => {
        document.getElementById("popupWindow").style.visibility = "visible";
        document.getElementById("popupWindow").style.opacity = 1;
        document.getElementById("popupWindow").style.pointerEvents = "auto";  
    };

    /*/////////////////////////////////////////////////////////////////
    [void] : closePopup() {
        self explanatory closing of "popupLoginWindow"
        setStatus("") and setMessage(null) - reset state data
    }
    *//////////////////////////////////////////////////////////////////

    const closePopup = () => {
        document.getElementById("popupWindow").style.visibility = "hidden";
        document.getElementById("popupWindow").style.opacity = 0;
        document.getElementById("popupWindow").style.pointerEvents = "none";
    
        Logout();
    };

    /*/////////////////////////////////////////////////////////////////
    // initialize and manage collapsible header behavior...
    initialize header toggle to "open" - default for login screen
    [void] : collapseHeader(event) {
        if (e.target.id === "collapseToggle" or "toggle_dots"):
            open/close header - do opposite of current "header" state
    }
    *//////////////////////////////////////////////////////////////////

    const collapseHeader = (e) => {
        // toggle header only if toggle or dots symbol are clicked...
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            setHeader(prev => (prev === "open" ? "close" : "open"));
        }
    }

    /* Dynamic form/state change functions... */

    /*/////////////////////////////////////////////////////////////////
    // handle delivery query form changes...
    [void] : handleDeliveryChange(event) {
        if (e.target.id === "dlvddate"):
            update formData with renderDate(date)
            update updateData with scrapeDate(date)
        if (e.target.id === "powerunit"):
            update formData with new date val
            update updateData with new date val
        
        if (e.target.id background color != "white"):
            remove date/powerunit error styling (class 'invalid_input) on change
    } 
    *//////////////////////////////////////////////////////////////////

    const handleDeliveryChange = (e) => {
        // reset styling to default...
        if( document.getElementById(e.target.id).classList.contains("invalid_input")){
            document.getElementById("dlvdate").classList.remove("invalid_input");
            document.getElementById("powerunit").classList.remove("invalid_input");
            document.getElementById("dlvdate").classList.add("input_form");
            document.getElementById("powerunit").classList.add("input_form");
        }

        // handle delivery date + powerunit input field changes...
        let val = e.target.value;
        switch(e.target.id) {
            case 'dlvdate':
                setFormData({
                    ...formData,
                    deliveryDate: renderDate(val)
                });
                setUpdateData({
                    ...updateData,
                    MFSTDATE: scrapeDate(val)
                });
                break;
            case 'powerunit':
                setFormData({
                    ...formData,
                    powerUnit: val
                });
                setUpdateData({
                    ...updateData,
                    POWERUNIT: val
                });
                break;
            default:
                break;
        }
    };
    
    /* API Calls and Functionality... */

    /*/////////////////////////////////////////////////////////////////

    // validate credentials, prompt for correction in fail or open popup in success...
    [void] : validateCredentials(username, password) {
        i.p.
    }

    *//////////////////////////////////////////////////////////////////

    async function validateUser(){
        setLoading(true);
        // direct bypass to powerunit validation...
        //const response = await fetch(API_URL + "api/Delivery/ValidateUser", {
        const response = await fetch(API_URL + "v1/sessions/me", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: 'include',
        })

        alert(`stopping the app from loading with status: ${response.status} and ok: ${response.ok}`);

        if (!response.ok || response.status === 401 || response.status === 403) { 
            console.error("User validation failed, redirecting the login page.")
            alert("User validation failed, redirecting the login page. Contact administrator if issue persists.");
            setTimeout(() => {
                Logout();
                return;
            }, FAIL_WAIT); 
        }

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem("companies_map", data.mapping);
            const company_map = JSON.parse(data.mapping);
            //console.log("companies_map: ", company_map);

            setCompany(company_map[data.user.ActiveCompany]);
            sessionStorage.setItem("company", company_map[data.user.ActiveCompany]);
            //console.log("company: ", company_map[data.user.ActiveCompany]);

            setUser(data.user.Username);
            sessionStorage.setItem("username",data.user.Username);

            // update state variables with latest powerunit...
            setDriverCredentials({
                ...driverCredentials,
                USERNAME: data.user.Username,
                POWERUNIT: data.user.Powerunit
            });
            setUpdateData({
                ...updateData,
                USERNAME: data.user.Username,
                POWERUNIT: data.user.Powerunit
            });
            setFormData({
                ...formData,
                powerUnit: data.user.Powerunit
            });
        }
        else {
            // set fail popup and open...
            setPopup("Fail");
            openPopup();

            // set delay before logging out...
            console.error("User validation failed with valid API response, redirecting the login page.");
            alert("User validation failed, redirecting the login page. Contact administrator if issue persists.");
            setTimeout(() => {
                Logout();
                return;
            }, FAIL_WAIT);
        }

        setLoading(false);
    }

    /*/////////////////////////////////////////////////////////////////
    // validate credentials, prompt for correction in fail or open popup in success...
    [void] : handleUpdate() {
        handleEdit(driverCredentials: username, password, powerunit) - *** save a API call by checking for new PU? ***
        handle errors

        validateDeliveries(updateData: MFSTDATE, POWERUNIT)
        handle errors


        handle error codes to provide error styling on invalid inputs
        ensure valid token + update is needed + return on fail

        update driverCredentials with latest powerunit
        parse response to JSON
        if (success):
            package /driverlog data + navigate
        else:
            reset input field styling
    }
    *//////////////////////////////////////////////////////////////////

    async function handleUpdate(e) {
        // prevent default and reset popup window...
        e.preventDefault();

        // target date and powerunit fields...
        const deliver_field = document.getElementById("dlvdate");
        const power_field = document.getElementById("powerunit");
        
        // map empty field cases to messages...
        let code = -1; // case -1...
        let elementID;
        const alerts = {
            0: "Delivery Date is invalid!", // case 0...
            1: "Powerunit is required!", // case 1...
            2: "Date and Powerunit are both required" // case 2...
        }
        // flag empty username...
        if (!(deliver_field.value instanceof Date) && !isNaN(deliver_field.value)){
            deliver_field.classList.add("invalid_input");
            elementID = "ff_admin_dl_un";
            code += 1;
        } 
        // flag empty powerunit...
        if (power_field.value === "" || power_field.value == null){
            power_field.classList.add("invalid_input");
            elementID = "ff_admin_dl_pu";
            code += 2;
        }

        // catch and alert user to incomplete fields...
        if (code >= 0) {
            showFailFlag(elementID, alerts[code]);
            return;
        }

        // update driver credentials state...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });

        // package driver/delivery credentials and validate...
        const body_data = {
            USERNAME: driverCredentials.USERNAME,
            //PASSWORD: driverCredentials.PASSWORD,
            POWERUNIT: updateData.POWERUNIT,
            MFSTDATE: updateData.MFSTDATE,
        }
        //const response = await fetch(API_URL + "api/Delivery/VerifyPowerunit", {
        const response = await fetch(API_URL + "v1/deliveries/validate-and-assign", {
            body: JSON.stringify(body_data),
            method: "POST",
            headers: {
                //"Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: 'include',
        })

        if (response.status === 401 || response.status === 403) { 
            Logout(); 
        }

        // set message state according to validity of delivery information...
        if(response.ok){           
            // package delivery/driver information and nav to /driverlog...
            const deliveryData = {
                delivery: updateData,
                driver: driverCredentials,
                header: header,
                company: company,
                valid: true
            };

            sessionStorage.setItem("powerunit",updateData.POWERUNIT);
            sessionStorage.setItem("delivery-date",updateData.MFSTDATE);

            navigate(`/deliveries`, {state: deliveryData});
        }
        else {
            //setMessage("Invalid Delivery Information");
            document.getElementById('dlvdate').classList.add("invalid_input");
            document.getElementById('powerunit').classList.add("invalid_input");
        }
    }

    const renderPopup = () => {
        if(popup === "Success"){
            return(
                <>
                    <div className="popupLoginContent">
                        <img id="success" src={Success} alt="success"/>
                        <p>Logged out success!</p>
                    </div>
                </>
            )
        }
        else if(popup === "Fail"){
            return(
                <>
                    <div className="popupLoginContent">
                        <img id="fail" src={Fail} alt="fail"/>
                        <p>Oops! Something went wrong, logging out.</p>
                    </div>
                </>
            )
        }
    }

    // render template...
    return(
        <div id="webpage">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                <Header 
                    company={company}
                    title="Delivery Validation"
                    alt="Confirm Delivery Info"
                    status="Full"
                    currUser={user}
                    MFSTDATE={null} 
                    POWERUNIT={null}
                    STOP = {null}
                    PRONUMBER = {null}
                    MFSTKEY = {null}
                    toggle={header}
                    onClick={collapseHeader}
                />
                <div id="Delivery_Login_Div">
                    <form id="loginForm" onSubmit={handleUpdate}>
                        <div className="input_wrapper">
                            <label htmlFor="dlvdate">Delivery Date:</label>
                            <input type="date" id="dlvdate" value={formData.deliveryDate} onChange={handleDeliveryChange}/>
                            <div className="fail_flag" id="ff_login_un">
                                <p>Date is required!</p>
                            </div>
                        </div>        
                        <div className="input_wrapper">
                            <label htmlFor="powerunit">Power Unit:</label>
                            <input type="text" id="powerunit" value={updateData.POWERUNIT} onChange={handleDeliveryChange}/>
                            <div className="fail_flag" id="ff_login_pw">
                                <p>Power unit is required!</p>
                            </div>
                        </div>
                        <button type="submit" id="dm_confirm_button">Continue</button>
                    </form>
                </div>
                <div id="popupWindow" className="overlay">
                    <div className="popup">
                        <div id="popupExit" className="content">
                            <h1 id="close" className="popupWindow" onClick={closePopup}>&times;</h1>
                        </div>
                        {renderPopup()}
                    </div>
                </div>

                <Footer id="footer" />
                </>
            )}
        </div>
    )
};

export default DriverLogin;
