//////////////////////////////////////////////////////////////////////////////////////
/* 
DeliveryForm() - User Manipulation of Delivery Records



//////////////////////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
DeliveryForm() {
    gather current date/time
    initialize react location and navigation
    initialize empty image state for signature and location capture

    if location.state is valid:
        gather delivery location image from state
        gather signature image from state

    useEffect() {
        catch indirect visits to current page, redirect to login
        for both 'img_loc' or 'img_sign':
            if null or "": <-- : *** see if this is always null now that backend is handling null values correctly***
                hide image thumbnail
                render image capture button
            if not null:
                retrieveImage(img_loc || img_sign) 
                setImages(...images, retrievedImage) - set image thumbnail for render

        if delivery "STATUS" is undelivered:
            hide "clear delivery" button
            adjust formatting accordingly
    },[]) <-- triggers once on initial render only...

    [image/response] : retrieveImage(image) {
        retrieve image on file
        return image
    }

    initialize "driverCredentials" object from location state (null if not): USERNAME and POWERUNIT

    gather current username from driverCredentials <-- *** can this just directly reference driverCredentials? ***

    initialize "updateData" object from location state (null if not): MFSTDATE and POWERUNIT <-- *** be sure the redundancy is necessary ***
    
    initialize "delivery_time" from location state (null if not) 
    if null:
        set to current time
    else:
        set to delivery time on file, formatted for render

    initialize "delivery_date" from location state (null if not)
    if null:
        set to current date
    else:
        set to delivery date on file, formatted for render

    initialize "delivery_pieces" from location state (null if not)
    if null: <-- *** does this really need to check location.state again? ***
        set to expected TTLPCS on file
    
    initialize "delivery" object to be used for updating delivery on database (field for each DB field)

    initialize "formData" object to be used for rendering delivery information on screen/form field

    [void] : handleChange(event) {
        gather e.target value - ie: the updated value in form
        switch (e.target.id): 
            if "dlvddate":
                setFormData(..., renderDate(val))
                setDelivery(..., scrapeTime(val))   

            if "dlvtime", "dlvdpcs", "dlvdsign", or "dlvdnote":
                setFormData(..., val)
                setDelivery(..., val) 

            if "dlvdimage":
                setFormData(..., new image) <-- *** this too ***
                setDelivery(..., new image file) <-- *** should these be wrapped in the following if statement, handle invalid file? ***
                if (file is a valid image file):
                    create Object URL from file
                    setDeliveryLocation() state to the generated url
                hide image capture button and previous image thumbnail <-- *** this too ***
                *//* previous opacity transition commented out *//*

            if "dlvdimagefilesign":
                setFormData(..., new signature blob)
                setDelivery(..., new signature file)
                *//* previous opacity transition commented out *//*
    }

    *//* [image/file] : resizePhoto() { inactive function to resize photos on the frontend } *//*

    [string] : clearDelivery() {
        package snapshot of "delivery", overwriting any dynamic fields back to default values (except LASTUPDATE)
        map delivery object into new FormData() object
        update the delivery entry in the database
        return the response string
    }

    [string] : handleUpdate() {
        map current state of "delivery" object into new FormData() object
        if "DLVDIMGFILELOCN" field is a filename string (in lieu of an image file):
            *//* note: this condition occurs when a previous image is already on file and is not overwritten *//*
            add new tag-along field, "location_string" to pass filename to backend to query later
            set "DLVDIMGFILELOCN" to null

        if "DLVDIMGFILESIGN" field is a filename string (in lieu of an image file):
            repeat the conditional logic above for "DLVDIMGFILESIGN" and "signature_string"

        if user left "deliveryNotes" or "deliverySign" blank (ie: empty quotes): 
            replace them with true null values in lieu of blank quotes

        set the "LASTUPDATE" field to the current date/time
        request "PUT" to update delivery on the database

        return response string
    }

    [void] : handleSubmit(event) {
        initialize response for overwriting
        if (e.target.id === "undeliver"):
            clearDelivery() to default delivery values (except LASTUPDATE)
        else:
            handleUpdate()  to update delivery fields in database

        if (response is valid):
            navigate() back to /driverlog (ie: delivery manifest)
    }

    [void] : handleReturn() {
        package "deliveryData" object to repopulate delivery manifest upon return
        navigate() back to /driverlog (ie: delivery manifest) making no changes
    }

    initialize "signStatus" state to "No signature chosen"
    initialize "locStatus" state to "No image chosen"

    initialize "userSignature" and "deliveryLocation" stats to null

    [void] : handleSignature() {}

    [void] : signatureToggle() {}

    [void] : handlePopupClose() {}

    ...

    [void] : collapseHeader() {}
}

*/////////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ImageRenderer from './ImageRenderer';
import SignatureField from './SignatureField';
import ImageUploadLogo from '../assets/add_image.svg';
import SignUploadLogo from '../assets/add_sign.svg';

