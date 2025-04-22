/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/8/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { API_URL, 
    getToken, 
    requestAccess, 
    isTokenValid,
    isCompanyValid,
    getCompany_DB, 
    logout,
    translateDate,
    clearMemory,
    COMPANIES } from '../Scripts/helperFunctions';
import Logout from '../Scripts/Logout.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

/*/////////////////////////////////////////////////////////////////////

DriverPortal() - Delivery Manifest Dynamic Table Generation

DriverPortal serves a credentialed user a set of dynamically generated 
interactive tables; one each for "undelivered" and "delivered" 
deliveries. In short, the functions that follow gather a collection of 
deliveries and parses pertinent identification information and renders 
them.

The data is presented in a standard HTTP JSON response format and is 
formatted into HTML table elements. User click behavior targets 
individual rows, parses that deliveries unique identifier (pronumber) 
and navigates to that deliveries individual record for editing.

Conditional formatting ensures that users on any device is presented 
enough information to filter deliveries, while maintaining 
visibility/usability. 

///////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
// initialize rendered page...
    initialize navigation and location state data
    ensure page was reached using standard protocol
    initialize user and delivery states

    useEffect() =>
        ensure latest company on file is rendered
        validate tokens
        prevent invalid navigation to page

// page rendering helper functions...
    renderCompany() => 
        retrieve company name from database when not in memory
    collapseHeader() => 
        open/close collapsible header

// API request + functions...
    query all deliveries matching the provided powerunit and date
    target row clicked and navigate to respective delivery form
    generate dynamic HTML table for returned deliveries

*//////////////////////////////////////////////////////////////////////

