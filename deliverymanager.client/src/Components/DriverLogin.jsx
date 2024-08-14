import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Header from './Header';
import Popup from './Popup';
import { scrapeDate, renderDate, getDate, API_URL } from '../Scripts/helperFunctions';

/* 
// DriverLogin serves as the home page for the driver application...
// Function handles log in credential and delivery validation...
*/
const DriverLogin = () => {
    /*
    // Header information for API call reference ...
    */
    //const API_URL = "http://localhost:5113/";
    //const API_URL = "http://www.tcsservices.com:40730/"
    //const API_URL = "http://www.deliverymanager.tcsservices.com:40730/"

    /*
    // Date processing functions ...
    */
    const currDate = getDate();

    /*
    // Site state & location processing functions...
    */
    const [message, setMessage] = useState(null);
    const [status, setStatus] = useState("");

    // state 'driverCredentials' to be passed to next page...
    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: '',
        PASSWORD: '',
        POWERUNIT: null,
    })

    // state 'formData' for rendering forms on page...
    const [formData, setFormData] = useState({
        deliveryDate: currDate,
        powerUnit: driverCredentials.POWERUNIT,
    });

    // state 'updateData' to be passed to next page...
    const [updateData, setUpdateData] = useState({
        MFSTDATE: scrapeDate(currDate),
        POWERUNIT: "000"
    });

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
        //if(document.getElementById(e.target.id).style.backgroundColor != ""){
        if(document.getElementById(e.target.id).className == "invalid_input"){
            // reset styling to default...
            /*
            document.getElementById(e.target.id).style.border = "1px solid black";
            document.getElementById(e.target.id).style.borderRadius = "3px";
            document.getElementById(e.target.id).style.borderStyle = "solid";
            document.getElementById(e.target.id).style.backgroundColor = "white";
            */
            document.getElementById("USERNAME").className = "";
            document.getElementById("PASSWORD").className = "";
        }
    };

    // handle delivery query form changes...
    const handleDeliveryChange = (e) => {
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
        if(document.getElementById(e.target.id).style.backgroundColor != "white"){
            // reset styling to default...
            document.getElementById("dlvdate").className = "input_form"
            document.getElementById("powerunit").className = "input_form"
        }
    };
    
    /*
    // API Calls and Functionality ...
    */
    const navigate = useNavigate();

    //
    // check delivery validity onLoad and after message state change...
    useEffect(() => {
        checkDelivery(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message])

    // handleClick on initial Login button...
    const handleSubmit = (e) => {
        e.preventDefault();
        validateCredentials(driverCredentials.USERNAME,driverCredentials.PASSWORD);
    };

    // validate credentials, prompt for correction in fail or open popup in success...
    async function validateCredentials(username, password){
        const response = await fetch(API_URL + "api/Registration/Login?USERNAME=" + username + "&PASSWORD=" + password, {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        const data = await response.json();

        if (data === "Valid Login.") {
            setStatus("Verifying Delivery Information.");
            getPowerUnit(username, password);
            openPopup("popupLoginWindow");
            //alert("Dev Reminder: Use 02/16/2024 for Delivery Date")

            // reset styling to default...
            /*
            document.getElementById("USERNAME").style.border = "";
            document.getElementById("USERNAME").style.borderRadius = "";
            document.getElementById("USERNAME").style.backgroundColor = "";
            document.getElementById("PASSWORD").style.border = "";
            document.getElementById("PASSWORD").style.borderRadius = "";
            document.getElementById("PASSWORD").style.backgroundColor = "";
            */
            document.getElementById("USERNAME").className = "";
            document.getElementById("PASSWORD").className = "";
        }
        else {
            setStatus("Login Credentials Not Found.");

            // trigger red borders for errors...
            /*
            document.getElementById("USERNAME").style.border = "1.5px solid red";
            document.getElementById("USERNAME").style.borderRadius = "3px";
            document.getElementById("USERNAME").style.backgroundColor = "#ffdddd";
            document.getElementById("PASSWORD").style.border = "1.5px solid red";
            document.getElementById("PASSWORD").style.borderRadius = "3px";
            document.getElementById("PASSWORD").style.backgroundColor = "#ffdddd";
            */
            document.getElementById("USERNAME").className = "invalid_input";
            document.getElementById("PASSWORD").className = "invalid_input";
        }
    }

    //
    // pull existing powerunit from records associated to provided credentials...
    async function getPowerUnit(username){
        const response = await fetch(API_URL + "api/Registration/GetDriver?USERNAME=" + username, {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        const data = await response.json(); 

        // update state variables with latest powerunit...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: data[0].POWERUNIT
        });
        setUpdateData({
            ...updateData,
            POWERUNIT: data[0].POWERUNIT
        });
    }

    /*
    //
    // delete identified driver to make room for new recorded driver...
    async function handleDelete(powerunit){
        const response = await fetch(API_URL + "api/Registration/DeleteDriver?POWERUNIT=" + powerunit, {
            method: "DELETE",
            headers,
        })
        //console.log(response);
        return response;
    }

    //
    // update the provided driver's records with new powerunit...
    async function handleCreate(username,password,powerunit){
        const driverString = '?USERNAME='+username+'&PASSWORD='+password+'&POWERUNIT='+powerunit

        const response = await fetch(API_URL + "api/Registration/AddPowerunit" + driverString, {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        //console.log(response);
        return response;
    }
    */

    //
    // update the existing driver's records with new information...
    async function handleEdit(username,password,powerunit){
        const driverString = '?USERNAME='+username+'&PASSWORD='+password+'&POWERUNIT='+powerunit

        const response = await fetch(API_URL + "api/Registration/UpdateDriver" + driverString, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })

        return response;
    }

    //
    // validate given delivery exists in database
    async function validateDeliveries(mfstdate,powerunit){
        const driverString = '?MFSTDATE='+mfstdate+'&POWERUNIT='+powerunit
        const response = await fetch(API_URL + "api/Registration/VerifyPowerunit" + driverString, {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        const data = await response.json();

        // set message state according to validity of delivery information...
        if(data === "Valid"){
            setMessage("Delivery Information Found");
        }
        else{
            setMessage("Invalid Delivery Information");
        }
        return data;
    }

    /*
    //
    // onClick response to validate date and power unit data prior to pulling manifest...
    async function handleUpdate() {
        // delete existing driver credentials from db...
        await handleDelete(driverCredentials.POWERUNIT);

        // update driver credentials state...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });
        
        // create new driver credentials in db...
        await handleCreate(driverCredentials.USERNAME,driverCredentials.PASSWORD,updateData.POWERUNIT);

        // validate current delivery information prior to redirect...
        await validateDeliveries(updateData.MFSTDATE,updateData.POWERUNIT);
    }
    */

    async function handleUpdate() {
        // update driver credentials state...
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });

        await handleEdit(driverCredentials.USERNAME,driverCredentials.PASSWORD,updateData.POWERUNIT);

        // validate current delivery information prior to redirect...
        await validateDeliveries(updateData.MFSTDATE,updateData.POWERUNIT);
    }

    //
    // onEffect function to load manifest only once valid deliveries have been verified...
    const checkDelivery = () => {
        // if delivery is valid, proceed to driver log...
        if(message === "Delivery Information Found"){
            // package delivery/driver information
            const deliveryData = {
                delivery: updateData,
                driver: driverCredentials
            };

            navigate(`/driverlog`, {state: deliveryData});
        }
    };

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
        setStatus("");
        setMessage(null);
    };

    //
    // render template...
    return(
        <div id="webpage">
            <Header 
                title="Driver Login"
                alt="Enter your login credentials"
                status="Off"
                currUser="Sign In"
                MFSTDATE={null} 
                POWERUNIT={null}
                STOP = {null}
                PRONUMBER = {null}
                MFSTKEY = {null}
            />
            <div id="Delivery_Login_Div">
                <form id="loginForm" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="USERNAME">Username:</label>
                        <input type="text" id="USERNAME" onChange={handleLoginChange} required />
                    </div>        
                    <div>
                        <label htmlFor="PASSWORD">Password:</label>
                        <input type="password" id="PASSWORD" onChange={handleLoginChange} required/>
                    </div>
                    <h4>{status}</h4>
                    <h4><a href="mailto:cameronbraatz@gmail.com">Not an existing user?</a></h4>
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
                    />
                </div>
            </div>
        </div>
    )
};

export default DriverLogin;