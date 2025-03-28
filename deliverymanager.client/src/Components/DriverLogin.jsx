/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/7/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Header from './Header';
//import Popup from './Popup';
import Footer from './Footer';
import { scrapeDate, 
    renderDate, 
    getDate, 
    API_URL,
    //getCompany_target,
    cacheToken,
    requestAccess,
    //isCompanyValid, 
    showFailFlag,
    //getCookie,
    //scrapeURL,
    clearMemory,
    COMPANIES} from '../Scripts/helperFunctions';
import Logout from '../Scripts/Logout.jsx';

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

/*function getCookie(name){
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    if(ca != ""){
        for (let i=0; i,ca.length; i++){
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0){
                return c.substring(nameEQ.length, c.length);
            }
        }
    }
    
    return null;
}*/

const DriverLogin = () => {
    //const API_URL = import.meta.env.VITE_API_URL;
    //console.log("API URL:", API_URL);

    // Date processing functions ...
    const currDate = getDate();
    const navigate = useNavigate();

    /* Site state & location processing functions... */

    // initialize company state to null, replace with company on file...
    const [currCompany, setCurrCompany] = useState("");

    const [loading,setLoading] = useState(true);

    // check delivery validity onLoad and after message state change...
    useEffect(() => {
        //let username;
        //let company;
        /*[username,company] = scrapeURL();

        if (username && company) {
            console.log(`User: ${username}\nCompany: ${company} have been parsed from URL`)
            localStorage.setItem('company',company);
        } else {
            clearMemory();
            Logout();
            window.location.href = `https://www.login.tcsservices.com`;
        }
        setCurrCompany(company);*/

        // LEFT OFF HERE!!!!!!!!!!!!!!!!!
        // how to get the username on this end??
        validateUser();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // set popup render status...
    //const [message, setMessage] = useState(null);
    const [currUser,setCurrUser] = useState("Sign In");

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

    /* Page rendering helper functions... */

    /*/////////////////////////////////////////////////////////////////
    // retrieve company from database when not in memory...
    [void] : renderCompany() {
        fetch company name from database (if present)
        if (company is valid):
            setCompany(company)
        else:
            setCompany to placeholder
    } 
    
    async function renderCompany(company) {
        // getCompany() also caches company...
        //const company = await getCompany_DB();
        //const company = await getCompany_target("BRAUNS");
        //const company = localStorage.getItem('company');

        // set company state to value or placeholder... 
        if(company) {
            console.log(`renderCompany retrieved ${company}...`);
            //localStorage.setItem('company', company);
            setCurrCompany(company);
        } else {
            console.log(`renderCompany could not find company...`);
            setCurrCompany("No Company Set");
            //localStorage.removeItem('company');
        }
    }
    *//////////////////////////////////////////////////////////////////

    /*/////////////////////////////////////////////////////////////////
    [void] : openPopup() {
        make popup window visible on screen
        enable on click behavior
    }
    *//////////////////////////////////////////////////////////////////

    /*const openPopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "visible";
        document.getElementById("popupLoginWindow").style.opacity = 1;
        document.getElementById("popupLoginWindow").style.pointerEvents = "auto";  
    };*/

    /*/////////////////////////////////////////////////////////////////
    [void] : closePopup() {
        self explanatory closing of "popupLoginWindow"
        setStatus("") and setMessage(null) - reset state data
    }
    *//////////////////////////////////////////////////////////////////

    const closePopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "hidden";
        document.getElementById("popupLoginWindow").style.opacity = 0;
        document.getElementById("popupLoginWindow").style.pointerEvents = "none";
        
        // reset driver credentials to default...
        // ********** HOW DOES THIS FIT WITH THE MODULE-ORIENTED APPROACH???
        setDriverCredentials({
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        });

        Logout();
    };

    /*async function Logout() {
        clearMemory();
        const response = await fetch(`${API_URL}/api/Registration/Logout`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
        })
        if (response.ok) {
            console.log("Logout Successful!");
            setTimeout(() => {
                window.location.href = `https://www.login.tcsservices.com`;
            },1500)
        } else {
            console.alert("Cookie removal failed, Logout failure.")
        }
    }*/

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
            if (header === "open") {
                setHeader("close");
            } else {
                setHeader("open");
            }
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
    // inactive but required...
    // validate credentials, prompt for correction in fail or open popup in success...
    [void] : validateCredentials(username, password) {
        package snapshot of user credentials
        post user data to database for validation
        parse response to JSON

        if (data.success):
            cache tokens from preliminary API request
            if (task = "driver"):
                set POWERUNIT in states
                reset and open input popup
                reset input field styling
            else if (task = "admin"):
                package admin rendering data
                navigate to /admin
        else:
            set username/password error styling
            return
    }
    

    async function validateCredentials(username, password){
        // package credentials and attempt login...
        const user_data = {
            USERNAME: username,
            PASSWORD: password,
            POWERUNIT: null
        }
        const response = await fetch(API_URL + "api/Registration/Login", {
            body: JSON.stringify(user_data),
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })
        const data = await response.json();
        //console.log(data);

        if (data.success) {
            // stash tokens in storage...
            cacheToken(data.accessToken,data.refreshToken)

            if (data.task === "driver") {
                // update state variables with latest powerunit...
                setDriverCredentials({
                    ...driverCredentials,
                    POWERUNIT: data.powerunit
                });
                setUpdateData({
                    ...updateData,
                    POWERUNIT: data.powerunit
                });

                // reset popup window and open...
                setMessage(null);
                openPopup();
                //alert("Dev Reminder: Use 02/16/2024 for Delivery Date")

                // reset styling to default...
                document.getElementById("USERNAME").classList.remove("visible");
                document.getElementById("PASSWORD").classList.remove("visible");
                //document.getElementById("USERNAME").className = "";
                //document.getElementById("PASSWORD").className = "";
            }
            else if (data.task === "admin") {
                // package admin data and nav to admin page...
                const adminData = {
                    header: header,
                    company: currCompany,
                    valid: true
                };
                navigate('/admin', {state: adminData});
            }
        }
        else {
            // trigger red borders for errors...
            document.getElementById("USERNAME").classList.add("invalid_input");
            document.getElementById("PASSWORD").classList.add("invalid_input");
            //document.getElementById("USERNAME").className = "invalid_input";
            //document.getElementById("PASSWORD").className = "invalid_input";
        }
    }
    *//////////////////////////////////////////////////////////////////

    async function validateUser(){
        //setLoading(true);
        // direct bypass to powerunit validation...
        const response = await fetch(API_URL + "api/Registration/ValidateUser", {
            //body: JSON.stringify(username),
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: 'include',
        })

        if (!response.ok) {Logout()}

        const data = await response.json();
        console.log(data);

        if (data.success) {
            // stash tokens in storage...
            //cacheToken(data.accessToken,data.refreshToken)

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

            setCurrCompany(COMPANIES[data.user.ActiveCompany]);
            setCurrUser(data.user.Username);

            sessionStorage.setItem("company",COMPANIES[data.user.ActiveCompany]);
            sessionStorage.setItem("username",data.user.Username);

            //console.log(`currCompany: ${currCompany}`);
            //console.log(`data.user.Username: ${data.user.Username}`);
            //console.log(`currUser: ${currUser}`);

            // reset popup window and open...
            //setMessage(null);
            //openPopup();
            //alert("Dev Reminder: Use 02/16/2024 for Delivery Date")

            // reset styling to default...
            //document.getElementById("dlvdate").classList.remove("visible");
            //document.getElementById("powerunit").classList.remove("visible");
        }
        else {
            // trigger red borders for errors...
            //document.getElementById("USERNAME").classList.add("invalid_input");
            //document.getElementById("PASSWORD").classList.add("invalid_input");
            //document.getElementById("dlvdate").classList.add("invalid_input");
            //document.getElementById("powerunit").classList.add("invalid_input");
            
            Logout();
            return;
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
        //setMessage(null);

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
            //alert(alerts[code]);
            showFailFlag(elementID, alerts[code]);
            return;
        }

        // request token from memory, refresh as needed...
        /*  REPLACE THIS WITH COOKIE BASED TOKENIZATION */
        /*const token = await requestAccess(driverCredentials.USERNAME);

        // handle invalid token on login...
        if (!token) {
            closePopup();
            return;
        }*/
        
        // update driver credentials state...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });

        // package driver/delivery credentials and validate...
        const body_data = {
            USERNAME: driverCredentials.USERNAME,
            PASSWORD: driverCredentials.PASSWORD,
            POWERUNIT: updateData.POWERUNIT,
            MFSTDATE: updateData.MFSTDATE,
        }
        const response = await fetch(API_URL + "api/Registration/VerifyPowerunit", {
            body: JSON.stringify(body_data),
            method: "POST",
            headers: {
                //"Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: 'include',
        })

        const data = await response.json();

        // set message state according to validity of delivery information...
        if(data.success){           
            // package delivery/driver information and nav to /driverlog...
            const deliveryData = {
                delivery: updateData,
                driver: driverCredentials,
                header: header,
                company: currCompany,
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

    // render template...
    return(
        <div id="webpage">
            {loading ? (
                <div className="loading-container">
                    <p>Loading...</p>
                </div>
            ) : (
                <>
                <Header 
                    company={currCompany}
                    title="Delivery Validation"
                    alt="Confirm Delivery Info"
                    status="Full"
                    currUser={currUser}
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
                        <button type="submit">Validate</button>
                    </form>
                </div>
                {/*<div id="popupLoginWindow" className="overlay">
                    <div className="popupLogin">
                        <div id="popupLoginExit" className="content">
                            <h1 id="close" className="popupLoginWindow" onClick={closePopup}>&times;</h1>
                        </div>
                        <Popup 
                            message={message}
                            date={formData.deliveryDate}
                            powerunit={updateData.POWERUNIT}
                            closePopup={closePopup}
                            handleDeliveryChange={handleDeliveryChange}
                            handleUpdate={handleUpdate}
                            updateData={updateData}
                            driverCredentials={driverCredentials}
                            credentials={driverCredentials}
                            pressButton={submitNewUser}
                            updateNew={updateNewUser}
                            onPressFunc={onPress_functions}
                        />
                    </div>
                </div>*/}
                <Footer id="footer" />
                </>
            )}
        </div>
    )
};

export default DriverLogin;