const DriverPortal = () => {
    /* Page rendering, navigation and state initialization... */
    const [loading, setLoading] = useState(true);

    // location state and navigation calls...
    const location = useLocation();
    const navigate = useNavigate();

    // state 'driverCredentials' to be passed to next page...
    /*const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: location.state ? location.state.driver["USERNAME"] : null,
        POWERUNIT: location.state ? location.state.driver["POWERUNIT"] : null,
    });*/

    

    // set delivery json data for table rendering...
    const [undelivered, setUndelivered] = useState([]);
    const [delivered, setDelivered] = useState([]);

    // loading states for processing lag times...
    //const [loading, setLoading] = useState(true); 

    // header toggle state...
    const [header,setHeader] = useState(location.state ? location.state.header : "open");

    // rendered company state...
    //const [company, setCompany] = useState(location.state ? location.state.company : "");
    const [company, setCompany] = useState();
    const [updateData, setUpdateData] = useState();
    const [driverCredentials, setDriverCredentials] = useState();

    // set credentials and query delivery information once on page load...
    useEffect(() => {
        let username = sessionStorage.getItem("username");
        let powerunit = sessionStorage.getItem("powerunit");
        let delivery_date = sessionStorage.getItem("delivery-date");
        let activeCompany = sessionStorage.getItem("company");
        if (!username || !delivery_date || !powerunit || !activeCompany) {
            Logout();
        }

        console.log(activeCompany);
        setCompany(activeCompany);

        setDriverCredentials({
            USERNAME: username,
            POWERUNIT: powerunit
        });

        // const 'updateData' to be passed to next page...
        setUpdateData({
            MFSTDATE: delivery_date,
            POWERUNIT: powerunit,
        });

        //getDeliveries(updateData["POWERUNIT"],updateData["MFSTDATE"]);
        getDeliveries(powerunit, delivery_date);
        //setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    /* Page rendering helper functions... */

    /*/////////////////////////////////////////////////////////////////
    // initialize and manage collapsible header behavior...
    [void] : collapseHeader(event) {
        if (e.target.id === "collapseToggle" or "toggle_dots"):
            open/close header - do opposite of current "header" state
    }
    *//////////////////////////////////////////////////////////////////

    const collapseHeader = (e) => {
        if (e.target.id === "collapseToggle" || e.target.id === "toggle_dots") {
            /*if (header === "open") {
                setHeader("close");
            } else {
                setHeader("open");
            }*/
            setHeader(prev => (prev === "open" ? "close" : "open"));
        }
    }
    
    /* API requests + functions... */

    /*/////////////////////////////////////////////////////////////////
    // query all deliveries matching the provided powerunit and date...
    [void] : getDeliveries(powerunit,mfstdate) {
        initialize delivered and undelivered responses to null
        try:
            fetch all DELIVERED deliveries for powerunit/date pair
            fetch all UNDELIVERED deliveries for powerunit/date pair
            parse delivery JSON responses
            store deliveries in respective states
        catch:
            log errors to console + redirect to login page
    }
    *//////////////////////////////////////////////////////////////////
    
    /* REDO THIS FUNCTION, IT SEEMS VERY INEFFICIENT */
    async function getDeliveries(powerunit,mfstdate){
        // initialize delivered + undelivered responses...
        //let responseD = null;
        //let responseU = null;

        // attempt to gather delivered + undelivered deliveries...
        try {
            /*responseD = await fetch(API_URL + "api/DriverChecklist/GetDelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    //"Authorization": `Bearer ${token}`
                },
                credentials: 'include'
            });
            responseU = await fetch(API_URL + "api/DriverChecklist/GetUndelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    //"Authorization": `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (responseD.status === 401 || responseD.status === 403 || responseU.status === 401 || responseU.status === 403) {
                Logout();
            }

            // parse delivery lists into JSON...
            const deliveredData = await responseD.json();
            const undeliveredData = await responseU.json();

            if (!deliveredData.success || !undeliveredData.success) {
                console.error("Delivery data access failed, ensure valid auth token.");
                Logout();
            }*/

            const response = await fetch(API_URL + "api/Delivery/GetDeliveries?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                credentials: 'include'
            });

            if (!response.ok || response.status === 401 || response.status === 403) {
                console.error("Unauthorized access credentials, logging out.");
                Logout();
            }

            const data = await response.json();
            if (!data.success) {
                console.error("Delivery data access failed, ensure valid auth token.");
                Logout();
            }
            const deliveredData = data.delivered;
            const undeliveredData = data.undelivered;

            // set delivered + undelivered states...
            setDelivered(deliveredData);
            setUndelivered(undeliveredData);
            setLoading(false);

        // divert all errors to login page...
        } catch (error) {
            console.error(error);
            //Logout();
            // set delay before logging out...
            setTimeout(() => {
                Logout();
                return;
            }, 10000);
        }
    }

    /*/////////////////////////////////////////////////////////////////
    // target row clicked and navigate to respective delivery form...
    [void] : handleClick(event) {
        gather delivered status of click target
        isolate the table row contents of click target
        parse the contents for the unique delivery pronumber

        if clicked table is "undelivered":
            loop undelivered deliveries until pronumber is found
            once found:
                package deliveryData and navigate to respective form
        else:
            perform same logic for delivered      
    }
    *//////////////////////////////////////////////////////////////////

    const handleClick = (event) => {
        console.log(`event.target: ${event.target}`);
        // cache row class name, row text + parse out the pronumber...
        const parentClass = event.target.parentNode.className;

        const row = event.target.parentNode;
        const proNum = row.querySelector('.col2').textContent;
        //console.log(`proNumber: ${proNum}`);
        
        const address1 = row.querySelector('.col4').textContent;
        const address2 = row.querySelector('.col5').textContent;
        //console.log(`address: ${[address1,address2]}`);

        var i = 0;
        if (parentClass.includes("undelivered")){
            // iterate all undelivered deliveries...
            while (i < undelivered.length) {
                // clicked delivery found, nav to delivery page...
                if (undelivered[i]["PRONUMBER"] === proNum) {
                    console.log("delivery found!");
                    const deliveryData = {
                        delivery: undelivered[i],
                        driver: driverCredentials,
                        header: header,
                        company: company,
                        valid: true
                    };
                    console.log(`/deliveries/${undelivered[i].PRONUMBER}`);
                    navigate(`/deliveries/${undelivered[i].PRONUMBER}`, {state: deliveryData});
                    break;
                }
                i = i + 1;
            }
        } else{
            // iterate all delivered deliveries...
            while (i < delivered.length) {
                // clicked delivery found, nav to delivery page...
                if (delivered[i]["PRONUMBER"] === proNum) {
                    const deliveryData = {
                        delivery: delivered[i],
                        driver: driverCredentials,
                        header: header,
                        company: company,
                        valid: true
                    };
                    navigate(`/deliveries/${delivered[i].PRONUMBER}`, {state: deliveryData});
                    break;
                }
                i = i + 1;
            }
        }
    }

    /*/////////////////////////////////////////////////////////////////
    // generates dynamic HTML table for returned deliveries...
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
    *//////////////////////////////////////////////////////////////////

    const renderDeliveries = (status) => {        
        if(status === "delivered"){
            try {
                if(delivered.length === 0){
                    return(<tr><td align="center" colSpan="7">No deliveries completed...</td></tr>);
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
                    return(<tr><td align="center" colSpan="7">No remaining deliveries...</td></tr>);
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

    return(
        <div id="webpage">
            {loading ? (
                <LoadingSpinner />
                ) : (
                    <>
                    <Header 
                        company={company}
                        title="Delivery Manifest"
                        header="Manifest"
                        alt="Select Delivery to Update"
                        status=""
                        currUser={driverCredentials.USERNAME}
                        MFSTDATE={updateData.MFSTDATE} 
                        POWERUNIT={driverCredentials.POWERUNIT}
                        toggle={header}
                        onClick={collapseHeader}
                    />
                    <div id="mdpu-subheader">
                        <div className="mdpu-subheader-div">
                            <h4>Manifest Date:</h4>
                            <h4 className="weak">{translateDate(updateData.MFSTDATE)}</h4>
                        </div>
                        <div className="mdpu-subheader-div">
                            <h4>Power Unit:</h4>
                            <h4 className="weak">{driverCredentials.POWERUNIT}</h4>
                        </div>
                    </div>
                    <div className="table_div">
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
                                { renderDeliveries("undelivered") }
                            </tbody>
                        </table>
                    </div>
                    <div className="table_div">
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
                                { renderDeliveries("delivered") }
                            </tbody>
                        </table>
                    </div>
                    <Footer id="scroll_footer" />
                    </>
                )
            }
        </div>
    );
}

export default DriverPortal;