import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
//import TextField from '@mui/material/TextField';
import { useLocation } from 'react-router-dom';
import * as React from 'react';
//import UserWidget from './UserWidget';
import Header from './Header';

const DeliveryForm = () => {
    const term = "Delivery";
    //const API_URL = "http://localhost:5173/";
    //const API_URL = "http://localhost:7200/";
    //const API_URL = "http://localhost:5113/";

    const API_URL = "http://tcsservices.com:40730/"
    const headers = {
        'Content-Type': 'application/json',
    };

    const location = useLocation();

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

    var hours = now.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    }
    var minutes = now.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    const currTime = hours + ":" + minutes;

    const translateDate = (date) => {
        const month = date.slice(0, 2);
        const day = date.slice(2, 4);
        const year = date.slice(4);
        return month + "/" + day + "/" + year;
    };

    const renderDate = (date) => {
        const year = date.slice(0, 4);
        const month = date.slice(5, 7);
        const day = date.slice(8);
        return year + "-" + month + "-" + day;
    };

    const scrapeDate = (date) => {
        const year = date.slice(0, 4);
        const month = date.slice(5, 7);
        const day = date.slice(8);
        return month + day + year;
    };

    const scrapeTime = (time) => {
        const hour = time.slice(0, 2);
        const minute = time.slice(3);
        return hour + minute;
    };

    const scrapeFile = (file) => {
        const relLink = file.slice(12);
        return relLink;
    };

    //const [loading, setLoading] = useState(true);

    /*
    useEffect(() => {
        setLoading(true)
        fetchDriverCredentials(location.state["POWERUNIT"])
    }, []);
    */

    const [driverCredentials, setDriverCredentials] = useState({
        USERNAME: location.state.driver["USERNAME"],
        PASSWORD: location.state.driver["PASSWORD"],
        POWERUNIT: location.state.driver["POWERUNIT"],
    });

    const currUser = driverCredentials.USERNAME;

    let address2 = location.state.delivery["CONSADD2"];
    if (address2 === null){
        address2 = "N/A"
    }

    const [delivery, setDelivery] = useState({
        MFSTKEY: location.state.delivery["MFSTKEY"],
        STATUS: location.state.delivery["STATUS"],
        LASTUPDATE: location.state.delivery["LASTUPDATE"],
        MFSTNUMBER: location.state.delivery["MFSTNUMBER"],
        POWERUNIT: location.state.delivery["POWERUNIT"],
        STOP: location.state.delivery["STOP"],
        MFSTDATE: location.state.delivery["MFSTDATE"],
        PRONUMBER: location.state.delivery["PRONUMBER"],
        PRODATE: location.state.delivery["PRODATE"],
        SHIPNAME: location.state.delivery["SHIPNAME"],
        CONSNAME: location.state.delivery["CONSNAME"],
        CONSADD1: location.state.delivery["CONSADD1"],
        CONSADD2: address2,
        CONSCITY: location.state.delivery["CONSCITY"],
        CONSSTATE: location.state.delivery["CONSSTATE"],
        CONSZIP: location.state.delivery["CONSZIP"],
        TTLPCS: location.state.delivery["TTLPCS"],
        TTLYDS: location.state.delivery["TTLYDS"],
        TTLWGT: location.state.delivery["TTLWGT"],
        DLVDDATE: scrapeDate(currDate),
        DLVDTIME: scrapeTime(currTime),
        DLVDPCS: location.state.delivery["TTLPCS"],
        DLVDSIGN: "",
        DLVDNOTE: "",
        DLVDIMGFILELOCN: "",
        DLVDIMGFILESIGN: ""
    });

    async function fetchDriverCredentials(powerunit) {
        await fetch(API_URL + "api/Registration/GetDriver?POWERUNIT=" + powerunit)
            .then(response => response.json())
            .then(data => {
                alert(data)
                setDriverCredentials(data)
                //setLoading(false)
            })
    }

    const [formData, setFormData] = useState({
        deliveryDate: currDate,
        deliveryTime: currTime,
        deliveredPieces: delivery.TTLPCS,
        deliveredSign: "",
        deliveryNotes: "",
        deliveryImagePath: "/dummyImage.jpg",
        deliverySignaturePath: "/dummySignature.jpg",
    });

    const [updateData, setUpdateData] = useState({
        MFSTDATE: location.state.delivery["MFSTDATE"],
        DLVDDATE: scrapeDate(currDate),
        DLVTIME: scrapeTime(currTime),
        DLVDPCS: "",
        DLVDSIGN: "",
        DLVDNOTE: "",
        DLVDIMGFILELOCN: "",
        DLVDIMGFILESIGN: ""
    });

    let uploadImageStatus = "Upload";
    let uploadSignatureStatus = "Upload";

    const handleChange = (e) => {
        let val = e.target.value;
        switch (e.target.id) {
            case 'dlvdate':
                setFormData({
                    ...formData,
                    deliveryDate: renderDate(val)
                });
                setDelivery({
                    ...delivery,
                    DLVDDATE: scrapeDate(val)
                });
                break;
            case 'dlvtime':
                setFormData({
                    ...formData,
                    deliveryTime: val
                });
                setDelivery({
                    ...delivery,
                    DLVTIME: scrapeTime(val)
                });
                break;
            case 'dlvdpcs':
                setFormData({
                    ...formData,
                    deliveredPieces: val
                });
                setDelivery({
                    ...delivery,
                    DLVDPCS: val
                });
                break;
            case 'dlvdsign':
                setFormData({
                    ...formData,
                    deliveredSign: val
                })
                setDelivery({
                    ...delivery,
                    DLVDSIGN: val
                })
                break;
            case 'dlvdnote':
                setFormData({
                    ...formData,
                    deliveryNotes: val
                });
                setDelivery({
                    ...delivery,
                    DLVDNOTE: val
                });
                break;
            case 'dlvdimage':
                setFormData({
                    ...formData,
                    deliveryImagePath: val
                });
                setDelivery({
                    ...delivery,
                    DLVDIMGFILELOCN: scrapeFile(val)
                });
                uploadImageStatus = "Submitted";
                break;
            case 'dlvdimagefilesign':
                setFormData({
                    ...formData,
                    deliverySignaturePath: val
                });
                setDelivery({
                    ...delivery,
                    DLVDIMGFILESIGN: scrapeFile(val)
                });
                uploadSignatureStatus = "Submitted";
                break;
            default:
                break;
        }
    };

    async function handleDelete(mfstkey) {
        //alert("deleting delivery")
        const response = await fetch(API_URL + "api/DriverChecklist/DeleteManifest?MFSTKEY=" + mfstkey, {
            method: "DELETE",
            headers,
        })
        console.log(response);
        return response;
    }

    async function handleCreate() {
        //alert("creating delivery")
        const deliveryString = '?MFSTKEY=' + delivery.MFSTKEY + '&STATUS=1&LASTUPDATE=' + delivery.LASTUPDATE + '&MFSTNUMBER=' + delivery.MFSTNUMBER + '&POWERUNIT=' + delivery.POWERUNIT + '&STOP=' + delivery.STOP +
            '&MFSTDATE=' + delivery.MFSTDATE + '&PRONUMBER=' + delivery.PRONUMBER + '&PRODATE=' + delivery.PRODATE + '&SHIPNAME=' + delivery.SHIPNAME + '&CONSNAME=' + delivery.CONSNAME +
            '&CONSADD1=' + delivery.CONSADD1 + '&CONSADD2=' + delivery.CONSADD2 + '&CONSCITY=' + delivery.CONSCITY + '&CONSSTATE=' + delivery.CONSSTATE + '&CONSZIP=' + delivery.CONSZIP +
            '&TTLPCS=' + delivery.TTLPCS + '&TTLYDS=' + delivery.TTLYDS + '&TTLWGT=' + delivery.TTLWGT + '&DLVDDATE=' + delivery.DLVDDATE + '&DLVDTIME=' + delivery.DLVDTIME + '&DLVDPCS=' + delivery.DLVDPCS +
            '&DLVDSIGN=' + delivery.DLVDSIGN + '&DLVDNOTE=' + delivery.DLVDNOTE + '&DLVDIMGFILELOCN=' + delivery.DLVDIMGFILELOCN + '&DLVDIMGFILESIGN=' + delivery.DLVDIMGFILESIGN

        const response = await fetch(API_URL + "api/DriverChecklist/AddManifest" + deliveryString, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
        console.log(response);
        return response;
    }

    async function updateDelivery(mfstkey) {
        const requestOptions = {
            method: 'PUT',
            headers: headers,
            /*
            body: JSON.stringify({
                DLVDDATE: scrapeDate(formData.deliveryDate),
                DLVTIME: scrapeTime(formData.deliveryTime),
                DLVDPCS: formData.deliveredPieces,
                DLVDNOTE: formData.deliveryNotes,
                DLVDIMGFILELOCN: scrapeFile(formData.deliveryImagePath),
                DLVDIMGFILESIGN: scrapeFile(formData.deliverySignaturePath)
            })
            */
        };
        fetch(API_URL + "api/DriverChecklist/UpdateDelivery?MFSTKEY=" + mfstkey + "&DLDVDDATE=" + delivery.DLVDDATE + "&DLVTIME=" + delivery.DLVTIME + "&DLVDPCS=" + delivery.DLVDPCS + "&DLVDNOTE=" + delivery.DLVDNOTE + "&DLVDIMGFILELOCN" + delivery.DLVDIMGFILELOCN + "&DLVDIMGFILESIGN=" + delivery.DLVDIMGFILESIGN, requestOptions)
    }


    const navigate = useNavigate();

    async function handleSubmit() {
        //alert(JSON.stringify(delivery));
        //console.log(JSON.stringify(delivery));
        //updateDelivery(delivery.MFSTKEY);
        await handleDelete(delivery.MFSTKEY);
        await handleCreate();

        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials
        };
        //console.log("returning with deliveryData:", deliveryData)
        navigate(`/driverlog`, { state: deliveryData });
    }

    const handleReturn = () => {
        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials
        };
        //console.log("returning with deliveryData:", deliveryData)
        navigate(`/driverlog`, { state: deliveryData });
    };


    return (
        <div id="webpage">
            <Header
                title="Delivery Update"
                currUser={currUser}
                header="Full"
                alt="Provide Delivery Information"
                MFSTDATE={delivery.MFSTDATE}
                POWERUNIT={delivery.POWERUNIT}
                STOP={delivery.STOP}
                PRONUMBER={delivery.PRONUMBER}
                MFSTKEY={delivery.MFSTKEY}
            />
            <div id="Delivery_Input_Div">
                <form>
                    <div id="datetime_Div">
                        <div>
                            <label>Date:</label>
                            <input type="date" id="dlvdate" value={formData.deliveryDate} className="input_form" onChange={handleChange} />
                        </div>
                        <div>
                            <label>Time:</label>
                            <input type="time" id="dlvtime" value={formData.deliveryTime} className="input_form" onChange={handleChange} />
                        </div>
                    </div>
                    <div id="pis_Div">
                        <div>
                            <label>Driver Name:</label>
                            <input type="text" id="dlvdsign" value={formData.deliveredSign} className="input_form" min="0" max="999" onChange={handleChange} />
                        </div>
                        <div>
                            <label>Pieces Delivered:</label>
                            <input type="number" id="dlvdpcs" value={formData.deliveredPieces} className="input_form" min="0" max="999" onChange={handleChange} />
                        </div>
                    </div>
                    <div id="img_Div">
                        <div>
                            <label>Driver Signature:</label>
                            <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_form" onChange={handleChange} />
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_form" onChange={handleChange} />
                                {uploadSignatureStatus}
                            </label>*/}
                        </div>
                        <div>
                            <label>Delivery Image:</label>
                            <input type="file" accept="image/*" id="dlvdimage" className="input_form" onChange={handleChange} />
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimage" className="input_form" onChange={handleChange} />
                                {uploadImageStatus}
                            </label>*/}
                        </div>
                    </div>
                    <div id="notes_Div">
                        <label>Delivery Notes: </label>
                        <input type="text" id="dlvdnote" className="input_form" onChange={handleChange} maxLength="30" />
                    </div>
                    <button onClick={handleSubmit} type="button">Update Delivery</button>
                </form>
                <button onClick={handleReturn} type="button">Back To Deliveries</button>
            </div>
        </div>
    )
}

export default DeliveryForm;