import { scrapeDate, 
    renderDate, 
    renderTime, 
    scrapeTime, 
    getDate, 
    getTime, 
    translateDate, 
    API_URL, 
    getToken, 
    isTokenValid,
    logout /*, scrapeFile*/ } from '../Scripts/helperFunctions';

const DeliveryForm = () => {
    /*
    // Date and time data and processing functions...
    */
    const currDate = getDate();
    const currTime = getTime();

    /*
    // Site state & location processing functions...  
    */ 
    const location = useLocation();
    const navigate = useNavigate();

    const [images,setImages] = useState({
        Signature: null,
        Location: null,
    });

    let img_loc = location.state ? location.state.delivery["DLVDIMGFILELOCN"] : null;
    let img_sign = location.state ? location.state.delivery["DLVDIMGFILESIGN"] : null;

    //document.getElementById("Header").style.top = "-20%";

    useEffect(() => {
        const token = getToken();
        if(!isTokenValid(token)){
            logout();
            navigate('/');
        }

        //console.log("This was triggered with useEffect()...")
        if(!location.state){
           navigate("/")
        }

        //console.log(`useEffect(): img_loc=${img_loc}, img_sign=${img_sign}`)

        if(img_loc === null || img_loc === "") {
            document.getElementById('img_Div_Loc').style.display = "none";
            document.getElementById('locCapture').style.display = "flex";
            //document.getElementById('img_file_locn').style.display = "none";
        } else if(img_loc !== null) {
            const location_img = retrieveImage(img_loc);
            setImages({...images, Location: location_img})
            //console.log(`set ${location_img} to image state...`);
        }

        if(img_sign === null || img_sign === "") {
            document.getElementById('img_Div_Sign').style.display = "none";
            document.getElementById('sigCapture').style.display = "flex";
            //document.getElementById('img_file_sign').style.display = "none";
        } else if(img_sign !== null) {
            const signature_img = retrieveImage(img_sign);
            setImages({...images, Signature: signature_img})
            //console.log(`set ${signature_img} to image state...`);
        }

        if(location.state.delivery["STATUS"] != 1) {
            document.getElementById('undeliver').style.display = "none";
            document.getElementById('button_div').style.justifyContent = "space-around";
            document.getElementById('button_div').style.padding = "0 10%";
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    
    async function retrieveImage(image) {
        //console.log(`This will return ${image}...`)
        const testImage = await fetch(API_URL + "api/DriverChecklist/GetImage?IMAGE="+image)
        return testImage
    }

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

    let delivery_pieces = location.state ? location.state.delivery["DLVDPCS"] : null;
    if (location.state && delivery_pieces === null){
        delivery_pieces = location.state.delivery["TTLPCS"]
    }

    //
    // maintain state values to update delivery entry...
    const [delivery, setDelivery] = useState({
        MFSTKEY: location.state ? location.state.delivery["MFSTKEY"] : null,
        STATUS: "1",
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
        CONSADD2: location.state ? location.state.delivery["CONSADD2"] : null,
        CONSCITY: location.state ? location.state.delivery["CONSCITY"] : null,
        CONSSTATE: location.state ? location.state.delivery["CONSSTATE"] : null,
        CONSZIP: location.state ? location.state.delivery["CONSZIP"] : null,
        TTLPCS: location.state ? location.state.delivery["TTLPCS"] : null,
        TTLYDS: location.state ? location.state.delivery["TTLYDS"] : null,
        TTLWGT: location.state ? location.state.delivery["TTLWGT"] : null,
        DLVDDATE: location.state ? location.state.delivery["DLVDDATE"] : scrapeDate(currDate),
        DLVDTIME: location.state ? location.state.delivery["DLVDTIME"] : scrapeTime(currTime),
        DLVDPCS: delivery_pieces,
        DLVDSIGN: location.state ? location.state.delivery["DLVDSIGN"] : null,
        DLVDNOTE: location.state ? location.state.delivery["DLVDNOTE"] : null,
        DLVDIMGFILELOCN: location.state ? location.state.delivery["DLVDIMGFILELOCN"] : null,
        DLVDIMGFILESIGN: location.state ? location.state.delivery["DLVDIMGFILESIGN"] : null
    });

    //
    // state data for rendering and tracking user changes...
    const [formData, setFormData] = useState({
        deliveryDate: delivery_date,
        deliveryTime: delivery_time,
        deliveredPieces: delivery.DLVDPCS == null ? delivery.TTLPCS : delivery.DLVDPCS,

        deliveryConsignee: delivery.CONSNAME,
        deliveryNotes: delivery.DLVDNOTE == null ? "" : delivery.DLVDNOTE,   
        deliveryImagePath: delivery.DLVDIMGFILELOCN,
        deliverySignaturePath: delivery.DLVDIMGFILESIGN,
        deliverySign: delivery.DLVDSIGN == null ? "" : delivery.DLVDSIGN 
    });

    //
    // handle delivery form changes...
    const handleChange = (e) => {
        //console.log(e.target)
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
                    DLVDTIME: scrapeTime(val)
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
                    DLVDIMGFILELOCN: e.target.files[0]
                });

                if (e.target.files[0] && e.target.files[0].type.startsWith('image/')) {
                    //resizePhoto(e.target.files[0],300,300, (resizedImageData) => {
                    //    setDeliveryLocation(resizedImageData);
                    //});
                    const url = URL.createObjectURL(e.target.files[0]);
                    setDeliveryLocation(url);
                }
                document.getElementById("img_Div_Loc").style.display = "none";
                document.getElementById("locCapture").style.display = "none";
                /*
                try {
                    document.getElementById("img_Div_Loc").getElementsByTagName("img")[0].style.opacity = 0.5;
                } catch {
                    break;
                }*/
                break;

            case 'dlvdimagefilesign':
                setFormData({
                    ...formData,
                    deliverySignaturePath: val
                });
                setDelivery({
                    ...delivery,
                    DLVDIMGFILESIGN: e.target.files[0]
                });
                /*
                try { 
                    document.getElementById("img_Div_Sign").getElementsByTagName("img")[0].style.opacity = 0.5; 
                } catch {
                    break;
                }*/
                break;
            default:
                break;
        }
    };

    /*
    // API Calls and Functionality ...
    */

    //
    // resize photo prior to uploading...
    /*
    const resizePhoto = (imageFile, newWidth, newHeight, callback) => {
        console.log(imageFile);
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = newWidth;
                canvas.height = newHeight;

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);

                callback(resizedImageData);
            };
        };
        reader.readAsDataURL(imageFile);
    }*/

    //
    // handle updating existing delivery records when changed...
    async function clearDelivery() {
        const reset_delivery = {
            ...delivery,
            LASTUPDATE: currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00",
            STATUS: "0",
            DLVDDATE: null,
            DLVDTIME: null,
            DLVDPCS: -1,
            DLVDSIGN: null,
            DLVDNOTE: null,
            DLVDIMGFILELOCN: null,
            DLVDIMGFILESIGN: null
        };

        let formData = new FormData();
        for (const [key,value] of Object.entries(reset_delivery)){
            formData.append(key,value)
        }

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest", {
            body: formData,
            method: "PUT",
        })

        return response;
    }

    //
    // handle updating existing delivery records when changed...
    async function handleUpdate() {
        let deliveryData = new FormData();
        for (const [key,value] of Object.entries(delivery)){
            deliveryData.append(key,value)
        }

        // add function to resize image here...
        //resizePhoto(delivery.DLVDIMGFILELOCN);

        //console.log(`VALUE OF IMAGE STATES AT TIME OF UPDATE: images.Location:${images.Location}, images.Signature: ${images.Signature}`)
        if (typeof delivery.DLVDIMGFILELOCN === "string") {
            deliveryData.append("location_string",delivery.DLVDIMGFILELOCN)
            deliveryData.set("DLVDIMGFILELOCN", null)
        }

        if (typeof delivery.DLVDIMGFILESIGN === "string") {
            deliveryData.append("signature_string",delivery.DLVDIMGFILESIGN)
            deliveryData.set("DLVDIMGFILESIGN", null)
        }

        if (delivery.deliveryNotes === "") {
            deliveryData.set("DLVDNOTE", null)
        }

        if (delivery.deliverySign === "") {
            deliveryData.set("DLVDSIGN", null)
        }

        // set last update key-value pair to current date-time...
        deliveryData.set("LASTUPDATE", currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00")

        const response = await fetch(API_URL + "api/DriverChecklist/UpdateManifest", {
            body: deliveryData,
            method: "PUT",
        })

        return response;
    }

    //
    // helper function to update delivery and return to previous page...
    async function handleSubmit(e) {
        let response = null

        if(e.target.id === "undeliver"){
            response = await clearDelivery();
        }
        else{
            response = await handleUpdate();
        }

        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials,
            header: header
        };

        // if request was successful, return to delivery manifest...
        if(response && response.ok == true){
            navigate(`/driverlog`, { state: deliveryData });
        }
        
    }

    //
    // return to previous page after doing nothing...
    const handleReturn = () => {
        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials,
            header: header,
            company: company
        };

        navigate(`/driverlog`, { state: deliveryData });
    };

    //const [signStatus,setSignStatus] = useState("No signature chosen");
    //const [locStatus,setLocStatus] = useState("No image chosen");

    const [userSignature,setUserSignature] = useState(null);
    const [deliveryLocation,setDeliveryLocation] = useState(null);

    async function handleSignature(image) {

        /* is this necessary?
        setFormData({
            ...formData,
            deliverySignaturePath: "manual signature"
        });
        setDelivery({
            ...delivery,
            DLVDIMGFILESIGN: image
        });*/

        //console.log(image);
        const url = URL.createObjectURL(image);
        //console.log(url);
        //setSignStatus("Signature collected")
        setUserSignature(url);
        document.getElementById("sigCapture").style.display = "none";

        // is this necessary?
        setFormData({
            ...formData,
            deliverySignaturePath: "manual signature"
        });
        setDelivery({
            ...delivery,
            DLVDIMGFILESIGN: image
        });

        document.getElementById("img_Div_Sign").style.display = "none";
        handlePopupClose();
    }

    const signatureToggle = () => {
        document.getElementById("popupSignatureWindow").style.visibility = "visible";
        document.getElementById("popupSignatureWindow").style.opacity = 1;
        document.getElementById("popupSignatureWindow").style.pointerEvents = "auto";
    }

    const handlePopupClose = () => {
        document.getElementById("popupSignatureWindow").style.visibility = "hidden";
        document.getElementById("popupSignatureWindow").style.opacity = 0;
        document.getElementById("popupSignatureWindow").style.pointerEvents = "none";
    }

    const hiddenFileInput = useRef(null);
    const handleImageClick = () => {
        hiddenFileInput.current.click();
    }

    const [header,setHeader] = useState(location.state.header);

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

    const [company, setCompany] = useState(location.state.company ? location.state.company : "Transportation Computer Support, LLC");

    return (
        <div id="webpage">
            <Header
                company={company}
                title="Delivery Update"
                currUser={currUser}
                header="Full"
                alt="Provide Delivery Information"
                MFSTDATE={delivery.MFSTDATE}
                POWERUNIT={delivery.POWERUNIT}
                STOP={delivery.STOP}
                PRONUMBER={delivery.PRONUMBER}
                MFSTKEY={delivery.MFSTKEY}
                toggle={header}
                onClick={collapseHeader}
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
                        <div id="img_sig_div">
                            <label>Consignee Signature:</label>
                            {userSignature && (
                                <>
                                    <img id="signatureThumbnail" className="thumbnail" src={userSignature} alt="Saved userSignature" onClick={signatureToggle}/>
                                    {/*<label className="thumbnail_label">
                                        <small>Replace Signature?</small>
                                    </label>*/}
                                </>
                            )}
                            <ImageRenderer URL={img_sign} id="img_Div_Sign" onClick={signatureToggle}/>
                            
                            <div id="sigCapture" className="file_upload_widget" style={{display: "none"}} onClick={signatureToggle}>
                                <img id="fileUploadLogo" src={SignUploadLogo} alt="file upload logo" />
                                <p>Collect a signature</p>
                            </div>
                            {/*
                            <div id="sigCapture" style={{display: "none"}}>
                                <button id="signatureToggle" type="button" onClick={signatureToggle}>Add Signature</button>
                                <p>{signStatus}</p>
                            </div>
                            */}
                            
                            {/*<input type="file" accept="image/*" id="dlvdimagefilesign" className="input_image" name="sign_image" onChange={handleChange} capture="environment" style={{display: "none"}}/>*/}
                        </div>
                        <div id="img_loc_div">
                            <label>Delivery Location:</label>
                            {deliveryLocation && (
                                <>
                                    <img id="locationThumbnail" className="thumbnail" src={deliveryLocation} alt="Saved deliveryLocation" onClick={handleImageClick}/>
                                    {/*<label className="thumbnail_label">
                                        <small>Replace Image?</small>
                                    </label>*/}
                                </>
                            )}
                            <ImageRenderer URL={img_loc} id="img_Div_Loc" onClick={handleImageClick}/>
                            <div id="locCapture" className="file_upload_widget" style={{display: "none"}} onClick={handleImageClick}>
                                <img id="fileUploadLogo" src={ImageUploadLogo} alt="file upload logo" />
                                <p>Upload an image</p>
                            </div>
                            {/*
                            <div id="locCapture" style={{display: "none"}}>
                                <button id="locationToggle" type="button" onClick={handleImageClick}>Add Image</button>
                                <p>{locStatus}</p>
                            </div>
                            */}
                            <input type="file" accept="image/*" ref={hiddenFileInput} id="dlvdimage" className="input_image" onChange={handleChange} capture="environment" style={{display: "none"}}/>
                            {/*<input type="file" accept="image/*" id="dlvdimage" className="input_image" onChange={handleChange} capture="environment"/>*/}
                        </div>
                    </div>
                    <div id="print_div">
                        <div className="cont_left">
                            <label>Consignee Signature Printed:</label>
                            <input type="text" id="dlvdsign" value={formData.deliverySign} className="input_form" min="0" max="999" onChange={handleChange} required/>
                        </div>
                    </div>
                </form>
                <div id="button_div">
                    <button onClick={handleReturn} type="button">Back To Deliveries</button>
                    <button id="undeliver" onClick={handleSubmit} type="button">Undo Delivery</button>
                    <button id="update" onClick={handleSubmit} type="button">Update Delivery</button>
                </div>
            </div>

            {/*** POPUP CONTENT - THIS SECTION IS HIDDEN BY DEFAULT ***/}
            <div id="popupSignatureWindow" className="overlay">
                <div className="popupSignature">
                    <div id="popupExit" className="content">
                        <h1 id="close" onClick={handlePopupClose}>&times;</h1>
                    </div>
                    <SignatureField id="sigField" onSubmit={handleSignature}/>
                </div>
            </div>
            {/***************************************************************/}
            <Footer id="footer"/>
        </div>
    )
}

export default DeliveryForm;