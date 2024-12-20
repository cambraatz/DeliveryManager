/*/////////////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2024

*//////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import Header from './Header';
import Popup from './Popup';
import Footer from './Footer';
import { API_URL } from '../Scripts/helperFunctions';

/*/////////////////////////////////////////////////////////////////////////////
 
AdminPortal() - Administrative menu page and functionality

The following React functional component structures and renders the 
administrative menu user interface accessed only from successful login using 
admin credentials. The page allows users to add, edit and remove users from the 
driver database. Additionally, the page allows the admin user to change the 
name of the company to be dynamically rendered across the application.

Logic flow:
- gather header state (open/collapse) from location
- set credentials + previous user states to empty (default)
- set popup state to control popup content
- set company+active company state to value found in location.state

- useEffect(): calls getCompany() to ensure company name is up to date
- collapseHeader(): open/collapse header function (see if this can be sent as prop)
- open/closePopup(): handle opening and closing popup styling
- clearStyling(): remove invalid_input styling from input

- handleUpdate(): handle form updates, update respective credentials value
- addDriver(): collect credentials/prev user (set to 'add new') and add to DB
- pullDriver(): retrieve user credentials for a given username (edit/remove)
- updateDriver(): collect credentials/prev user (scraped) and update in DB
- removeDriver(): remove record from DB that matches credentials.USERNAME
- cancelDriver(): handle cancel, clear credentials and close popup

- pressButton(): handle unique behavior of collection of admin buttons





- getCompany(): retrieve the active company name from DB
- updateCompany(): update active company name with provided user input

*//////////////////////////////////////////////////////////////////////////////


