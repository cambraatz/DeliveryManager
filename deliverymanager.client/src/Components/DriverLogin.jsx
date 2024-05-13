import { useState, useEffect, React } from 'react';
import { useNavigate } from "react-router-dom";
import UserWidget from './UserWidget';
import Header from './Header';
import { scrapeDate, renderDate } from '../Scripts/helperFunctions';

const DriverLogin = () => {
    //
    /* Header information for API call reference */
    const term = "Delivery";
    //const API_URL = "http://localhost:5269/";
    //const API_URL = "http://localhost:5173/";
    //const API_URL = "http://localhost:7200/";
    //const API_URL = "http://localhost:47317/";
    //const API_URL = "http://localhost:5113/";

    const API_URL = "http://tcsservices.com:40730/"
    const headers = {
        'Content-Type': 'application/json',
    };

    //
    /* Date and time data and processing functions */
    const now = new Date();
    
    const year = now.getFullYear();
    var month = now.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var day = now.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    const currDate = year + "-" + month + "-" + day;

    const scrapeDate = (date) => {
        const year = date.slice(0,4);
        const month = date.slice(5,7);
        const day = date.slice(8);
        return month + day + year;
    };

    const renderDate = (date) => {
        const year = date.slice(0,4);
        const month = date.slice(5,7);
        const day = date.slice(8);
        return year + "-" + month + "-" + day;
    };

    //
    // Application State Information...
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: '',
        PASSWORD: '',
        POWERUNIT: null,
    })

    const [formData, setFormData] = useState({
        deliveryDate: currDate,
        powerUnit: driverCredentials.POWERUNIT,
    });

    const [updateData, setUpdateData] = useState({
        MFSTDATE: scrapeDate(currDate),
        POWERUNIT: "000"
    });

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
    };

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
    };

    //
    // API Calls and Functionality...
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        //alert("handleSubmit: username: " + driverCredentials.USERNAME + " password: " + driverCredentials.PASSWORD);
        validateCredentials(driverCredentials.USERNAME,driverCredentials.PASSWORD);
    };

    async function validateCredentials(username, password){
        //alert("validateCredentials: username: " + username + " password: " + password);
        await fetch(API_URL + "api/Registration/Login?USERNAME=" + username + "&PASSWORD=" + password, {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        .then(response => response.json())
        .then(data => {
            let response = data;
            //alert(response);
            if (response === "Valid Login.") {
                //setLoading(true)
                setStatus("Verifying Driver Information.");
                getPowerUnit(username, password);
                //setLoading(false)
                //navigate('driverlog', {state: driverCredentials})
            }
            else {
                setStatus("Login Credentials Not Found, Try Again.");
                //alert("not valid user");
                //alert(data)
                //setDriverCredentials(data)
                //navigate('driverlog', {state: driverCredentials})
            }
            openPopup();
        })
    };

    async function getPowerUnit(username, password){
        //alert("getPowerUnit: username: " + username + " password: " + password);
        await fetch(API_URL + "api/Registration/GetDriver?USERNAME=" + username + "&PASSWORD=" + password, {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        .then(response => response.json())
        .then(data => {
            let object = data; 
            setDriverCredentials({
                ...driverCredentials,
                POWERUNIT: object[0].POWERUNIT
            });
            setUpdateData({
                ...updateData,
                POWERUNIT: object[0].POWERUNIT
            });
        })
    };

    
    useEffect(() => {
        setLoading(false);
    }, [driverCredentials]);

    async function updatePowerunit(username, password, powerunit){
        //alert("deleting driver")
        await fetch(API_URL + "api/Registration/ChangePowerunit?USERNAME=" + username + "&PASSWORD=" + password, "&POWERUNIT=" + powerunit, {
            method: "PUT",
            headers,
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            //setLoading(false);
        });
    };

    async function handleDelete(powerunit){
        //alert("deleting driver")
        const response = await fetch(API_URL + "api/Registration/DeleteDriver?POWERUNIT=" + powerunit, {
            method: "DELETE",
            headers,
        })
        console.log(response);
        return response;

        //.then(response => response.json())
        //.then(result => {
            //console.log(result);
            //setLoading(false);
        //});
    };

    async function handleCreate(username,password,powerunit){
        //alert("creating driver: " + username + "pasword: " + password + "powerunit: " + powerunit)
            
        const driverString = '?USERNAME='+username+'&PASSWORD='+password+'&POWERUNIT='+powerunit

        const response = await fetch(API_URL + "api/Registration/AddPowerunit" + driverString, {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        })
        console.log(response);
        return response;

        //.then(response => response.json())
        //.then(result => {
            //console.log(result);
            //setLoading(false);
        //});
    };

    async function handleUpdate() {
        //alert(JSON.stringify(driverCredentials));
        console.log("driverCredentials (pre-delete):" + JSON.stringify(driverCredentials));
        
        //updateDelivery(delivery.MFSTKEY);
        //setLoading(true);

        await handleDelete(driverCredentials.POWERUNIT);
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData.POWERUNIT
        });
        
        //add logic to validate powerunit/delivery date
        await handleCreate(driverCredentials.USERNAME,driverCredentials.PASSWORD,updateData.POWERUNIT);
        //updatePowerunit(driverCredentials.USERNAME,driverCredentials.PASSWORD,updateData.POWERUNIT);

        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials
        };

        //navigate(`/driverlog`, {state: driverCredentials});
        //alert(JSON.stringify(deliveryData));
        console.log("deliveryData (post-create):" + JSON.stringify(deliveryData));
        navigate(`/driverlog`, {state: deliveryData});
    };

    const Login = () => {
        //alert(driverCredentials["POWERUNIT"])
        navigate('driverlog', {state: driverCredentials})
        //setLoading(false)
    };

    const openPopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "visible";
        document.getElementById("popupLoginWindow").style.opacity = 1;
        document.getElementById("popupLoginWindow").style.pointerEvents = "auto";
    };

    const closePopup = () => {
        document.getElementById("popupLoginWindow").style.visibility = "hidden";
        document.getElementById("popupLoginWindow").style.opacity = 0;
        document.getElementById("popupLoginWindow").style.pointerEvents = "none";
        setStatus("");
    };

    if(loading) {
        return(<h3>Verifying Driver Credentials...</h3>)
    }

    return(
        <div id="webpage">
            <Header 
                title="Shipment Checkoff"
                alt="Enter your login credentials"
                status="Off"
                currUser="Sign In"
                MFSTDATE={null} 
                POWERUNIT={null}
                STOP = {null}
                PRONUMBER = {null}
                MFSTKEY = {null}
            />
            {/*<UserWidget driver="Sign In" status="Off"/>
            <h2>TCS Driver Manifest Shipment Checkoff</h2>*
            <h3 className="prompt">Enter your login credentials</h3>*/}
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
                    <h3>{status}</h3>
                    <h4><a href="mailto:cameronbraatz@gmail.com">Not an existing user?</a></h4>
                    <button type="submit">Log In</button>
                    {/*<button type="submit" onClick={openPopup}>Log In</button>*/}
                </form>
            </div>
            <div id="popupLoginWindow" className="overlay">
                <div className="popupLogin">
                    <div id="popupLoginExit" className="content">
                        <h1 id="close" onClick={closePopup}>&times;</h1>
                    </div>
                    <div id="popupLoginPrompt" className="content">
                        <p>Confirm Delivery Info</p>
                    </div>
                    <div className="popupLoginContent">
                        <div>
                            <label>Delivery Date:</label>
                            <input type="date" id="dlvdate" value={formData.deliveryDate} className="input_form" onChange={handleDeliveryChange} />
                        </div>
                        <div>
                            <label>Power Unit:</label>
                            <input type="text" id="powerunit" value={updateData.POWERUNIT} className="input_form" onChange={handleDeliveryChange} />
                        </div>
                        <div id="popupLoginInner">
                            <button onClick={handleUpdate}>Continue</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default DriverLogin;