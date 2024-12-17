//////////////////////////////////////////////////////////////////////////////////////
/* 
DriverPortal() - Delivery Manifest Dynamic Table Generation

DriverPortal serves a credentialed user a set of dynamically generated interactive 
tables; one each for "undelivered" and "delivered" deliveries. In short, the functions
that follow gather a collection of deliveries and parses pertinent identification
information and renders them.

The data is presented in a standard HTTP JSON response format and is formatted into
HTML table elements. User click behavior targets individual rows, parses that
deliveries unique identifier (pronumber) and navigates to that deliveries individual
record for editing.

Conditional formatting ensures that users on any device is presented enough information
to filter deliveries, while maintaining visibility/usability. 

//////////////////////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
DriverPortal() {
    initialize location + navigation
    initialize driverCredentials state using location data
    initialize updateData object using location data
    initialize blank undelivered and delivered state data
    set loading to true : *** determine if this can be handled using try / conditional rendering ***

    useEffect() {
        catch indirect visits to current page, redirect to login
        setDriverCredentials to the latest "POWERUNIT" update
        fetch delivery manifest associated with powerunit/date pair provided
        set loading to false : *** determine if this is actually protecting render status ***
    },[]) <-- triggers once on initial render only...

    initialize header toggle to "open" - default for login screen

    [void] : collapseHeader(event) {
        if (e.target.id === "collapseToggle" or "toggle_dots"):
            open/close header - do opposite of current "header" state
    }

    set HTTP headers

    [void] : getDeliveries(powerunit,mfstdate) {
        initialize delivered and undelivered responses to null
        try:
            fetch all DELIVERED deliveries associated with powerunit/date pair
            fetch all UNDELIVERED deliveries associated with powerunit/date pair
        catch:
            log errors to console : *** is this the best way to handle failed fetch? maybe add more handling in request logic ***
        
        parse delivery JSON responses
        store deliveries in respective states
        setLoading(false)
    }

    [void] : handleClick(event) {
        gather delivered status of click target
        isolate the table row contents of click target
        parse the contents for the unique delivery pronumber

        if clicked table is "undelivered":
            loop undelivered deliveries until pronumber is found
            once found:
                package snapshot of deliveryData and navigate to specific delivery form
        else:
            perform same loop above            
    } : *** should this be wrapped in try/catch and or conditional rendering protections? ***

    [void] : renderDeliveries(status) {
        if loading in process:
            render loading message
        else:
            determine status of delivery and direct to corresponding rendering path
            if no more deliveries:
                render empty table row w/ prompt
            else:
                map deliveries into HTML table rows and return
    }

    if loading:
        render loading message : *** try to see if this has been phased out with try/catch? ***

    return render template
}

*/////////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { API_URL, 
    getToken, 
    refreshToken, 
    isTokenExpiring, 
    isTokenValid,
    isCompanyValid,
    getCompany_DB, 
    logout } from '../Scripts/helperFunctions';

