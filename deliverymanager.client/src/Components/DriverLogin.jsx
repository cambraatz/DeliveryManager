//////////////////////////////////////////////////////////////////////////////////////
/* 
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

//////////////////////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
DriverLogin() {
    gather current date
    initialize react navigation
    initialize message + status states
    initialize credentials, form data and update data states

    [void] : handleLoginChange(event) {
        if (e.target.id === "USERNAME"):
            update driverCredentials with new username
        if (e.target.id === "PASSWORD"):
            update driverCredentials with new password

        if (invalid log in is changed):
            remove USER/PW error styling (class 'invalid_input') on change
    }
    
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

    useEffect() {
        getCompany() - render company on file once each load
    }

    [void] : handleSubmit(event) {
        prevent default submit behavior
        validate input username and password credentials
    }

    ***

    NOTE: Can this process be streamlined? This seems to be frontend heavy

    ***
    [void] : validateCredentials(username, password) {
        package snapshot of user credentials (saved as "user_data")
        map user_data to a FormData() object prior to "POST" operation

        post user data to database for validation
        parse JSON data from response - "Valid Login." or "Invalid Login."

        if (data === "Valid Login."):
            setStatus to "Verifying Delivery Information." for loading message
            getPowerUnit(username, password) - fetch latest powerunit on file
            openPopup("popupLoginWindow") - open date/powerunit input popup
            reset username/password error styling (if present)
        else:
            setStatus to "Login Credentials Not Found." to flag bad credentials
            set username/password error styling - ** add error flag here **
    }
   
    [void] : getPowerUnit(username) {
        fetch latest powerunit on file attributed with username
        parse JSON data from response

        update driverCredentials with gathered powerunit
        update updateData with gathered powerunit
    }

    [string] : handleEdit(username,password,powerunit) {
        package snapshot of user credentials (saved as "user_data")
        map user_data to a FormData() object prior to "PUT" operation

        update driver credentials on database - ** add error flag here **
        parse JSON data from response
    }

    [string] : validateDeliveries(mfstdate,powerunit) {
        package date and powerunit for mapping
        map user_data to a FormData() object prior to "POST" operation

        post delivery information for validation
        parse JSON data from response

        if "Valid":
            setMessage to "Delivery Information Found"
        else:
            setMessage to "Invalid Delivery Information"

        return data
    }

    [void] : handleUpdate() {
        update driverCredentials with latest powerunit

        handleEdit(driverCredentials: username, password, powerunit) - *** save a API call by checking for new PU? ***
        handle errors

        validateDeliveries(updateData: MFSTDATE, POWERUNIT)
        handle errors
    }

    [void] : openPopup() {
        self explanatory opening of "popupLoginWindow"
    }
    [void] : closePopup() {
        self explanatory closing of "popupLoginWindow"

        setStatus("") and setMessage(null) - reset state data
    }

    initialize header toggle to "open" - default for login screen

    [void] : collapseHeader(event) {
        if (e.target.id === "collapseToggle" or "toggle_dots"):
            open/close header - do opposite of current "header" state
    }

    initialize company state to render active company name

    [void] : getCompany() {
        retrieve the currently saved company name
        if (company is valid):
            set rendered company to company on file
        else:
            render placeholder
    }

    [void] : handleNewUser(e) {
        set user credentials to default
        set popup to new user prompt and open
    }

    [void] : updateDriver() {
        package credentials and cache curr user as previous for updating
        delete previous user to prevent pk conflicts w/ same username
        insert new user credentials
        trigger success message and close popup
    }

    *** 

    NOTE: makes use of same API as admin...be sure no conflicts occur 

    ***
    [void] : pullDriver() {
        fetch driver credentials from curr username
        if (data is invalid) {
            set error styling and return (do nothing)
        }
        else {
            if (data.PASSWORD is NOT null/empty):
                trigger error styling (existing user)
            else:
                set credentials to username and powerunit
                prompt for first password
        }
    }

    ***

    NOTE: can this be renamed for clarity? overly redundant?

    ***
    [void] : submitNewUser(e) {
        handle popup button (login functions)
            set_password: fetch username + powerunit for new user
            submit_user: update user table with newly set password
            cancel_user: exit/close popup
    }

    [void] : updateNewUser(e) {
        clear error styling (if present)
        handle change for new user credentials
    }

    return render template
}

*/////////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Header from './Header';
import Popup from './Popup';
import Footer from './Footer';
import { scrapeDate, 
    renderDate, 
    getDate, 
    API_URL, 
    getToken, 
    isTokenExpiring, 
    refreshToken, 
    cacheToken,
    cacheCompany,
    isCompanyValid,
    getCompany } from '../Scripts/helperFunctions';

