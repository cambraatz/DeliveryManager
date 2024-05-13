import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import UserWidget from './UserWidget';
import { scrapeDate, renderDate } from '../Scripts/helperFunctions';
import Header from './Header';

//import DriverList from './DriverList';
//import DriverPage from './DriverPage';

//import { styled } from '@mui/material/styles';
//import Accordion from '@mui/material/Accordion';
//import AccordionSummary from '@mui/material/AccordionSummary';
//import AccordionDetails from '@mui/material/AccordionDetails';
//import Typography from '@mui/material/Typography';
//import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
//import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
//import Box from '@mui/material/Box';
//import TextField from '@mui/material/TextField';
//import Paper from '@mui/material/Paper';
//import Grid from '@mui/material/Grid';


const term = "Delivery";
//const API_URL = "http://localhost:5269/";
//const API_URL = "http://localhost:5113/";

const API_URL = "http://tcsservices.com:40730/"
const headers = {
    'Content-Type': 'application/json',
};

const DriverPortal = () => {

    const location = useLocation();

    // need to also pass delivery date in as location...
    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: location.state.driver["USERNAME"],
        PASSWORD: location.state.driver["PASSWORD"],
        POWERUNIT: location.state.driver["POWERUNIT"],
    });

    const [updateData, setUpdateData] = useState({
        MFSTDATE: location.state.delivery["MFSTDATE"],
        POWERUNIT: location.state.delivery["POWERUNIT"],
    });

    const currUser = driverCredentials.USERNAME;

    const [driverManifest, setDriverManifest] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingUndelivered, setLoadingUndelivered] = useState(true);
    const [loadingDelivered, setLoadingDelivered] = useState(true);

    const [undelivered, setUndelivered] = useState([]);
    const [delivered, setDelivered] = useState([]);
    const [delivery, setDelivery] = useState();

    const [error, setError] = useState(null);
    
    useEffect(() => {
        setLoading(true);
        setLoadingUndelivered(true)
        setLoadingDelivered(true)

        //gatherDriverLog(driverCredentials["POWERUNIT"]);

        fetchManifest();
        getUndelivered(driverCredentials["POWERUNIT"],updateData["MFSTDATE"]);
        getDelivered(driverCredentials["POWERUNIT"],updateData["MFSTDATE"]);

    }, []);
    
    //
    // take as argument date passed in by location state....
    // location.state.delivery["MFSTDATE"]
    //
    async function fetchManifest(){
        fetch(API_URL + "api/DriverChecklist/GetManifest")
        .then(response => response.json())
        .then(data => {
            setDriverManifest(data)
            setLoading(false)
        })
    }
    
    async function getUndelivered(powerunit,mfstdate){
        const response = await fetch(API_URL + "api/DriverChecklist/GetUndelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
        setUndelivered(data);
        setLoadingUndelivered(false);
        return response;
    }

    async function getDelivered(powerunit,mfstdate){
        const response = await fetch(API_URL + "api/DriverChecklist/GetDelivered?POWERUNIT=" + powerunit + "&MFSTDATE=" + mfstdate, {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
        setDelivered(data);
        setLoadingDelivered(false);
        return response;
    }

    async function getDelivery(mfstkey){
        await fetch(API_URL + "api/DriverChecklist/GetDelivery?MFSTKEY=" + mfstkey)
        .then(response => response.json())
        .then(data => {
            setLoading(true)
            setDelivery(data)
            setLoading(false)
        })
    };

    const translateDate = () => {
        //const rawDate = driverManifest[0]["MFSTDATE"]
        const rawDate = updateData["MFSTDATE"]
        const month = rawDate.slice(0,2)
        const day = rawDate.slice(2,4)
        const year = rawDate.slice(4)
        return month + "/" + day + "/" + year
    }

    const navigate = useNavigate();

    const handleClick_Undelivered = (event) => {
        const string = event.target.parentNode.innerText
        //const stopNum = parseInt(string.match(/^[0-9][0-9]?/));
        const proNum = string.match(/[\t]([0-9]{8})/)[1];

        var i = 0;
        while (i < undelivered.length) {
            if (undelivered[i]["PRONUMBER"] === proNum) {
                const deliveryData = {
                    delivery: undelivered[i],
                    driver: driverCredentials
                };
                //navigate(`delivery/${undelivered[i].PRONUMBER}`, {state: undelivered[i], driverCredentials})
                navigate(`delivery/${undelivered[i].PRONUMBER}`, {state: deliveryData})
                break
            }
            else {
                i = i + 1;
            }
        }

        //alert(delivery.PRONUMBER)

        //getDelivery(stopNum,proNum);
        ///alert(newDelivery["PRONUMBER"]);
        //navigate('/delivery', { state: delivery});
    }

    const handleClick_Delivered = (event) => {
        const string = event.target.parentNode.innerText
        //const stopNum = parseInt(string.match(/^[0-9][0-9]?/));
        const proNum = string.match(/[\t]([0-9]{8})/)[1];

        var i = 0;
        while (i < delivered.length) {
            if (delivered[i]["PRONUMBER"] === proNum) {
                const deliveryData = {
                    delivery: delivered[i],
                    driver: driverCredentials
                };
                //navigate(`delivery/${undelivered[i].PRONUMBER}`, {state: undelivered[i], driverCredentials})
                navigate(`delivery/${delivered[i].PRONUMBER}`, {state: deliveryData})
                break
            }
            else {
                i = i + 1;
            }
        }

        //alert(delivery.PRONUMBER)

        //getDelivery(stopNum,proNum);
        ///alert(newDelivery["PRONUMBER"]);
        //navigate('/delivery', { state: delivery});
    }
    
    const renderUndelivered = () => {
        if(loadingUndelivered) {
            return (<h4>Loading Deliveries...</h4>)
        }
        else {
            return (
                undelivered.map((delivery,i) => (
                    <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body">
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

    const renderDelivered = () => {
        if(loadingDelivered) {
            return (<h4>Loading Deliveries...</h4>)
        }
        else {
            return (
                delivered.map((delivery,i) => (
                    <tr key={i} value={delivery["MFSTKEY"]} className="Table_Body delivered_items">
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
            {/*
            <UserWidget driver={currUser} status="On"/>
            <h2>TCS Driver Manifest Shipment Checkoff</h2>
            <div id="MDPU_Row">
                <h3>Manifest Date: {translateDate()}</h3>
                <h3>Power Unit: {driverCredentials["POWERUNIT"]}</h3>
            </div>
    */}
            <h3 className="Table_Separator">Undelivered</h3>
            <table className="Delivery_Table" onClick={event => handleClick_Undelivered(event)}>
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
                    {renderUndelivered()}
                </tbody>
            </table>
            <h3 className="Table_Separator"><span>Delivered</span></h3>
            <table className="Delivery_Table" onClick={event => handleClick_Delivered(event)}>
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
                    {renderDelivered()}
                </tbody>
            </table>
            {/*
            <h3>Returned Deliveries For {driverCredentials["USERNAME"]}</h3>
                <p>{JSON.stringify(driverManifest)}</p> */}
        </div>
    );
}

export default DriverPortal;