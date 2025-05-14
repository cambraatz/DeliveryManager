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
import DL_Popup from './DL_Popup.jsx';

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

            //console.log(deliveredData);
            //console.log(undeliveredData);

            // set delivered + undelivered states...
            setDelivered( packageDeliveries(deliveredData) ); // package delivered if allowing batch update/deletes...
            setUndelivered( packageDeliveries(undeliveredData) );
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

    const packageDeliveries = (deliveries) => {
        const sharedAddress = (a,b) => {
            if (a.CONSADD1 === b.CONSADD1 && a.CONSADD2 === b.CONSADD2) {
                return true;
            }
            return false;
        };
    
        let i = 0;
        let currStop = null;
        let packagedDeliveries = {};
    
        while (i < deliveries.length) {
            // if address matches previous stop and has yet to be delivered...
            if (currStop && sharedAddress(deliveries[i],currStop) && deliveries[i].STATUS != "1"){
                console.log(`Duplicate addresses found: ${deliveries[i].CONSADD1}, ${deliveries[i].CONSADD2}`);
                let sharedDeliveries = [currStop];
                while (i < deliveries.length && sharedAddress(deliveries[i],currStop)) {
                    sharedDeliveries.push(deliveries[i]);
                    i += 1
                }
                packagedDeliveries[currStop.STOP] = sharedDeliveries;
            }
            // catch non-matching deliveries and delivered ones...
            else {
                console.log(`New delivery added to dictionary: ${deliveries[i]}`);
                currStop = deliveries[i];
                packagedDeliveries[deliveries[i].STOP] = [ deliveries[i] ];
                i += 1;
            }
        }
    
        return packagedDeliveries;
    };

    const renderDeliveries = (status) => {
        if (status === "delivered" && Object.keys(delivered).length === 0){
            return(<tr><td align="center" colSpan="7">No deliveries completed...</td></tr>);
        }
        if (status === "undelivered" && Object.keys(undelivered).length === 0){
            return(<tr><td align="center" colSpan="7">No remaining deliveries...</td></tr>);
        }

        const deliveries = status === "delivered" ? delivered : undelivered;
        if (!deliveries) console.log("no deliveries found...")
        else console.log("deliveries found...")

        try {
            return Object.entries(deliveries).map(([stopNum,deliveryList]) => {
                if (deliveryList.length > 1) {
                    console.log(`stop: ${stopNum}, delivery(s):`);
                    deliveryList.forEach((delivery) => {
                        console.log(delivery.STOP);
                    });
                } else {
                    console.log(`stop: ${stopNum}, delivery(s): ${deliveryList[0].STOP}`);
                }

                const dl = deliveryList;
                return (
                    <tr key={stopNum} value={dl[0].MFSTKEY} className={`Table_Body ${status}`} id={dl[0].MFSTKEY}>
                        <td className="col1">
                            {dl.length === 1 ? dl[0].STOP : `${dl[0].STOP}-${dl[dl.length - 1].STOP}`}
                        </td>
                        <td className="col2">{dl[0].PRONUMBER}</td>
                        <td className="col3">{dl[0].CONSNAME}</td>
                        <td className="col4">{dl[0].CONSADD1}</td>
                        <td className="col5 desktop_table">{dl[0].CONSADD2 ? dl[0].CONSADD2 : "---"}</td>
                        <td className="col6 desktop_table">{dl[0].CONSCITY}</td>
                        <td className="col7 desktop_table">{dl[0].SHIPNAME}</td>
                    </tr>
                );
            });
        } catch {
            console.error("Warning: delivered table rendering error");
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

    const [deliveryList,setDeliveryList] = useState([]);

    const selectDelivery = (deliveries,proNum) => {
        for (const [stopNum,list] of Object.entries(deliveries)) {
            for (const delivery of list) {
                console.log(`delivery.PRONUMBER: ${delivery.PRONUMBER}`);
                if (delivery.PRONUMBER === proNum) {
                    if (list.length == 1) {
                        const deliveryData = {
                            delivery: delivery,
                            driver: driverCredentials,
                            header: header,
                            company: company,
                            valid: true,
                        };
                        //console.log(`/deliveries/${delivery.PRONUMBER}`);
                        navigate(`/deliveries/${delivery.PRONUMBER}`, {state: deliveryData});
                        return;
                    } else {
                        //sessionStorage.setItem("deliveryList",JSON.stringify(deliveryList));
                        setDeliveryList(list);
                        openPopup();
                        return;
                    }
                }
            }
            console.log(`delivery was not found at stop ${stopNum}...`);
        }
        console.log(`delivery ${proNum} was not found in delivery list...`)
    };

    const handleClick = (event) => {
        console.log(`event.target: ${event.target}`);
        // cache row class name, row text + parse out the pronumber...
        const parentClass = event.target.parentNode.className;

        const row = event.target.parentNode;
        const proNum = row.querySelector('.col2').textContent;
        //console.log(`proNumber: ${proNum}`);
        
        const address1 = row.querySelector('.col4').textContent;
        const address2 = row.querySelector('.col5').textContent;
        console.log(`address: ${[address1,address2]}`);

        const deliveries = parentClass.includes("undelivered") ? undelivered : delivered;
        selectDelivery(deliveries,proNum);
    }

    const handleRowClick = (index,delivery) => {
        console.log("Row index clicked:", index);
        console.log("Full delivery object:", delivery);

        const deliveryData = {
            delivery: delivery,
            driver: driverCredentials,
            header: header,
            company: company,
            valid: true,
        };
        //console.log(`/deliveries/${delivery.PRONUMBER}`);
        navigate(`/deliveries/${delivery.PRONUMBER}`, {state: deliveryData});
        return;
    }

    const handlePopupSubmit = (mfstkeys) => {
        alert("Multi-selection logic is actively being developed!");
        //const deliveries = status === "0" ? undelivered : delivered;
        //const deliveries = deliveryList;
        console.log("deliveryList",deliveryList);

        const keySet = new Set(mfstkeys);
        const activeDeliveries = deliveryList.filter(delivery => keySet.has(delivery.MFSTKEY));
        if (activeDeliveries && activeDeliveries.length > 0) {
            console.log('activeDeliveries',activeDeliveries);
            const deliveryData = {
                delivery: activeDeliveries[0],
                deliveries: activeDeliveries,
                driver: driverCredentials,
                header: header,
                company: company,
                valid: true,
            };
            console.log(`/deliveries/${deliveryData.delivery.PRONUMBER}`);
            console.log(deliveryData);
            navigate(`/deliveries/${deliveryData.delivery.PRONUMBER}`, {state: deliveryData});
        }
        closePopup();
        return;
    };

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
    
        //Logout();
    };

    return(
        <div id="webpage">
            {loading || delivered === null || undelivered === null ? (
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

                    <div id="popupWindow" className="overlay">
                        <DL_Popup deliveries={deliveryList} onClick={handlePopupSubmit} onClose={closePopup} />
                    </div>
                    </>
                )
            }
        </div>
    );
}

export default DriverPortal;