import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { API_URL } from '../Scripts/helperFunctions';

/*
// DriverPortal pulls matching deliveries and renders them as an interactive table...
// Function pulls username, powerunit and manifest date data from location state...
*/
const DriverPortal = () => {
    /*
    // Header information for API call reference...
    */
    //const API_URL = "http://localhost:5113/";
    //const API_URL = "http://www.tcsservices.com:40730/"
    //const API_URL = "http://www.deliverymanager.tcsservices.com:40730/"

    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
    };

    /*
    // Site state & location processing functions... 
    */
    const location = useLocation();
    const navigate = useNavigate();

    // state 'driverCredentials' to be passed to next page...
    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: location.state ? location.state.driver["USERNAME"] : null,
        POWERUNIT: location.state ? location.state.driver["POWERUNIT"] : null,
    });

    // const 'updateData' to be passed to next page...
    const updateData = {
        MFSTDATE: location.state ? location.state.delivery["MFSTDATE"]: null,
        POWERUNIT: location.state ? location.state.delivery["POWERUNIT"] : null,
    };

    // set current username for rendering...
    const currUser = driverCredentials.USERNAME;

    // set delivery json data for table rendering...
    const [undelivered, setUndelivered] = useState([]);
    const [delivered, setDelivered] = useState([]);

    // loading states for processing lag times...
    const [loading, setLoading] = useState(true); 

    // set credentials and query delivery information once on page load...
    useEffect(() => {
        if(!location.state){
            navigate('/')
        }
        setDriverCredentials({
            ...driverCredentials,
            POWERUNIT: updateData["POWERUNIT"]
        });

        getDeliveries(updateData["POWERUNIT"],updateData["MFSTDATE"]);
        setLoading(false);
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    /*
    // API Calls and Functionality ...
    */
    
    
    // query all deliveries matching the provided powerunit and date...
    async function getDeliveries(powerunit,mfstdate){
        // execute queries separate for ease of isolating...
        const responseD = await fetch(API_URL + "api/DriverChecklist/GetDelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        });
        const responseU = await fetch(API_URL + "api/DriverChecklist/GetUndelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
            method: 'GET',
            headers,
        });

        // pull json formatting to allow setting to state...
        const deliveredData = await responseD.json();
        const undeliveredData = await responseU.json();

        // set states and trigger loading complete...
        setDelivered(deliveredData);
        setUndelivered(undeliveredData);
        setLoading(false);
        return;
        
    }

    // handleClick to identify row clicked and proceed to edit corresponding delivery...
    const handleClick = (event) => {
        const string = event.target.parentNode.innerText;
        const eventID = event.target.parentNode.id;
        const proNum = string.match(/[\t]([0-9]{8})/)[1];

        var i = 0;
        if (eventID === "delivered"){
            while (i < delivered.length) {
                if (delivered[i]["PRONUMBER"] === proNum) {
                    const deliveryData = {
                        delivery: delivered[i],
                        driver: driverCredentials
                    };
                    navigate(`delivery/${delivered[i].PRONUMBER}`, {state: deliveryData})
                    break
                }
                i = i + 1;
            }
        }
        else{
            while (i < undelivered.length) {
                if (undelivered[i]["PRONUMBER"] === proNum) {
                    const deliveryData = {
                        delivery: undelivered[i],
                        driver: driverCredentials
                    };
                    navigate(`delivery/${undelivered[i].PRONUMBER}`, {state: deliveryData})
                    break
                }
                else {
                    i = i + 1;
                }
            }
        }
    }
    
    // helper to generate dynamic HTML table for returned deliveries, handles lag and empty results...
    const renderDeliveries = (status) => {        
        if(loading) {
            return (<tr><td align="center" colSpan="7">Loading Deliveries...</td></tr>)
        }
        else if(status.length === 0) {
            return (<tr><td align="center" colSpan="7">No Completed Deliveries...</td></tr>)
        }
        else {
            if(status === "delivered"){
                return (
                    delivered.map((delivery,i) => (
                        <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body" id="delivered">
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
            }
            else if(status === "undelivered"){
                return (
                    undelivered.map((delivery,i) => (
                        <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body" id="undelivered">
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
            }
        }
    }

    if(loading) {
        return(<h3>Loading Driver Manifest...</h3>)
    }

    return(
        <div id="webpage">
            <Header 
                title="Delivery Manifest"
                header="Manifest"
                alt="Select Delivery to Update"
                currUser={currUser}
                MFSTDATE={updateData.MFSTDATE} 
                POWERUNIT={driverCredentials.POWERUNIT}
            />
            <h3 className="Table_Separator">Undelivered</h3>
            {/*<table className="Delivery_Table" onClick={event => handleClick_Undelivered(event)}>*/}
            <table className="Delivery_Table" onClick={handleClick}>
                <thead>
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
                    {renderDeliveries("undelivered")}
                </tbody>
            </table>
            <h3 className="Table_Separator"><span>Delivered</span></h3>
            {/*<table className="Delivery_Table" onClick={event => handleClick_Delivered(event)}>*/}
            <table className="Delivery_Table" onClick={handleClick}>
                <thead>
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
                    {renderDeliveries("delivered")}
                </tbody>
            </table>
        </div>
    );
}

export default DriverPortal;