const DriverLogin = () => {
    // Date processing functions ...
    const currDate = getDate();
    const navigate = useNavigate();
    const location = useLocation();

    //
    // check delivery validity onLoad and after message state change...
    useEffect(() => {
        const company = isCompanyValid();
        if (!company) {
            renderCompany();
        } else {
            setCompany(company);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Site state & location processing functions...
    const [message, setMessage] = useState(null);
    //const [status, setStatus] = useState("");

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

    const [company, setCompany] = useState(location.state ? location.state.company : "");

    // handle login form changes...
    const handleLoginChange = (e) => {
        let val = e.target.value;
        switch(e.target.id) {
            case 'USERNAME':
                setDriverCredentials({
                    ...driverCredentials,
                    USERNAME: val
                });
                break;
            case 'PASSWORD':
                setDriverCredentials({
                    ...driverCredentials,
                    PASSWORD: val
                });
                break;
            default:
                break;
        }

        if(document.getElementById(e.target.id).className == "invalid_input"){
            // reset styling to default...
            document.getElementById("USERNAME").className = "";
            document.getElementById("PASSWORD").className = "";
        }
    };

    // handle delivery query form changes...
    const handleDeliveryChange = (e) => {
        //console.log("e.target.id: ",e.target.id)
        if( document.getElementById(e.target.id).classList.contains("invalid_input") ){
            // reset styling to default...
            document.getElementById("USERNAME").className = "";
            document.getElementById("PASSWORD").className = "";
            document.getElementById("dlvdate").className = "input_form"
            document.getElementById("powerunit").className = "input_form"
        }

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
        /*
        if(document.getElementById(e.target.id).style.backgroundColor != "white"){
            // reset styling to default...
            document.getElementById("dlvdate").className = "input_form"
            document.getElementById("powerunit").className = "input_form"
        }*/
    };
    
    /*
    // API Calls and Functionality ...
    */

    // handleClick on initial Login button...
    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage(null);
        if (document.getElementById("USERNAME").value === "" || document.getElementById("PASSWORD").value === "") {
            if (document.getElementById("USERNAME").value === "") {
                document.getElementById("USERNAME").classList.add("invalid_input");
            }
            if (document.getElementById("PASSWORD").value === "") {
                document.getElementById("PASSWORD").classList.add("invalid_input");
            }
            return;
        }
        
        validateCredentials(driverCredentials.USERNAME,driverCredentials.PASSWORD);
    };

    // validate credentials, prompt for correction in fail or open popup in success...
    async function validateCredentials(username, password){
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

                setMessage(null);
                openPopup();
                //alert("Dev Reminder: Use 02/16/2024 for Delivery Date")

                // reset styling to default...
                document.getElementById("USERNAME").className = "";
                document.getElementById("PASSWORD").className = "";
            }
            else if (data.task === "admin") {
                const adminData = {
                    header: header,
                    company: company
                };
    
                navigate('/admin', {state: adminData})
            }
        }
        else {
            //setStatus("Login Credentials Not Found.");

            // trigger red borders for errors...
            document.getElementById("USERNAME").className = "invalid_input";
            document.getElementById("PASSWORD").className = "invalid_input";
        }
    }

    //
    // onClick response to validate date and power unit data prior to pulling manifest...
    async function handleUpdate() {
        let token = getToken();
        if (!token) {
            console.error("Invalid authorization token");
            closePopup();
            throw new Error("Authorization failed. Please log in.");
        }

        if (isTokenExpiring(token)) {
            console.log("Token expiring soon. Refreshing...");
            const tokens = await refreshToken(driverCredentials.USERNAME);
            token = tokens.access
        }
        
        // update driver credentials state...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });

        const body_data = {
            USERNAME: driverCredentials.USERNAME,
            PASSWORD: driverCredentials.PASSWORD,
            POWERUNIT: updateData.POWERUNIT,
            MFSTDATE: updateData.MFSTDATE,
        }

        /*let formData = new FormData();
        for (const [key,value] of Object.entries(body_data)){
            formData.append(key,value)
        }*/

        const response = await fetch(API_URL + "api/Registration/VerifyPowerunit", {
            body: JSON.stringify(body_data),
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })

        const data = await response.json();

        // set message state according to validity of delivery information...
        if(data.success){           
            // package delivery/driver information
            const deliveryData = {
                delivery: updateData,
                driver: driverCredentials,
                header: header,
                company: company
            };
            console.log(deliveryData);
            
            navigate(`/driverlog`, {state: deliveryData});
        }
        else {
            setMessage("Invalid Delivery Information");
            document.getElementById('dlvdate').classList.add("invalid_input");
            document.getElementById('powerunit').classList.add("invalid_input");
        }
    }

    //
    // open popup for delivery confirmation...
    const openPopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "visible";
        document.getElementById("popupLoginWindow").style.opacity = 1;
        document.getElementById("popupLoginWindow").style.pointerEvents = "auto";  
    };

    //
    // close popup for delivery confirmation...
    const closePopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "hidden";
        document.getElementById("popupLoginWindow").style.opacity = 0;
        document.getElementById("popupLoginWindow").style.pointerEvents = "none";
        
        // reset status and message to original state...
        //setStatus("");
        //setMessage(null);

        setDriverCredentials({
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        });
    };

    const [header,setHeader] = useState("open");

    const collapseHeader = (e) => {
        //console.log(e.target.id);
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            if (header === "open") {
                setHeader("close");
            } else {
                setHeader("open");
            }
        }
    }

    // "Edit User", "Find User", "Change Company"...
    //const [popup, setPopup] = useState("Edit User");

    async function renderCompany() {
        const company = getCompany();
        if(company) {
            setCompany(company);
        } else {
            setCompany("{Your Company Here}");
        }
    }

    /*
    async function getCompany() {
        //console.log(`getting company...`)
        const response = await fetch(API_URL + "api/Registration/GetCompany?COMPANYKEY=c01", {
            method: "GET",
        })

        // data = {COMPANYKEY: "", COMPANYNAME: ""}...
        const data = await response.json();

        if (data.success) {
            //console.log("new company: ", data["COMPANYNAME"]);
            setCompany(data.COMPANYNAME);
            cacheCompany(data.COMPANYNAME);
        }
        else {
            //console.log(data);
            setCompany("{Your Company Here}");
        }
    }*/

    async function handleNewUser() {
        //console.log(e.target);
        const user_data = {
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        }
        setDriverCredentials(user_data);
        setMessage("New User Signin");
        openPopup();
    }

    async function updateDriver() {
        //console.log(`replace with ${renderCredentials}`);
        let token = getToken();
        if (!token) {
            setMessage("Fail");
            setTimeout(() => {
                closePopup();
            },1000)

            console.error("Invalid authorization token");
            throw new Error("Authorization failed. Please log in.");
        }

        if (isTokenExpiring(token)) {
            console.log("Token expiring soon. Refreshing...");
            const tokens = await refreshToken(driverCredentials.USERNAME);
            token = tokens.access
        }

        const body_data = {
            USERNAME: driverCredentials.USERNAME,
            PASSWORD: driverCredentials.PASSWORD,
            POWERUNIT: driverCredentials.POWERUNIT,
            PREVUSER: driverCredentials.USERNAME
        }

        const response = await fetch(API_URL + "api/Registration/ReplaceDriver", {
            body: JSON.stringify(body_data),
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })

        const data = await response.json();
        //console.log(data);

        if (data.success) {
            setMessage("Update Success");
            setTimeout(() => {
                closePopup();
            },1000)
        }
        else {
            setMessage("Fail");
            setTimeout(() => {
                closePopup();
            },1000)
        }        
    }

    async function pullDriver() {
        //console.log(`find me ${renderCredentials.USERNAME}`)
        let token = getToken();
        if (!token) {
            setMessage("Fail");
            setTimeout(() => {
                closePopup();
            },1000)

            console.error("Invalid authorization token");
            throw new Error("Authorization failed. Please log in.");
        }

        if (isTokenExpiring(token)) {
            console.log("Token expiring soon. Refreshing...");
            const tokens = await refreshToken(driverCredentials.USERNAME);
            token = tokens.access
        }
        
        /*let formData = new FormData();
        formData.append("USERNAME",driverCredentials.USERNAME);
        formData.append("PASSWORD",null);
        formData.append("POWERUNIT",null);*/

        const body_data = {
            USERNAME: driverCredentials.USERNAME,
            PASSWORD: null,
            POWERUNIT: null
        }

        const response = await fetch(API_URL + "api/Registration/PullDriver", {
            body: JSON.stringify(body_data),
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })

        const data = await response.json()
        //console.log(data);

        // catch failed request and prevent behavior...
        if (!data[0]) {
            document.getElementById("username").className = "invalid_input";
        }
        else {
            if (data[0].PASSWORD !== '' && data[0].PASSWORD !== null){
                //console.log(`non-empty password: ${data[0].PASSWORD}`)
                document.getElementById("username").className = "invalid_input";
            }
            else {
                //setDriverCredentials(data[0]);
                setDriverCredentials({
                    USERNAME: data[0].USERNAME,
                    PASSWORD: "",
                    POWERUNIT: data[0].POWERUNIT
                })
                //console.log(driverCredentials);
                setMessage("Edit New User");
            }
        }
    }

    async function cancelDriver() {
        setDriverCredentials({
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        })
        closePopup();
    }

    async function submitNewUser(e) {
        e.preventDefault();
        console.log("target parent: ", e.target.parentElement.id);
        console.log("target: ", e.target);
        if (e.target.id == "edit_new_user") {
            updateDriver();
            return;
        }
        switch(e.target.parentElement.id){
            case "set_password":
                pullDriver();
                break;
            case "submit_user":
                updateDriver();
                break;
            case "cancel_user":
                closePopup();
                break;
            default:
                break;
        }
    }

    async function updateNewUser(e) {
        //console.log(`updateNewUser [${e.target.id}]: ${e.target.value}`);
        if (document.getElementById(e.target.id).className == "invalid_input"){
            // reset styling to default...
            document.getElementById("username").className = "";
            document.getElementById("password").className = "";
            document.getElementById("powerunit").className = "";
        }

        let val = e.target.value;
        switch(e.target.id){
            case 'username':
                setDriverCredentials({
                    ...driverCredentials,
                    USERNAME: val
                });
                break;
            case 'password':
                setDriverCredentials({
                    ...driverCredentials,
                    PASSWORD: val
                });
                break;
            case 'powerunit':
                setDriverCredentials({
                    ...driverCredentials,
                    POWERUNIT: val
                });
                break;
            default:
                break;
        }
    }

    const onPress_functions = {
        "pullDriver": pullDriver,
        "updateDriver": updateDriver,
        "cancelDriver": cancelDriver
    };

    //
    // render template...
    return(
        <div id="webpage">
            <Header 
                company={company}
                title="Driver Login"
                alt="Enter your login credentials"
                status="Off"
                currUser="Sign In"
                MFSTDATE={null} 
                POWERUNIT={null}
                STOP = {null}
                PRONUMBER = {null}
                MFSTKEY = {null}
                toggle={header}
                onClick={collapseHeader}
            />
            <div id="Delivery_Login_Div">
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="USERNAME">Username:</label>
                        <input type="text" id="USERNAME" value={driverCredentials.USERNAME} onChange={handleLoginChange}/>
                    </div>        
                    <div>
                        <label htmlFor="PASSWORD">Password:</label>
                        <input type="password" id="PASSWORD" value={driverCredentials.PASSWORD} onChange={handleLoginChange}/>
                    </div>
                    {/*<h4>{status}</h4>*/}
                    <h4 id="new_user" onClick={handleNewUser}>New User Sign-in</h4>
                    <button type="submit">Login</button>
                </form>
            </div>
            <div id="popupLoginWindow" className="overlay">
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
            </div>
            <Footer id="footer" />
        </div>
    )
};

export default DriverLogin;
