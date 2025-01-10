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
    logout } from '../Scripts/helperFunctions';

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

    // location state and navigation calls...
    const location = useLocation();
    const navigate = useNavigate();

    // flag invalid navigation with null location.state...
    const VALID = location.state ? location.state.valid : false;

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
    //const [loading, setLoading] = useState(true); 

    // header toggle state...
    const [header,setHeader] = useState(location.state ? location.state.header : "open");

    // rendered company state...
    const [company, setCompany] = useState(location.state ? location.state.company : "");

    // set credentials and query delivery information once on page load...
    useEffect(() => {
        // fetch company name...
        //const company = isCompanyValid();
        setCompany(isCompanyValid());
        if (!company) {
            renderCompany();
        } else {
            setCompany(company);
        }
        // validate token...
        const token = getToken();
        if(!isTokenValid(token)){
            logout();
            navigate('/');
            return;
        }
        // validate proper navigation...
        if(!VALID) {
            logout();
            navigate('/');
            return;
        }

        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData["POWERUNIT"]
        });

        getDeliveries(updateData["POWERUNIT"],updateData["MFSTDATE"]);
        //setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

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
    *//////////////////////////////////////////////////////////////////

    async function renderCompany() {
        const company = getCompany_DB();
        if(company) {
            setCompany(company);
        } else {
            setCompany("{Your Company Here}");
        }
    }

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
    
    async function getDeliveries(powerunit,mfstdate){
        // request token from memory, refresh as needed...
        const token = await requestAccess(driverCredentials.USERNAME);
        
        // handle invalid token on login...
        if (!token) {
            navigate('/');
            return;
        }

        // initialize delivered + undelivered responses...
        let responseD = null;
        let responseU = null;

        // attempt to gather delivered + undelivered deliveries...
        try {
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

            // parse delivery lists into JSON...
            const deliveredData = await responseD.json();
            const undeliveredData = await responseU.json();

            // set delivered + undelivered states...
            setDelivered(deliveredData.table);
            setUndelivered(undeliveredData.table);  

        // divert all errors to login page...
        } catch (error) {
            console.log(error);
            navigate('/');
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
        // cache row class name, row text + parse out the pronumber...
        const parentClass = event.target.parentNode.className;
        const string = event.target.parentNode.innerText;
        const proNum = string.match(/[\t]([A-Za-z0-9]{8})/)[1];

        var i = 0;
        if (parentClass.includes("undelivered")){
            // iterate all undelivered deliveries...
            while (i < undelivered.length) {
                // clicked delivery found, nav to delivery page...
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
                    navigate(`delivery/${delivered[i].PRONUMBER}`, {state: deliveryData})
                    break
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
        /*if(loading) {
            return (<tr><td align="center" colSpan="7">Loading Deliveries...</td></tr>)
        }*/
        if (!undelivered.length && !delivered.length) {
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
                        return(<tr><td align="center" colSpan="7">NO DELIVERIES REMAINING</td></tr>);
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

    /*if(loading) {
        return(<h3>Loading Driver Manifest...</h3>)
    }*/

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
        </div>
    );
}

export default DriverPortal;