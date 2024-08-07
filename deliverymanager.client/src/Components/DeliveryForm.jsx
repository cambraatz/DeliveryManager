import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { scrapeDate, renderDate, scrapeTime, scrapeFile, getDate, getTime } from '../Scripts/helperFunctions';

const DeliveryForm = () => {
    /*
    // Header information for API call reference...
    */
    //const API_URL = "http://localhost:5113/";
    //const API_URL = "http://www.tcsservices.com:40730/"
    const API_URL = "http://www.deliverymanager.tcsservices.com:40730/"

    /*
    // Date and time data and processing functions...
    */
    const currDate = getDate()
    const currTime = getTime();

    /*
    // Site state & location processing functions...  
    */ 
    const location = useLocation();

    useEffect(() => {
        if (location.state.delivery["DLVDIMGFILELOCN"] === null || location.state.delivery["DLVDIMGFILESIGN"] === null){
            document.getElementById('img_file_sign').style.display = "none";
            document.getElementById('img_file_locn').style.display = "none";
        }
    },[])

    //
    // const 'driverCredentials' to be passed to next page...
    const driverCredentials = {
        USERNAME: location.state.driver["USERNAME"],
        //PASSWORD: location.state.driver["PASSWORD"],
        POWERUNIT: location.state.driver["POWERUNIT"],
    }

    const currUser = driverCredentials.USERNAME;

    //
    // const 'updateData' to be passed to next page... 
    const updateData = {
        MFSTDATE: location.state.delivery["MFSTDATE"],
        POWERUNIT: location.state.delivery["POWERUNIT"],
    };

    //
    // catch null address2 value from db...
    let address2 = location.state.delivery["CONSADD2"];
    if (address2 === "" || address2 === null){
        address2 = "N/A"
    }

    //
    // logic to catch existing deliveries...
    let pieces = location.state.delivery["DLVDPCS"];
    if (pieces === "" || pieces === null){
        pieces = location.state.delivery["TTLPCS"]
    }

    //
    // prompt file upload message on delivered...
    let img_file_locn = location.state.delivery["DLVDIMGFILELOCN"]
    let img_file_sign = location.state.delivery["DLVDIMGFILESIGN"]
    if (img_file_locn === null){
        img_file_locn = ""
        
    }
    else if (img_file_sign === null){
        img_file_sign = ""
    }

    //
    // catch null delivery notes...
    let delivery_notes = location.state.delivery["DLVDNOTE"]
    if (delivery_notes === null){
        delivery_notes = ""
    }

    //
    // catch null printed signature...
    let print_sign = location.state.delivery["DLVDSIGN"]
    if (print_sign === null){
        print_sign = ""
    }

    //
    // maintain state values to update delivery entry...
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
        DLVDPCS: pieces,

        DLVDSIGN: print_sign,
        DLVDNOTE: delivery_notes,
        DLVDIMGFILELOCN: img_file_locn,
        DLVDIMGFILESIGN: img_file_sign
    });

    //
    // state data for rendering and tracking user changes...
    const [formData, setFormData] = useState({
        deliveryDate: currDate,
        deliveryTime: currTime,
        deliveredPieces: delivery.TTLPCS,

        deliveryConsignee: delivery.CONSNAME,
        deliveryNotes: delivery.DLVDNOTE,   
        deliveryImagePath: delivery.DLVDIMGFILELOCN,
        deliverySignaturePath: delivery.DLVDIMGFILESIGN,
        deliverySign: delivery.DLVDSIGN   
        /*
        deliveredSign: "",
        deliveryNotes: "",
        deliveryImagePath: "/dummyImage.jpg",
        deliverySignaturePath: "/dummySignature.jpg",
        */
    });

    //
    // handle delivery form changes...
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
            case 'dlvcons':
                setFormData({
                    ...formData,
                    deliveryConsignee: val
                });
                setDelivery({
                    ...delivery,
                    CONSNAME: val
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
                    deliverySign: val
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
                //uploadImageStatus = "Submitted";
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
                //uploadSignatureStatus = "Submitted";
                break;
            default:
                break;
        }
    };

    /*
    // API Calls and Functionality ...
    */
    const navigate = useNavigate();

    //
    // handle updating existing delivery records when changed...
    async function handleUpdate() {
        const deliveryString = '?MFSTKEY=' + delivery.MFSTKEY + '&STATUS=1&LASTUPDATE=' + delivery.LASTUPDATE + '&MFSTNUMBER=' + delivery.MFSTNUMBER + '&POWERUNIT=' + delivery.POWERUNIT + '&STOP=' + delivery.STOP +
            '&MFSTDATE=' + delivery.MFSTDATE + '&PRONUMBER=' + delivery.PRONUMBER + '&PRODATE=' + delivery.PRODATE + '&SHIPNAME=' + delivery.SHIPNAME + '&CONSNAME=' + delivery.CONSNAME +
            '&CONSADD1=' + delivery.CONSADD1 + '&CONSADD2=' + delivery.CONSADD2 + '&CONSCITY=' + delivery.CONSCITY + '&CONSSTATE=' + delivery.CONSSTATE + '&CONSZIP=' + delivery.CONSZIP +
            '&TTLPCS=' + delivery.TTLPCS + '&TTLYDS=' + delivery.TTLYDS + '&TTLWGT=' + delivery.TTLWGT + '&DLVDDATE=' + delivery.DLVDDATE + '&DLVDTIME=' + delivery.DLVDTIME + '&DLVDPCS=' + delivery.DLVDPCS +
            '&DLVDSIGN=' + delivery.DLVDSIGN + '&DLVDNOTE=' + delivery.DLVDNOTE + '&DLVDIMGFILELOCN=' + delivery.DLVDIMGFILELOCN + '&DLVDIMGFILESIGN=' + delivery.DLVDIMGFILESIGN

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest" + deliveryString, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
        return response;
    }

    /*
    //
    // handle deleting existing delivery record once changed...
    async function handleDelete(mfstkey) {
        const response = await fetch(API_URL + "api/DriverChecklist/DeleteManifest?MFSTKEY=" + mfstkey, {
            method: "DELETE",
            headers,
        })
        //console.log(response);
        return response;
    }

    //
    // immediately recreates updated delivery to be added back...
    async function handleCreate() {
        //let add2 = "NULL";
        //if(delivery.CONSADD2){
        //    add2 = delivery.CONSADD2
        //}
        const deliveryString = '?MFSTKEY=' + delivery.MFSTKEY + '&STATUS=1&LASTUPDATE=' + delivery.LASTUPDATE + '&MFSTNUMBER=' + delivery.MFSTNUMBER + '&POWERUNIT=' + delivery.POWERUNIT + '&STOP=' + delivery.STOP +
            '&MFSTDATE=' + delivery.MFSTDATE + '&PRONUMBER=' + delivery.PRONUMBER + '&PRODATE=' + delivery.PRODATE + '&SHIPNAME=' + delivery.SHIPNAME + '&CONSNAME=' + delivery.CONSNAME +
            '&CONSADD1=' + delivery.CONSADD1 + '&CONSADD2=' + delivery.CONSADD2 + '&CONSCITY=' + delivery.CONSCITY + '&CONSSTATE=' + delivery.CONSSTATE + '&CONSZIP=' + delivery.CONSZIP +
            '&TTLPCS=' + delivery.TTLPCS + '&TTLYDS=' + delivery.TTLYDS + '&TTLWGT=' + delivery.TTLWGT + '&DLVDDATE=' + delivery.DLVDDATE + '&DLVDTIME=' + delivery.DLVDTIME + '&DLVDPCS=' + delivery.DLVDPCS +
            '&DLVDSIGN=' + delivery.DLVDSIGN + '&DLVDNOTE=' + delivery.DLVDNOTE + '&DLVDIMGFILELOCN=' + delivery.DLVDIMGFILELOCN + '&DLVDIMGFILESIGN=' + delivery.DLVDIMGFILESIGN

        const response = await fetch(API_URL + "api/DriverChecklist/AddManifest" + deliveryString, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
        //console.log(response);
        return response;
    }
    */

    //
    // helper function to update delivery and return to previous page...
    async function handleSubmit() {
        //await handleDelete(delivery.MFSTKEY);
        //await handleCreate();
        await handleUpdate();

        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials
        };
        //console.log("returning with deliveryData:", deliveryData)
        navigate(`/driverlog`, { state: deliveryData });
    }

    //
    // return to previous page after doing nothing...
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
                        <div className="cont_left">
                            <label>Date:</label>
                            <input type="date" id="dlvdate" value={formData.deliveryDate} className="input_form" onChange={handleChange} required/>
                        </div>
                        <div className="cont_right">
                            <label>Time:</label>
                            <input type="time" id="dlvtime" value={formData.deliveryTime} className="input_form" onChange={handleChange} required/>
                        </div>
                    </div>
                    <div id="pis_Div">
                        <div className="cont_left">
                            <label>Consignee Name:</label>
                            <input type="text" id="dlvcons" value={formData.deliveryConsignee} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                        <div className="cont_right">
                            <label>Pieces Delivered:</label>
                            <input type="number" id="dlvdpcs" value={formData.deliveredPieces} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                    </div>
                    <div id="notes_Div">
                        <label>Delivery Notes: </label>
                        <input type="text" id="dlvdnote" value={formData.deliveryNotes} className="input_form" onChange={handleChange} maxLength="30" required/>
                    </div>
                    <div id="img_Div">
                        <div>
                            <label>Delivery Image:</label>
                            <input type="file" accept="image/*" id="dlvdimage" className="input_image" onChange={handleChange} required/>
                            <p id="img_file_locn" className="image_confirmation">Image ({formData.deliveryImagePath}) On File...</p>
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimage" className="input_form" onChange={handleChange} />
                                {uploadImageStatus}
                            </label>*/}
                        </div>
                        <div>
                            <label>Consignee Signature:</label>
                            <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_image" onChange={handleChange} required/>
                            <p id="img_file_sign" className="image_confirmation">Image ({formData.deliverySignaturePath}) On File...</p>
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_form" onChange={handleChange} />
                                {uploadSignatureStatus}
                            </label>*/}
                        </div>
                    </div>
                    <div id="print_div">
                        <div className="cont_left">
                            <label>Printed Name (Consignee):</label>
                            <input type="text" id="dlvdsign" value={formData.deliverySign} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                    </div>
                    
                    <button onClick={handleSubmit} type="button">Update Delivery</button>
                </form>
                <button onClick={handleReturn} type="button">Back To Deliveries</button>
            </div>
        </div>
    )
}

export default DeliveryForm;