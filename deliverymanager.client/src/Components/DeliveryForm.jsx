import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { scrapeDate, renderDate, renderTime, scrapeTime, scrapeFile, getDate, getTime, translateDate, API_URL } from '../Scripts/helperFunctions';

const DeliveryForm = () => {
    /*
    // Date and time data and processing functions...
    */
    const currDate = getDate()
    const currTime = getTime();

    /*
    // Site state & location processing functions...  
    */ 
    const location = useLocation();
    const navigate = useNavigate();

    let img_loc = location.state ? location.state.delivery["DLVDIMGFILELOCN"] : null;
    let img_sign = location.state ? location.state.delivery["DLVDIMGFILESIGN"] : null;

    useEffect(() => {
        //console.log("This was triggered with useEffect()...")
        if(!location.state){
           navigate("/")
        }

        if(img_loc === null || img_loc === "") {
            document.getElementById('img_file_locn').style.display = "none";
        }
        if(img_sign === null || img_sign === "") {
            document.getElementById('img_file_sign').style.display = "none";
        }
        if(location.state.delivery["STATUS"] != 1) {
            document.getElementById('undeliver').style.display = "none";
            document.getElementById('button_div').style.justifyContent = "space-around";
            document.getElementById('button_div').style.padding = "0 10%";
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    //
    // const 'driverCredentials' to be passed to next page...
    const driverCredentials = {
        USERNAME: location.state ? location.state.driver["USERNAME"] : null,
        POWERUNIT: location.state ? location.state.driver["POWERUNIT"] : null,
    }

    const currUser = driverCredentials.USERNAME;

    //
    // const 'updateData' to be passed to next page... 
    const updateData = {
        MFSTDATE: location.state ? location.state.delivery["MFSTDATE"] : null,
        POWERUNIT: location.state ? location.state.delivery["POWERUNIT"] : null,
    };

    //
    // catch null address2 value from db...
    let address2 = location.state ? location.state.delivery["CONSADD2"] : null;
    if (address2 === "" || address2 === null){
        address2 = "N/A"
    }

    //
    // logic to catch existing deliveries...
    let pieces = location.state ? location.state.delivery["DLVDPCS"] : null;
    if (pieces === "" || pieces === null){
        pieces = location.state ? location.state.delivery["TTLPCS"] : "";
    }

    //
    // prompt file upload message on delivered...
    if(img_loc === null) {
        img_loc = ""
    }
    if(img_sign === null) {
        img_sign = ""
    }

    //
    // catch null delivery notes...
    let delivery_notes = location.state ? location.state.delivery["DLVDNOTE"] : null;
    if (delivery_notes === null){
        delivery_notes = ""
    }

    //
    // catch null printed signature...
    let print_sign = location.state ? location.state.delivery["DLVDSIGN"] : null;
    if (print_sign === null){
        print_sign = ""
    }

    //
    // handle both existing deliveries and new ones...
    let delivery_time = location.state ? location.state.delivery["DLVDTIME"] : null;
    if (delivery_time === null){
        delivery_time = currTime
    }
    else{
        delivery_time = renderTime(delivery_time)
    }

    //
    // handle both existing deliveries and new ones...
    let delivery_date = location.state ? location.state.delivery["DLVDDATE"] : null;
    if (delivery_date === null){
        delivery_date = currDate
    }
    else{
        delivery_date = translateDate(delivery_date)
    }

    //
    // maintain state values to update delivery entry...
    const [delivery, setDelivery] = useState({
        MFSTKEY: location.state ? location.state.delivery["MFSTKEY"] : null,
        STATUS: location.state ? location.state.delivery["STATUS"] : null,
        LASTUPDATE: location.state ? location.state.delivery["LASTUPDATE"] : null,
        MFSTNUMBER: location.state ? location.state.delivery["MFSTNUMBER"] : null,
        POWERUNIT: location.state ? location.state.delivery["POWERUNIT"] : null,
        STOP: location.state ? location.state.delivery["STOP"] : null,
        MFSTDATE: location.state ? location.state.delivery["MFSTDATE"] : null,
        PRONUMBER: location.state ? location.state.delivery["PRONUMBER"] : null,
        PRODATE: location.state ? location.state.delivery["PRODATE"] : null,
        SHIPNAME: location.state ? location.state.delivery["SHIPNAME"] : null,
        CONSNAME: location.state ? location.state.delivery["CONSNAME"] : null,
        CONSADD1: location.state ? location.state.delivery["CONSADD1"] : null,
        CONSADD2: address2,
        CONSCITY: location.state ? location.state.delivery["CONSCITY"] : null,
        CONSSTATE: location.state ? location.state.delivery["CONSSTATE"] : null,
        CONSZIP: location.state ? location.state.delivery["CONSZIP"] : null,
        TTLPCS: location.state ? location.state.delivery["TTLPCS"] : null,
        TTLYDS: location.state ? location.state.delivery["TTLYDS"] : null,
        TTLWGT: location.state ? location.state.delivery["TTLWGT"] : null,
        DLVDDATE: scrapeDate(currDate),
        DLVDTIME: scrapeTime(currTime),
        DLVDPCS: pieces,

        DLVDSIGN: print_sign,
        DLVDNOTE: delivery_notes,
        DLVDIMGFILELOCN: img_loc,
        DLVDIMGFILESIGN: img_sign
    });

    //
    // state data for rendering and tracking user changes...
    const [formData, setFormData] = useState({
        deliveryDate: delivery_date,
        deliveryTime: delivery_time,
        deliveredPieces: pieces,

        deliveryConsignee: delivery.CONSNAME,
        deliveryNotes: delivery.DLVDNOTE,   
        deliveryImagePath: delivery.DLVDIMGFILELOCN,
        deliverySignaturePath: delivery.DLVDIMGFILESIGN,
        deliverySign: delivery.DLVDSIGN   
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
                /*
                setDelivery({
                    ...delivery,
                    DLVDIMGFILELOCN: val
                });
                */
                setDelivery({
                    ...delivery,
                    DLVDIMGFILELOCN: scrapeFile(val)
                });
                
                break;
            case 'dlvdimagefilesign':
                setFormData({
                    ...formData,
                    deliverySignaturePath: val
                });
                /*
                setDelivery({
                    ...delivery,
                    DLVDIMGFILESIGN: val
                });
                */
                setDelivery({
                    ...delivery,
                    DLVDIMGFILESIGN: scrapeFile(val)
                });
                
                break;
            default:
                break;
        }
    };

    /*
    // API Calls and Functionality ...
    */

    //
    // handle updating existing delivery records when changed...
    async function clearDelivery() {
        let sign = delivery.DLVDSIGN
        if(sign === ""){
            sign = "n/a"
        }

        let note = delivery.DLVDNOTE
        if(note === ""){
            note = "n/a"
        }

        let img = delivery.DLVDIMGFILELOCN
        if(img === ""){
            img = "n/a"
        }

        let sign_img = delivery.DLVDIMGFILESIGN
        if(sign_img === ""){
            sign_img = "n/a"
        }

        const deliveryString = '?MFSTKEY=' + delivery.MFSTKEY + 
                            '&STATUS=0&LASTUPDATE=' + delivery.LASTUPDATE + 
                            '&MFSTNUMBER=' + delivery.MFSTNUMBER + 
                            '&POWERUNIT=' + delivery.POWERUNIT + 
                            '&STOP=' + delivery.STOP +
                            '&MFSTDATE=' + delivery.MFSTDATE + 
                            '&PRONUMBER=' + delivery.PRONUMBER + 
                            '&PRODATE=' + delivery.PRODATE + 
                            '&SHIPNAME=' + delivery.SHIPNAME.replace("&","%26") + 
                            '&CONSNAME=' + delivery.CONSNAME.replace("&","%26") +
                            '&CONSADD1=' + delivery.CONSADD1.replace("&","%26")  + 
                            '&CONSADD2=' + delivery.CONSADD2.replace("&","%26")  + 
                            '&CONSCITY=' + delivery.CONSCITY + 
                            '&CONSSTATE=' + delivery.CONSSTATE + 
                            '&CONSZIP=' + delivery.CONSZIP +
                            '&TTLPCS=' + delivery.TTLPCS + 
                            '&TTLYDS=' + delivery.TTLYDS + 
                            '&TTLWGT=' + delivery.TTLWGT + 
                            '&DLVDDATE=' + null + 
                            '&DLVDTIME=' + null + 
                            '&DLVDPCS=' + null +
                            '&DLVDSIGN=' + null + 
                            '&DLVDNOTE=' + null + 
                            '&DLVDIMGFILELOCN=' + null + 
                            '&DLVDIMGFILESIGN=' + null

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest" + deliveryString, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
        return response;
    }

    //
    // handle updating existing delivery records when changed...
    async function handleUpdate() {
        let sign = delivery.DLVDSIGN
        if(sign === ""){
            sign = "n/a"
        }

        let note = delivery.DLVDNOTE
        if(note === ""){
            note = "n/a"
        }

        let img = delivery.DLVDIMGFILELOCN
        if(img === ""){
            img = "n/a"
        }

        let sign_img = delivery.DLVDIMGFILESIGN
        if(sign_img === ""){
            sign_img = "n/a"
        }
        /*
        const deliveryString = '?MFSTKEY=' + delivery.MFSTKEY + 
                            '&STATUS=1&LASTUPDATE=' + delivery.LASTUPDATE + 
                            '&MFSTNUMBER=' + delivery.MFSTNUMBER + 
                            '&POWERUNIT=' + delivery.POWERUNIT + 
                            '&STOP=' + delivery.STOP +
                            '&MFSTDATE=' + delivery.MFSTDATE + 
                            '&PRONUMBER=' + delivery.PRONUMBER + 
                            '&PRODATE=' + delivery.PRODATE + 
                            '&SHIPNAME=' + delivery.SHIPNAME.replace("&","%26") + 
                            '&CONSNAME=' + delivery.CONSNAME.replace("&","%26") +
                            '&CONSADD1=' + delivery.CONSADD1.replace("&","%26")  + 
                            '&CONSADD2=' + delivery.CONSADD2.replace("&","%26")  + 
                            '&CONSCITY=' + delivery.CONSCITY + 
                            '&CONSSTATE=' + delivery.CONSSTATE + 
                            '&CONSZIP=' + delivery.CONSZIP +
                            '&TTLPCS=' + delivery.TTLPCS + 
                            '&TTLYDS=' + delivery.TTLYDS + 
                            '&TTLWGT=' + delivery.TTLWGT + 
                            '&DLVDDATE=' + delivery.DLVDDATE + 
                            '&DLVDTIME=' + delivery.DLVDTIME + 
                            '&DLVDPCS=' + delivery.DLVDPCS +
                            '&DLVDSIGN=' + sign.replace("&","%26")  + 
                            '&DLVDNOTE=' + note.replace("&","%26")  + 
                            '&DLVDIMGFILELOCN=' + img + 
                            '&DLVDIMGFILESIGN=' + sign_img

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest" + deliveryString, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        })
        */
        let formData = new FormData();
        for (const [key,value] of Object.entries(delivery)){
            formData.append(key,value)
        }
        alert(formData)

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest", {
            body: formData,
            method: "PUT",
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
    async function handleSubmit(e) {
        //await handleDelete(delivery.MFSTKEY);
        //await handleCreate();
        //alert(e.target.id)
        let response = "default response"
        let form = document.getElementById("form_data")
        alert(form[0])

        if(e.target.id === "undeliver"){
            alert("Undo Delivery Feature in Progress, returning to deliveries.")
            //await clearDelivery();
        }
        else{
            response = await handleUpdate();
        }

        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials
        };
        alert(response)
        if(response == "Updated Successfully"){
            navigate(`/driverlog`, { state: deliveryData });
        }
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
                <form id="form_data" onSubmit={handleSubmit}>
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
                            <input type="text" id="dlvcons" value={formData.deliveryConsignee} className="input_form" disabled/>
                        </div>
                        <div className="cont_right">
                            <label>Pieces Delivered:</label>
                            <input type="number" id="dlvdpcs" value={formData.deliveredPieces} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                    </div>
                    <div id="notes_Div">
                        <label>Delivery Note: </label>
                        <input type="text" id="dlvdnote" value={formData.deliveryNotes} className="input_form" onChange={handleChange} maxLength="30"/>
                    </div>
                    <div id="img_Div">
                        <div>
                            <label>Consignee Signature: <i>Image</i> </label>
                            <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_image" onChange={handleChange}/>
                            <p id="img_file_sign" className="image_confirmation">Image ({formData.deliverySignaturePath}) On File...</p>
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimagefilesign" className="input_form" onChange={handleChange} />
                                {uploadSignatureStatus}
                            </label>*/}
                        </div>
                        <div>
                            <label>Delivery Location: <i> Image</i></label>
                            <input type="file" accept="image/*" id="dlvdimage" className="input_image" onChange={handleChange}/>
                            <p id="img_file_locn" className="image_confirmation">Image ({formData.deliveryImagePath}) On File...</p>
                            {/*<label className="fileUpload">
                                <input type="file" accept="image/*" id="dlvdimage" className="input_form" onChange={handleChange} />
                                {uploadImageStatus}
                            </label>*/}
                        </div>
                    </div>
                    <div id="print_div">
                        <div className="cont_left">
                            <label>Consignee Signature: <i>Print</i></label>
                            <input type="text" id="dlvdsign" value={formData.deliverySign} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                    </div>
                </form>
                <div id="button_div">
                        <button id="update" onClick={handleSubmit} type="button">Update Delivery</button>
                        <button id="undeliver" onClick={handleSubmit} type="button">Undo Delivery</button>
                        <button onClick={handleReturn} type="button">Back To Deliveries</button>
                    </div>
            </div>
        </div>
    )
}

export default DeliveryForm;