/*
// DriverPortal pulls matching deliveries and renders them as an interactive table...
// Function pulls username, powerunit and manifest date data from location state...
*/
const DriverPortal = () => {
    // Site state & location processing functions... 
    const location = useLocation();
    const navigate = useNavigate();

    // set credentials and query delivery information once on page load...
    useEffect(() => {
        const company = isCompanyValid();
        if (!company) {
            renderCompany();
        } else {
            setCompany(company);
        }

        const token = getToken();
        if(!isTokenValid(token)){
            logout();
            navigate('/');
            return;
        }

        if(!location.state){
            navigate('/');
            return;
        }

        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData["POWERUNIT"]
        });

        getDeliveries(updateData["POWERUNIT"],updateData["MFSTDATE"]);
        setLoading(false);
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    // state 'driverCredentials' to be passed to next page...
    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: location.state ? location.state.driver["USERNAME"] : null,
        POWERUNIT: location.state ? location.state.driver["POWERUNIT"] : null,
    });

    // set current username for rendering...
    const currUser = driverCredentials.USERNAME;

    // const 'updateData' to be passed to next page...
    const updateData = {
        MFSTDATE: location.state ? location.state.delivery["MFSTDATE"] : null,
        POWERUNIT: location.state ? location.state.delivery["POWERUNIT"] : null,
    };

    // set delivery json data for table rendering...
    const [undelivered, setUndelivered] = useState([]);
    const [delivered, setDelivered] = useState([]);

    // loading states for processing lag times...
    const [loading, setLoading] = useState(true); 

    const [header,setHeader] = useState(location.state ? location.state.header : "open");

    const collapseHeader = (e) => {
        //console.log(e.target.id);
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            if (header === "open") {
                setHeader("close");
                //e.target.id = "openToggle";
            } else {
                setHeader("open");
                //e.target.id = "collapseToggle";
            }
        }
    }
    
    /*
    // API Calls and Functionality ...
    */
    
    /* 
    *-----------------------------------------------------------------------------------*
    // query all deliveries matching the provided powerunit and date...
    *-----------------------------------------------------------------------------------*
    *
    * 
    * 
    *-----------------------------------------------------------------------------------*
    */

    async function getDeliveries(powerunit,mfstdate){
        let token = getToken();

        if (!token) {
            console.error("Invalid authorization token");
            throw new Error("Authorization failed. Please log in.");
        }
        
        if (isTokenExpiring(token)) {
            console.log("Token expiring soon. Refreshing...");
            const tokens = await refreshToken(driverCredentials.USERNAME);
            token = tokens.access;
        }

        let responseD = null;
        let responseU = null;

        try {
            // execute queries separate for ease of isolating...
            responseD = await fetch(API_URL + "api/DriverChecklist/GetDelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    "Authorization": `Bearer ${token}`
                },
            });
            responseU = await fetch(API_URL + "api/DriverChecklist/GetUndelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    "Authorization": `Bearer ${token}`
                },
            });

            // pull json formatting to allow setting to state...
            const deliveredData = await responseD.json();
            const undeliveredData = await responseU.json();

            // set states and trigger loading complete...
            setDelivered(deliveredData.table);
            setUndelivered(undeliveredData.table);        
            
            //setLoading(false);

        } catch (error) {
            console.log(error);
            navigate('/');
        }
    }

  
    /* 
    *-----------------------------------------------------------------------------------*
    // handleClick to identify row clicked and proceed to edit corresponding delivery...
    *-----------------------------------------------------------------------------------*
    *
    * handles the click event, parsing the table and row before scraping the pronumber
    * from the row's content string. Iterates the deliveries for the corresponding 
    * delivery and navigates to that delivery's update form, carrying with it the
    * packaged delivery/driver information in state...
    * 
    *-----------------------------------------------------------------------------------*
    */

    const handleClick = (event) => {
        const parentClass = event.target.parentNode.className;
        const string = event.target.parentNode.innerText;
        const proNum = string.match(/[\t]([A-Za-z0-9]{8})/)[1];

        var i = 0;
        if (parentClass.includes("undelivered")){
            while (i < undelivered.length) {
                if (undelivered[i]["PRONUMBER"] === proNum) {
                    const deliveryData = {
                        delivery: undelivered[i],
                        driver: driverCredentials,
                        header: header,
                        company: company,
                        valid: true
                    };
                    navigate(`delivery/${undelivered[i].PRONUMBER}`, {state: deliveryData})
                    break
                }
                i = i + 1;
            }
        }
        else{
            while (i < delivered.length) {
                if (delivered[i]["PRONUMBER"] === proNum) {
                    const deliveryData = {
                        delivery: delivered[i],
                        driver: driverCredentials,
                        header: header,
                        company: company,
                        valid: true
                    };
                    navigate(`delivery/${delivered[i].PRONUMBER}`, {state: deliveryData})
                    break
                }
                i = i + 1;
            }
        }
    }

    const [company, setCompany] = useState(location.state ? location.state.company : "");
    async function renderCompany() {
        const company = getCompany_DB();
        if(company) {
            setCompany(company);
        } else {
            setCompany("{Your Company Here}");
        }
    }
    
    /* 
    *-----------------------------------------------------------------------------------*
    // helper to generate dynamic HTML table for returned deliveries...
    *-----------------------------------------------------------------------------------*
    *
    * iteratively renders the delivery tables returned via API to HTML 
    * format. parses the delivery data separating each delivery and 
    * rendering only the important information. conditionally render
    * more/less data columns depending on the size of the display...
    * 
    *-----------------------------------------------------------------------------------*
    */
    const renderDeliveries = (status) => {        
        if(loading) {
            return (<tr><td align="center" colSpan="7">Loading Deliveries...</td></tr>)
        }
        else {
            if(status === "delivered"){
                try {
                    if(delivered.length === 0){
                        return(<tr><td align="center" colSpan="7">NO DELIVERIES COMPLETED</td></tr>);
                    }
                    return (
                        delivered.map((delivery,i) => (
                            <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body delivered" id={delivery["MFSTKEY"]}>
                                <td className="col1">{delivery["STOP"]}</td>
                                <td className="col2">{delivery["PRONUMBER"]}</td>
                                <td className="col3">{delivery["CONSNAME"]}</td>
                                <td className="col4">{delivery["CONSADD1"]}</td>
                                <td className="col5 desktop_table">{delivery["CONSADD2"]}</td>
                                <td className="col6 desktop_table">{delivery["CONSCITY"]}</td>
                                <td className="col7 desktop_table">{delivery["SHIPNAME"]}</td>
                            </tr>
                        ))
                    )
                } catch {
                    console.error("Warning: delivered table rendering error");
                }
                
            }
            else if(status === "undelivered"){
                try {
                    if(undelivered.length === 0){
                        return(<tr><td align="center" colSpan="7">NO DELIVERIES COMPLETED</td></tr>);
                    }
                    return (
                        undelivered.map((delivery,i) => (
                            <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body undelivered" id={delivery["MFSTKEY"]}>
                                <td className="col1">{delivery["STOP"]}</td>
                                <td className="col2">{delivery["PRONUMBER"]}</td>
                                <td className="col3">{delivery["CONSNAME"]}</td>
                                <td className="col4">{delivery["CONSADD1"]}</td>
                                <td className="col5 desktop_table">{delivery["CONSADD2"]}</td>
                                <td className="col6 desktop_table">{delivery["CONSCITY"]}</td>
                                <td className="col7 desktop_table">{delivery["SHIPNAME"]}</td>
                            </tr>
                        ))
                    )
                } catch {
                    console.error("Warning: undelivered table rendering error");
                }
            }
        }
    }

    if(loading) {
        return(<h3>Loading Driver Manifest...</h3>)
    }

    return(
        <div id="webpage">
            <Header 
                company={company}
                title="Delivery Manifest"
                header="Manifest"
                alt="Select Delivery to Update"
                currUser={currUser}
                MFSTDATE={updateData.MFSTDATE} 
                POWERUNIT={driverCredentials.POWERUNIT}
                toggle={header}
                onClick={collapseHeader}
            />
            <div className="table_div">
                {/*<h3 className="separator_top">Undelivered</h3>
                <table className="Delivery_Table" onClick={event => handleClick_Undelivered(event)}>*/}
                <table className="Delivery_Table" onClick={handleClick}>
                    <thead>
                        <tr className="title_row">
                            <th className="title" colSpan="7">Undelivered</th>
                        </tr>
                        <tr>
                            <th className="col1">Stop</th>
                            <th className="col2">Pro No</th>
                            <th className="col3">Consignee</th>
                            <th className="col4">Address<span className="desktop_table"> 1</span></th>
                            <th className="col5 desktop_table">Address 2</th>
                            <th className="col6 desktop_table">City</th>
                            <th className="col7 desktop_table">Shipper</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/*renderUndelivered()*/}
                        { renderDeliveries("undelivered") }
                    </tbody>
                </table>
            </div>
            <div className="table_div">
                {/*<h3 className="separator_bottom"><span>Delivered</span></h3>
                <table className="Delivery_Table" onClick={event => handleClick_Delivered(event)}>*/}
                <table className="Delivery_Table caboose" onClick={handleClick}>
                    <thead>
                        <tr className="title_row">
                            <th className="title" colSpan="7">Delivered</th>
                        </tr>
                        <tr className="delivered_items">
                            <th className="col1">Stop</th>
                            <th className="col2">Pro No</th>
                            <th className="col3">Consignee</th>
                            <th className="col4">Address<span className="desktop_table"> 1</span></th>
                            <th className="col5 desktop_table">Address 2</th>
                            <th className="col6 desktop_table">City</th>
                            <th className="col7 desktop_table">Shipper</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/*renderDelivered()*/}
                        { renderDeliveries("delivered") }
                    </tbody>
                </table>
            </div>
            <Footer id="scroll_footer" />
        </div>
    );
}

export default DriverPortal;