const AdminPortal = () => {
    /*/////////////////////////////////////////////////////////////////////////////
       State and Location Initialization...
    *//////////////////////////////////////////////////////////////////////////////

    const location = useLocation();

    const [header,setHeader] = useState(location.state ? location.state.header : "open");

    const [renderCredentials, setRenderCredentials] = useState({
        USERNAME: "",
        PASSWORD: "",
        POWERUNIT: ""
    }) 
    const [previousUser, setPreviousUser] = useState("");

    // "Edit User", "Find User", "Change Company"...
    const [popup, setPopup] = useState("Edit User");

    const [company, setCompany] = useState(location.state ? location.state.company : "contact system admin");
    const [activeCompany, setActiveCompany] = useState(company);


    /*/////////////////////////////////////////////////////////////////////////////
       Page Rendering Logic / Helpers...
    *//////////////////////////////////////////////////////////////////////////////

    useEffect(() => {
        getCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCompany])

    // toggle header open status...
    const collapseHeader = (e) => {
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            setHeader(prev => (prev === "open" ? "close" : "open"));
        }
    }

    // open popup for delivery confirmation...
    const openPopup = () => {
        document.getElementById("popupAddWindow").style.visibility = "visible";
        document.getElementById("popupAddWindow").style.opacity = 1;
        document.getElementById("popupAddWindow").style.pointerEvents = "auto";  
    };

    // close popup for delivery confirmation...
    const closePopup = () => {
        /*if (document.getElementById("username") && document.getElementById("username").className === "invalid_input") {
            document.getElementById("username").classList.remove("invalid_input");
        }*/
        document.getElementById("popupAddWindow").style.visibility = "hidden";
        document.getElementById("popupAddWindow").style.opacity = 0;
        document.getElementById("popupAddWindow").style.pointerEvents = "none";
        clearStyling();
    };

    const clearStyling = () => {
        if (document.getElementById("username") && document.getElementById("username").classList.contains("invalid_input")) {
            document.getElementById("username").classList.remove("invalid_input");
        }
        if (document.getElementById("password") && document.getElementById("password").classList.contains("invalid_input")) {
            document.getElementById("password").classList.remove("invalid_input");
        }
        if (document.getElementById("powerunit") && document.getElementById("powerunit").classList.contains("invalid_input")) {
            document.getElementById("powerunit").classList.remove("invalid_input");
        }
        if (document.getElementById("company") && document.getElementById("company").classList.contains("invalid_input")) {
            document.getElementById("company").classList.remove("invalid_input");
        }
    }


    /*/////////////////////////////////////////////////////////////////////////////
       Page Rendering Logic / Helpers...
    *//////////////////////////////////////////////////////////////////////////////

    const handleUpdate = (e) => {
        clearStyling();
        let val = e.target.value;
        switch(e.target.id){
            case 'username':
                setRenderCredentials({
                    ...renderCredentials,
                    USERNAME: val
                });
                break;
            case 'password':
                setRenderCredentials({
                    ...renderCredentials,
                    PASSWORD: val
                });
                break;
            case 'powerunit':
                setRenderCredentials({
                    ...renderCredentials,
                    POWERUNIT: val
                });
                break;
            case "company":
                setCompany(val);
                break;
            default:
                break;
        }
    }

    async function addDriver() {
        //e.prevent.default()
        if (document.getElementById("username").value === "" || document.getElementById("password") === "") {
            if (document.getElementById("username").value === "") {
                document.getElementById("username").classList.add("invalid_input");
            }
            if (document.getElementById("powerunit").value === "") {
                document.getElementById("powerunit").classList.add("invalid_input");
            }
            setTimeout(() => {
                alert("Username and Powerunit are both Required!");
            },200)
            return;
        }

        //console.log(`replace with ${renderCredentials}`);
        let formData = new FormData()
        formData.append("USERNAME", renderCredentials.USERNAME);
        formData.append("PASSWORD", null);
        formData.append("POWERUNIT", renderCredentials.POWERUNIT);

        //const form = ["USERNAME","PASSWORD","POWERUNIT","PREVUSER"];
        //form.forEach(key => console.log(`${key}: ${formData.get(key)}`));

        // eslint-disable-next-line no-unused-vars
        const response = await fetch(API_URL + "api/Registration/AddDriver", {
            body: formData,
            method: "PUT",
        })

        const data = await response.json();
        //console.log(data);

        if (data.success) {
            setPopup("Add Success");
            setTimeout(() => {
                closePopup();
            },1000)
        }
        else {
            console.trace("add driver failed");
            setPopup("Fail");
            setTimeout(() => {
                closePopup();
            },1000)
        }
    }

    async function pullDriver() {
        //console.log(`find me ${renderCredentials.USERNAME}`)

        if (document.getElementById("username").value === "") {
            document.getElementById("username").classList.add("invalid_input");
            setTimeout(() => {
                alert("Username is Required!");
            },200)
            return;
        }

        let formData = new FormData();
        formData.append("USERNAME",renderCredentials.USERNAME);
        formData.append("PASSWORD",null);
        formData.append("POWERUNIT",null);

        const response = await fetch(API_URL + "api/Registration/PullDriver", {
            body: formData,
            method: "POST",
        })

        const data = await response.json()
        //console.log(data);

        // catch failed request and prevent behavior...
        if (data[0]) {
            const rendersafe_Credentials = Object.keys(data[0]).reduce((acc, key) => {
                acc[key] = data[0][key] === null ? "" : data[0][key];
                return acc;
            }, {});

            setPreviousUser(renderCredentials.USERNAME);
            setRenderCredentials(rendersafe_Credentials);
            setPopup("Edit User");
        }
        else {
            document.getElementById("username").className = "invalid_input";
        }
    }

    async function updateDriver() {
        if (document.getElementById("powerunit").value === "") {
            document.getElementById("powerunit").classList.add("invalid_input");
            setTimeout(() => {
                alert("Power Unit is Required!");
            },200)
            return;
        }

        //console.log(`replace with ${renderCredentials}`);
        let formData = new FormData();
        for (const [key,value] of Object.entries(renderCredentials)){
            formData.append(key,value)
        }
        formData.append("PREVUSER", previousUser);

        //const form = ["USERNAME","PASSWORD","POWERUNIT","PREVUSER"];
        //form.forEach(key => console.log(`${key}: ${formData.get(key)}`));

        // eslint-disable-next-line no-unused-vars
        const response = await fetch(API_URL + "api/Registration/ReplaceDriver", {
            body: formData,
            method: "PUT",
        })

        const data = await response.json();
        //console.log(data);

        if (data.success) {
            setPreviousUser("add new");
            setPopup("Update Success");
            setTimeout(() => {
                closePopup();
            },1000)
        }
        else {
            console.trace("update driver failed");
            setPopup("Fail");
            setTimeout(() => {
                closePopup();
            },1000)
        } 
    }

    async function removeDriver() {
        //console.log(`removing user: ${renderCredentials.USERNAME}`);

        // eslint-disable-next-line no-unused-vars
        const response = await fetch(API_URL + "api/Registration/DeleteDriver?USERNAME=" + renderCredentials.USERNAME, {
            method: "DELETE",
        })

        const data = await response.json();
        //console.log(data);

        /*setPopup("Delete Success");
        
        setTimeout(() => {
            closePopup();
        },1000)*/

        if (data.success) {
            setPopup("Delete Success");
            setTimeout(() => {
                closePopup();
            },1000)
        }
        else {
            console.trace("delete driver failed");
            setPopup("Fail");
            setTimeout(() => {
                closePopup();
            },1000)
        } 
    }

    async function cancelDriver() {
        closePopup();
        setRenderCredentials({
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        })
    }

    async function pressButton(e) {
        setRenderCredentials({
            USERNAME: "",
            PASSWORD: "",
            POWERUNIT: ""
        })

        // handle main admin button popup generation
        switch(e.target.innerText){
            case "Add New User":
                setPopup("Add User");
                setPreviousUser("add new");
                break;
            case "Change/Remove User":
                setPopup("Find User");
                break;
            case "Edit Company Name":
                setPopup("Change Company");
                getCompany();
                break;
            default:
                break;
        }
        openPopup();
    }

    async function getCompany() {
        //console.log(`getting company...`);

        const response = await fetch(API_URL + "api/Registration/GetCompany?COMPANYKEY=c01", {
            method: "GET",
        })

        // data = {COMPANYKEY: "", COMPANYNAME: ""}...
        const data = await response.json();

        if (data.success) {
            //console.log("new company: ", data["COMPANYNAME"]);
            setCompany(data["COMPANYNAME"]);
        }
        else {
            //console.log(data);
            setCompany("{Your Company Here}");
        }
    }

    async function updateCompany() {
        if (document.getElementById("company").value === "") {
            document.getElementById("company").classList.add("invalid_input");
            setTimeout(() => {
                alert("Company Name is Required!");
            },200)
            return;
        }

        //console.log(`setting company to ${company}`);

        let formData = new FormData();
        formData.append("COMPANYNAME", company);

        const response = await fetch(API_URL + "api/Registration/SetCompany", {
            body: formData,
            method: "PUT",
        })

        const data = await response.json();
        //console.log("data: ",data);

        if (!data.success) {
            console.trace("company name value mismatch");
            setPopup("Fail");

            setTimeout(() => {
                setPopup("Change Company");
            },2000)
        }
        else {
            // set active, company is updated dynamically...
            setActiveCompany(company);
            setPopup("Company Success");
            
            setTimeout(() => {
                closePopup();
            },1000)
        }
    }

    // eslint-disable-next-line no-unused-vars
    async function dumpUsers() {
        const response = await fetch(API_URL + "api/Registration/GetAllDrivers", {
            method: "GET",
        })

        const data = await response.json();
        console.log("data: ",data);

        if (!data.success) {
            console.trace("company name value mismatch");
            setTimeout(() => {
                setPopup("Change Company");
            },2000)
        }
        else {
            setTimeout(() => {
                closePopup();
            },1000)
        }
    }

    const onPress_functions = {
        "addDriver": addDriver,
        "pullDriver": pullDriver,
        "updateDriver": updateDriver,
        "removeDriver": removeDriver,
        "cancelDriver": cancelDriver,
        "updateCompany": updateCompany
    };

    //
    // render template...
    return(
        <div id="webpage">
            <Header
                company={activeCompany}
                title="Admin Portal"
                alt="What would you like to do?"
                status="admin"
                currUser="admin"
                MFSTDATE={null} 
                POWERUNIT={null}
                STOP = {null}
                PRONUMBER = {null}
                MFSTKEY = {null}
                toggle={header}
                onClick={collapseHeader}
            />
            <div id="admin_div">
                <button type="button" onClick={pressButton}>Add New User</button>
                <button type="button" onClick={pressButton}>Change/Remove User</button>
                <button type="button" onClick={pressButton}>Edit Company Name</button>
            </div>
            <div id="popupAddWindow" className="overlay">
                <div className="popupLogin">
                    <div id="popupAddExit" className="content">
                        <h1 id="close_add" className="popupLoginWindow" onClick={closePopup}>&times;</h1>
                    </div>
                    <Popup 
                        message={popup}
                        date={null}
                        powerunit={null}
                        closePopup={closePopup}
                        handleDeliveryChange={null}
                        handleUpdate={handleUpdate}
                        pressButton={pressButton}
                        credentials={renderCredentials}
                        company={company}
                        onPressFunc={onPress_functions}
                    />
                </div>
            </div>
            {/*<button onClick={dumpUsers}>dump users</button>*/}
            <Footer id="footer"/>
        </div>
    )
};

export default AdminPortal;