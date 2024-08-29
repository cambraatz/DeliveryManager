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
        /*
        const user_data = {
            MFSTDATE: mfstdate,
            POWERUNIT: powerunit,
        }

        let formData = new FormData();
        for (const [key,value] of Object.entries(user_data)){
            formData.append(key,value)
        }

        const responseD = await fetch(API_URL + "api/DriverChecklist/GetDelivered", {
            body: formData,
            method: "GET"
        });

        const responseU = await fetch(API_URL + "api/DriverChecklist/GetUndelivered", {
            body: formData,
            method: "GET"
        });
        */
        let responseD = null;
        let responseU = null;
        try {
            // execute queries separate for ease of isolating...
            responseD = await fetch(API_URL + "api/DriverChecklist/GetDelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
            });
            responseU = await fetch(API_URL + "api/DriverChecklist/GetUndelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
                method: 'GET',
                headers,
            });
        } catch (error) {
            console.log(error)
        }
        
        

        // pull json formatting to allow setting to state...
        const deliveredData = await responseD.json();
        const undeliveredData = await responseU.json();

        // set states and trigger loading complete...
        setDelivered(deliveredData);
        setUndelivered(undeliveredData);
        setLoading(false);
        return;
        
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
        else{
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
        else if(status.length === 0) {
            return (<tr><td align="center" colSpan="7">No Completed Deliveries...</td></tr>)
        }
        else {
            if(status === "delivered"){
                try{
                    return (
                        delivered.map((delivery,i) => (
                            <tr key={i} value={delivery["MFSTKEY"]} id={delivery["MFSTKEY"]} className="Table_Body delivered">
                                <td className="col1">{delivery["STOP"]}</td>
                                <td className="col2">{delivery["PRONUMBER"]}</td>
                                <td className="col3">{delivery["CONSNAME"]}</td>
                                <td className="col4">{delivery["CONSADD1"]}</td>
                                <td className="col5 desktop_table">{delivery["CONSADD2"]}</td>
                                <td className="col6 desktop_table">{delivery["CONSCITY"]}</td>
                                <td className="col7 desktop_table">{delivery["SHIPNAME"]}</td>
                            </tr>
                        ))
                    );
                }catch{
                    return(<tr><td align="center" colSpan="7">NO DELIVERED DELIVERIES FOUND</td></tr>);
                }
                
            }
            else if(status === "undelivered"){
                try{
                    return (
                            undelivered.map((delivery,i) => (
                                <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body undelivered" id="undelivered">
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
                }catch{
                    return(<tr><td align="center" colSpan="7">NO UNDELIVERED DELIVERIES FOUND</td></tr>);
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
                title="Delivery Manifest"
                header="Manifest"
                alt="Select Delivery to Update"
                currUser={currUser}
                MFSTDATE={updateData.MFSTDATE} 
                POWERUNIT={driverCredentials.POWERUNIT}
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
                        {renderDeliveries("undelivered")}
                    </tbody>
                </table>
            </div>
            <div className="table_div">
                {/*<h3 className="separator_bottom"><span>Delivered</span></h3>
                <table className="Delivery_Table" onClick={event => handleClick_Delivered(event)}>*/}
                <table className="Delivery_Table" onClick={handleClick}>
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
                        {renderDeliveries("delivered")}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DriverPortal;