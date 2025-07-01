/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/9/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header.jsx';
import Popup from '../Popup.jsx';
import Footer from '../Footer.jsx';
import SignatureField from '../SignatureField.jsx';
import ImageUploadLogo from '../../assets/add_image.svg';
import SignUploadLogo from '../../assets/add_sign.svg';
import { scrapeDate, 
    renderDate, 
    renderTime, 
    scrapeTime, 
    getDate, 
    getTime, 
    translateDate,  
    showFailFlag, 
    SUCCESS_WAIT,
    FAIL_WAIT} from '../../Scripts/helperFunctions.jsx';
import Logout from '../../Scripts/Logout.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';

import './DeliveryForm.css';

const API_URL = import.meta.env.VITE_API_URL;

/*////////////////////////////////////////////////////////////////////////////////////

DeliveryForm() - User Manipulation of Delivery Records

//////////////////////////////////////////////////////////////////////////////////////

BASIC STRUCTURE:
// initialize rendered page...
    initialize date, navigation
    in-depth processing + handling of location state variables
    defining delivery, form, images and header states for rendering
    useEffect() => 
        ensure token and navigation to page are valid
        if (!valid):
            logout + return to login page
        else:
            proceed to initialize page rendering

// page rendering helper functions...
    initializeRender() =>
        dynamically render images + input fields when applicable
    collapseHeader() => 
        open/close collapsible header

// state management functions...
    handleChange() =>
        handle delivery form changes + conditionally render assets

// API requests + functions...
    retrieveImage() =>
        fetch image from server using stored file path string
    resizePhoto() => *inactive
        resize photo prior to uploading
    clearDelivery() =>
        reset delivery information to default (undelivered)
    handleUpdate() =>
        handle updating existing delivery records when changed
    handleSubmit() =>
        helper function to update delivery + return to previous page
    handleReturn() =>
        return to previous page after doing nothing
    handleSignature() =>
        process signature, save to state, and render thumbnail
    signatureToggle() =>
    handlePopupClose() =>
        toggle signature capture popup visibility
    handleImageClick() =>
        establish link between image clicks + hidden file input

*/////////////////////////////////////////////////////////////////////////////////////

const DeliveryForm = () => {
    /* Page rendering, navigation, globals and state initialization... */

    // date and time data and processing functions...
    const currDate = getDate();
    const currTime = getTime();

    // site state & location processing functions...  
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false); // NOTE: THIS MIGHT NOT BE NEEDED, NO API CALLS MADE TO RENDER?
    // MAYBE WRAP ALL API CALLS FOR IMAGES INSIDE HERE

    // simplify access to location.state...
    let DELIVERY = location.state ? location.state.delivery : null;
    let DRIVER = location.state ? location.state.driver : null;
    let COMPANY = location.state ? location.state.company : null;
    let HEADER = location.state ? location.state.header : null;

    let DELIVERIES = location.state && location.state.deliveries ? location.state.deliveries : [DELIVERY];

    // determine image render permutation...
    let img_loc = DELIVERY ? DELIVERY["DLVDIMGFILELOCN"] : null;
    let img_sign = DELIVERY ? DELIVERY["DLVDIMGFILESIGN"] : null;

    // package driver credentials to pass to next page...
    const driverCredentials = {
        USERNAME: DRIVER ? DRIVER.USERNAME : null,
        POWERUNIT: DRIVER ? DRIVER.POWERUNIT : null,
    }

    // stash current user in case driver changes...
    const currUser = driverCredentials.USERNAME;

    // package update data to pass to next page... 
    const updateData = {
        MFSTDATE: DELIVERY ? DELIVERY.MFSTDATE : null,
        POWERUNIT: DELIVERY ? DELIVERY.POWERUNIT : null,
    };

    // handle both existing deliveries and new ones...
    let delivery_time = DELIVERY ? DELIVERY.DLVDTIME : null;
    if (delivery_time === null || delivery_time === ""){
        delivery_time = currTime
    } else {
        delivery_time = renderTime(delivery_time)
    }

    // handle both existing deliveries and new ones...
    let delivery_date = DELIVERY ? DELIVERY.DLVDDATE : null;
    if (delivery_date === null || delivery_date === ""){
        delivery_date = currDate
    } else {
        delivery_date = translateDate(delivery_date)
    }

    // handle both existing deliveries and new ones...
    let delivery_pieces = DELIVERY ? DELIVERY.DLVDPCS : null;
    if (DELIVERY && (delivery_pieces === null || delivery_pieces === 0)){
        delivery_pieces = DELIVERY.TTLPCS;
    }

    // maintain state values to update delivery entry...
    const [delivery, setDelivery] = useState({
        MFSTKEY: DELIVERY ? DELIVERY.MFSTKEY : null,
        STATUS: "1",
        LASTUPDATE: DELIVERY ? DELIVERY.LASTUPDATE : null,
        MFSTNUMBER: DELIVERY ? DELIVERY.MFSTNUMBER : null,
        POWERUNIT: DELIVERY ? DELIVERY.POWERUNIT : null,
        STOP: DELIVERY ? DELIVERY.STOP : null,
        MFSTDATE: DELIVERY ? DELIVERY.MFSTDATE : null,
        PRONUMBER: DELIVERY ? DELIVERY.PRONUMBER : null,
        PRODATE: DELIVERY ? DELIVERY.PRODATE : null,
        SHIPNAME: DELIVERY ? DELIVERY.SHIPNAME : null,
        CONSNAME: DELIVERY ? DELIVERY.CONSNAME : null,
        CONSADD1: DELIVERY ? DELIVERY.CONSADD1 : null,
        CONSADD2: DELIVERY ? DELIVERY.CONSADD2 : null,
        CONSCITY: DELIVERY ? DELIVERY.CONSCITY : null,
        CONSSTATE: DELIVERY ? DELIVERY.CONSSTATE : null,
        CONSZIP: DELIVERY ? DELIVERY.CONSZIP : null,
        TTLPCS: DELIVERY ? DELIVERY.TTLPCS : null,
        TTLYDS: DELIVERY ? DELIVERY.TTLYDS : null,
        TTLWGT: DELIVERY ? DELIVERY.TTLWGT : null,
        DLVDDATE: DELIVERY && DELIVERY.DLVDDATE != null ? DELIVERY.DLVDDATE : scrapeDate(currDate),
        DLVDTIME: DELIVERY && DELIVERY.DLVDTIME != null ? DELIVERY.DLVDTIME : scrapeTime(currTime),
        DLVDPCS: delivery_pieces,
        DLVDSIGN: DELIVERY ? DELIVERY.DLVDSIGN : null,
        DLVDNOTE: DELIVERY ? DELIVERY.DLVDNOTE : null,
        DLVDIMGFILELOCN: DELIVERY ? DELIVERY.DLVDIMGFILELOCN : null,
        DLVDIMGFILESIGN: DELIVERY ? DELIVERY.DLVDIMGFILESIGN : null
    });

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

    // store company name when present, else replace with placeholder...
    //const company = COMPANY ? COMPANY : "No company active";
    // rendered company state...
    const [company, setCompany] = useState(location.state ? location.state.company : "");

    // header toggle condition state...
    const [header,setHeader] = useState(HEADER);

    // initialize image states...
    const [images,setImages] = useState({
        Signature: null,
        Location: null,
    });

    // set popup status state...
    const [popup, setPopup] = useState();

    // pre-render + on-refresh behavior...
    useEffect(() => {
        let username = sessionStorage.getItem("username");
        let activeCompany = sessionStorage.getItem("company");
        if (!username || !activeCompany) {
            Logout();
        }
        //console.log(activeCompany);
        setCompany(activeCompany);

        // pre-render initialization...
        initializeRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])

    /* Page rendering helper functions... */

    /*/////////////////////////////////////////////////////////////////
    // dynamically render resources when present, hide when not...
    [void] : initializeRender() {
        if (!location image file path):
            prevent thumbnail image from rendering
        else:
            retrieve image from server using file path + generate URL
            set image URL to image state
        
        repeat same process above for delivery signature image

        if delivery is undelivered, hide 'undeliver' button
    }
    *//////////////////////////////////////////////////////////////////

    async function initializeRender() {
        // hide thumbnail when no image URL is in state...
        if (!img_loc) {
            document.getElementById('img_Div_Loc').style.display = "none";
            document.getElementById('locCapture').style.display = "flex";
        } else {
            // attempt to retrieve image URL from file path...
            try {
                const location_img = await retrieveImage(img_loc);
                if (location_img) {
                    // store image URL in state...
                    setImages((prevImages) => ({...prevImages, Location: location_img}));
                }
            } catch (error) {
                console.error("Failed to retrieve location image:", error);
            }
        }
        // hide thumbnail when no image URL is in state...
        if (!img_sign) {
            document.getElementById('img_Div_Sign').style.display = "none";
            document.getElementById('sigCapture').style.display = "flex";
        } else {
            // attempt to retrieve image URL from file path...
            try {
                const signature_img = await retrieveImage(img_sign);
                if (signature_img) {
                    // store image URL in state...
                    setImages((prevImages) => ({...prevImages, Signature: signature_img}));
                }
            } catch (error) {
                console.error("Failed to retrieve signature image", error);
            }
        }

        // setLoading(false);
        // hide undeliver button if not delivered...
        if(DELIVERY.STATUS != 1) {
            document.getElementById('undeliver').style.display = "none";
            document.getElementById('button_div').style.justifyContent = "space-around";
            document.getElementById('button_div').style.padding = "0 10%";
        }

        //setLoading(false);
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
            setHeader(prev => (prev === "open" ? "close" : "open"));
        }
    }

    /*/////////////////////////////////////////////////////////////////
    [void] : openPopup() {
        make popup window visible on screen
        enable on click behavior
    }
    *//////////////////////////////////////////////////////////////////

    const openPopup = () => {
        document.getElementById("popupAddWindow").style.visibility = "visible";
        document.getElementById("popupAddWindow").style.opacity = 1;
        document.getElementById("popupAddWindow").style.pointerEvents = "auto";  
    };

    /*/////////////////////////////////////////////////////////////////
    [void] : closePopup() {
        self explanatory closing of "popupLoginWindow"
        setStatus("") and setMessage(null) - reset state data
    }
    *//////////////////////////////////////////////////////////////////

    const closePopup = () => {
        document.getElementById("popupAddWindow").style.visibility = "hidden";
        document.getElementById("popupAddWindow").style.opacity = 0;
        document.getElementById("popupAddWindow").style.pointerEvents = "none";
    };

    /* State management functions... */

    /*/////////////////////////////////////////////////////////////////
    // handle delivery form changes + conditionally render assets...
    [void] : handleChange() {
        cache target ID in local variable
        identify and handle the respective input field changes
        remove error styling for pertinent fields (when present)
        store updated data in respective states
        'dlvdimagefilesign' store file path, rendering handled elsewhere
        'dlvdimage' store file path, convert img to blob to URL + render
    }
    *//////////////////////////////////////////////////////////////////

    const handleChange = (e) => {
        let val = e.target.value;
        const element = document.getElementById(e.target.id);
        switch (e.target.id) {
            case 'dlvdate':
                // reset input field styling on change...
                if (element.classList.contains("invalid_input")){
                    element.classList.remove("invalid_input");
                }
                setFormData({...formData, deliveryDate: renderDate(val)});
                setDelivery({...delivery, DLVDDATE: scrapeDate(val)});
                break;
            case 'dlvtime':
                // reset input field styling on change...
                if (element.classList.contains("invalid_input")){
                    element.classList.remove("invalid_input");
                }
                setFormData({...formData, deliveryTime: val});
                setDelivery({...delivery, DLVDTIME: scrapeTime(val)});
                break;
            case 'dlvdpcs':
                // reset input field styling on change...
                if (element.classList.contains("invalid_input")){
                    element.classList.remove("invalid_input");
                }
                setFormData({...formData, deliveredPieces: val});
                setDelivery({...delivery, DLVDPCS: val});
                break;
            case 'dlvdsign':
                setFormData({...formData, deliverySign: val});
                setDelivery({...delivery, DLVDSIGN: val});
                break;
            case 'dlvdnote':
                setFormData({...formData, deliveryNotes: val});
                setDelivery({...delivery, DLVDNOTE: val});
                break;
            case 'dlvdimagefilesign':
                setFormData({...formData, deliverySignaturePath: val});
                setDelivery({...delivery, DLVDIMGFILESIGN: e.target.files[0]});
                break;
            case 'dlvdimage': case 'locationThumbnail':
                setFormData({...formData, deliveryImagePath: val});
                setDelivery({...delivery, DLVDIMGFILELOCN: e.target.files[0]});

                // resize (if needed) and convert image file to URL...
                if (e.target.files[0] && e.target.files[0].type.startsWith('image/')) {
                    /*resizePhoto(e.target.files[0],300,300, (resizedImageData) => {
                        setDeliveryLocation(resizedImageData);
                    });*/
                    const url = URL.createObjectURL(e.target.files[0]);
                    setImages({...images, Location: url});
                }
                // render image thumbnail...
                document.getElementById("img_Div_Loc").style.display = "flex";
                document.getElementById("locCapture").style.display = "none";
                break;
            default:
                break;
        }
    };

    /* API requests + functions... */

    /*/////////////////////////////////////////////////////////////////
    // fetch image from server using stored file path string...
    [URL] : retrieveImage() {
        verify valid token credentials
        fetch image from server using file path
        catch failed requests
        convert response image to blob object
        convert blob object to renderable image URL
    }
    *//////////////////////////////////////////////////////////////////
    
    // pull image from server...
    async function retrieveImage(image) {
        try {
            // fetch image from server using stored file paths...
            const response = await fetch(API_URL + "v1/deliveries/image/" + image, {
                method: 'GET',
                headers: {
                    //"Authorization": `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.status === 401 || response.status == 403) {
                console.error('Error retrieving image: Status ', response.status);
                //Logout();
            }

            if(!response.ok) { throw new Error('Failed to fetch image...'); }

            // convert image response to blob + blob to URL...
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error retrieving image:', error);
            //Logout();
            return;
        }
    }

    /*/////////////////////////////////////////////////////////////////
    // resize photo prior to uploading......
    [void] : resizePhoto() {
        establish file reader
        generate image object
        place image on canvas and resize
        save resized canvas as image URL
        read image file URL and return
    }
    *//////////////////////////////////////////////////////////////////

    // eslint-disable-next-line
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
    }

    async function clearDelivery(navigateData) {
        // define common data shared between selected deliveries...
        const sharedEntries = {
            USERNAME: currUser,
            LASTUPDATE: currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00",
            STATUS: "0",
            DLVDDATE: "",
            DLVDTIME: "",
            DLVDPCS: -1,
            DLVDSIGN: "",
            DLVDNOTE: "",
            DLVDIMGFILELOCN: null,
            DLVDIMGFILESIGN: null,
            location_string: "",
            signature_string: ""
        };

        // iterate list of deliveries and initialize reverted delivery objects...
        let deliveryList = DELIVERIES.map((currDelivery) => {
            // initialize fresh FormData object for handling file upload...
            let deliveryData = new FormData();

            // iterate delivery entries to build FormData objects...
            for (const [key,value] of Object.entries(currDelivery)) {
                if (key in sharedEntries) {
                    deliveryData.append(key, sharedEntries[key]);
                // standard delivery data processing...
                } else {
                    deliveryData.append(key, value);
                }
            }

            return deliveryData;
        });

        
        let lastResponse;
        //setLoading(true);
        for (const deliveryData of deliveryList) {
            const mfstKey = deliveryData.get("MFSTKEY");
            if (!mfstKey) {
                console.error(`Updating manifests failed to pull MFSTKEY on delivery ${deliveryData.MFSTNUMBER}.`);
            }

            lastResponse = await fetch(API_URL + "v1/deliveries/" + mfstKey, {
                body: deliveryData,
                method: "PUT",
                credentials: 'include'
            });

            if (lastResponse.status === 401 || lastResponse.status == 403) {
                Logout();
            }

            if (!lastResponse.ok) {
                console.error(`Updating manifests failed on delivery ${deliveryData.MFSTNUMBER}.`);
                break;
            }
        }

        if (lastResponse.ok) {
            //setLoading(false);
            setPopup("Success");
            openPopup();
            setTimeout(() => {
                setLoading(true);
                closePopup();
                navigate(`/deliveries`, { state: navigateData });
            }, SUCCESS_WAIT);
        } else {
            console.error("update delivery failed");
                setPopup("Fail");
                openPopup();
                setTimeout(() => {
                    closePopup();
                }, FAIL_WAIT)
        }

        return lastResponse;
    }

    /*/////////////////////////////////////////////////////////////////
    // handle updating existing delivery records when changed...
    [string] : handleUpdate() {
        cache date, time and pieces input fields for reference
        determine input field violation code status for flagging
        conditionally render styling and flags for errant inputs
        validate user tokens and refresh as needed

        package delivery state information into object for request body
        if image state is a string (not an image), append file path to object
        nullify image state in lieu of file path image

        nullify any empty fields in lieu of empty quotations
        set last update to current date/time
        attempt to update manifest * error handling?? *

        return response string
    }
    *//////////////////////////////////////////////////////////////////

    async function handleUpdate(navigateData) {
        // initialize mandatory fields...
        const date_field = document.getElementById("dlvdate");
        const time_field = document.getElementById("dlvtime");
        const piece_field = document.getElementById("dlvdpcs");
        //const note_field = document.getElementById("dlvdnote");

        // map empty field cases to messages...
        let code = 0;
        let elementID;
        const alerts = {
            1: "Date is required!", 
            10: "Time is required!", // likely redundant...
            11: "Date and Time are both required!", //redundant...
            100: "Pieces Delivered is required!",
            101: "Date and Pieces Delivered are both required!",
            110: "Time and Pieces Delivered are both required!", // redundant...
            111: "Date, Time and Pieces Delivered are all required!"
        }
        // flag empty username...
        if (!date_field.value || isNaN(new Date(date_field.value).getTime())){
            date_field.classList.add("invalid_input");
            elementID = "ff_admin_df_d";
            code += 1;
        }
        // flag invalid time format (implicitly not null)...
        if (!(time_field.value)) {
            /* add some time boundary threshold? */
            time_field.classList.add("invalid_input");
            code += 10;
        }
        // flag invalid or empty piece counts...
        if (!(piece_field.value && !isNaN(piece_field.value) &&
                piece_field.value >= piece_field.min && piece_field.value <= piece_field.max)) {
            piece_field.classList.add("invalid_input");
            elementID = "ff_admin_df_pd";
            code += 100;
        } else if (piece_field.disabled) {
            elementID = "ff_admin_df_pd";
            showFailFlag(elementID, "Cannot edit pieces on batch delivery.");
        }

        // catch and alert user to incomplete fields...
        if (code > 0) {
            showFailFlag(elementID, alerts[code]);
            return;
        }

        //setLoading(true);

        // define common data shared between selected deliveries...
        const sharedEntries = {
            USERNAME: currUser,
            LASTUPDATE: currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00", 
            STATUS: "1",
            DLVDDATE: (delivery.DLVDDATE === null || delivery.DLVDDATE === undefined || delivery.DLVDDATE === "") ? scrapeDate(formData.deliveryDate) : delivery.DLVDDATE,
            DLVDTIME: (delivery.DLVDTIME == null || delivery.DLVDTIME === undefined || delivery.DLVDTIME === "") ? scrapeTime(formData.deliveryTime) : delivery.DLVDTIME,
            DLVDSIGN: (delivery.DLVDSIGN == null || delivery.DLVDSIGN === undefined || delivery.DLVDSIGN === "") ? formData.deliverySign : delivery.DLVDSIGN,
            DLVDNOTE: (delivery.DLVDNOTE == null || delivery.DLVDNOTE === undefined || delivery.DLVDNOTE === "") ? formData.deliveryNotes : delivery.DLVDNOTE,
            DLVDPCS: (delivery.DLVDPCS == null || delivery.DLVDPCS === undefined || delivery.DLVDPCS === "") ? formData.deliveredPieces : delivery.DLVDPCS,
        };

        // iterate list of deliveries and initialize delivery updates...
        let deliveryList = DELIVERIES.map((currDelivery) => {
            // initialize fresh FormData object for handling file upload...
            let deliveryData = new FormData();

            // iterate delivery entries to build FormData objects...
            for (const [key,val] of Object.entries(currDelivery)) {
                // handle file/blob processing...
                if (key === "DLVDIMGFILELOCN" || key === "DLVDIMGFILESIGN") {
                    const image = delivery[key];
                    // if file/blob exists, save file path and nullify file upload...
                    if (typeof value === "string") {
                        deliveryData.append(key === "DLVDIMGFILELOCN" ? "location_string" : "signature_string", val);
                        deliveryData.append(key, "");
                    // if image file uploaded, pull file from delivery state...
                    } else if (key === "DLVDIMGFILELOCN" && image instanceof File) {
                        //console.log("New image file upload recieved...");
                        deliveryData.append(key, image);
                        deliveryData.append("location_string", "");
                    // if image blob uploaded, pull blob from delivery state...
                    } else if (key === "DLVDIMGFILESIGN" && image instanceof Blob) {
                        //console.log("New signature file upload recieved...");
                        deliveryData.append(key, image);
                        deliveryData.append("signature_string", "");
                    // else, set to null...
                    } else {
                        deliveryData.append(key, null);
                    }
                // handle delivery pieces (different for each delivery)...
                } else if (key === "DLVDPCS") {
                    if (currDelivery.DLVDPCS === null || currDelivery.DLVDPCS == undefined || currDelivery.DLVDPCS === 0) {
                        deliveryData.append(key, currDelivery.TTLPCS);
                    } else {
                        deliveryData.append(key, currDelivery.DLVDPCS);
                    }
                    
                // handle commonly shared data on batch processing...
                } else if (key in sharedEntries) {
                    deliveryData.append(key, sharedEntries[key]);
                // standard delivery data processing...
                } else {
                    deliveryData.append(key, val);
                }
            }
            return deliveryData;
        });

        //console.log("deliveryList", deliveryList);
        //console.log("formData", formData);
        //console.log("delivery", delivery);

        let lastResponse;
        for (const listItem of deliveryList) {
            const mfstKey = listItem.get("MFSTKEY");
            if (!mfstKey) {
                console.error(`Updating manifests failed to pull MFSTKEY on delivery ${mfstKey}.`);
            }

            lastResponse = await fetch(API_URL + "v1/deliveries/" + mfstKey, {
                body: listItem,
                method: "PUT",
                credentials: 'include'
            })

            if (lastResponse.status === 401 || lastResponse.status == 403) {
                Logout();
            }

            if (!lastResponse.ok) {
                console.error(`Updating manifests failed on delivery ${mfstKey}.`);
                break;
            }
        }     

        if (lastResponse && lastResponse.ok) {
            //const data = await lastResponse.json();
            setPopup("Success");
            openPopup();
            setTimeout(() => {
                setLoading(true);
                closePopup();
                navigate(`/deliveries`, { state: navigateData });
            }, SUCCESS_WAIT)

        } else {
            console.error("Updating delivery failed.");
            setPopup("Fail");
            openPopup();
            setTimeout(() => {
                closePopup();
            }, FAIL_WAIT);
        }
    }

    /*/////////////////////////////////////////////////////////////////
    // helper function to update delivery + return to previous page...
    [void] : handleSubmit(event) {
        initialize response for overwriting
        if (e.target.id === "undeliver"):
            clearDelivery() to default delivery values (except LASTUPDATE)
        else:
            handleUpdate() to update delivery fields in database

        if (response is valid):
            navigate() back to /driverlog (ie: delivery manifest)
    }
    *//////////////////////////////////////////////////////////////////

    async function handleSubmit(e) {
        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials,
            header: header,
            company: COMPANY,
            valid: true
        };

        if(e.target.id === "undeliver"){
            await clearDelivery(deliveryData);
        }
        else{
            //console.log("Calling handleUpdate on deliveryData: ", deliveryData);
            await handleUpdate(deliveryData);
        }        
    }

    /*/////////////////////////////////////////////////////////////////
    // return to previous page after doing nothing...
    [void] : handleReturn() {
        package "deliveryData" to render delivery manifest on return
        navigate() to /driverlog (ie: delivery manifest)
    }
    *//////////////////////////////////////////////////////////////////

    /*const handleReturn = () => {
        // package delivery/driver information
        const deliveryData = {
            delivery: updateData,
            driver: driverCredentials,
            header: header,
            company: COMPANY,
            valid: true
        };
        document.getElementById('Return').style.display = "flex";
        navigate(`/deliveries`, { state: deliveryData });
    };*/

    /*/////////////////////////////////////////////////////////////////
    // process signature, save to state, and render thumbnail...
    [void] : handleSignature() {
        create image URL from image argument + save to state
        hide signature capture prompt/widget

        ** set form data sig path to "manual signature"? **
        store image to delivery state
        render signature thumbnail + close popup

    }
    *//////////////////////////////////////////////////////////////////

    async function handleSignature(image) {
        const url = URL.createObjectURL(image);
        setImages({...images, Signature: url});
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

        document.getElementById("img_Div_Sign").style.display = "flex";
        handlePopupClose();
    }

    /*/////////////////////////////////////////////////////////////////
    // toggle signature capture popup visibility...
    [void] : signatureToggle() + handlePopupClose() {
        make signature capture popup visible 
            OR
        make signature capture popup hidden
    }
    *//////////////////////////////////////////////////////////////////

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

    /*/////////////////////////////////////////////////////////////////
    // establish link between image clicks + hidden file input...
    [void] : handleImageClick() {
        map image onClick behavior to hidden file input field 
    }
    *//////////////////////////////////////////////////////////////////

    // create null react reference...
    const hiddenFileInput = useRef(null);
    const handleImageClick = () => {
        hiddenFileInput.current.click();
    }

    const flagDisabled = (elementID,flagID) => {
        //console.log(`flagging disabled: ${elementID}, ${flagID}`);
        if (document.getElementById(elementID) && document.getElementById(elementID).readOnly) {
            showFailFlag(flagID, elementID === "dlvdpcs" ? "Cannot edit pieces on batch delivery." : "Cannot edit note on batch delivery.");
        }
    }
    
    // render template...
    return (
        <div id="webpage">
            {loading && <LoadingSpinner />}
            {!loading && (
                <>
                <Header
                    company={company}
                    title="Delivery Update"
                    currUser={currUser}
                    header="Full"
                    status=""
                    alt="Provide Delivery Information"
                    MFSTDATE={delivery.MFSTDATE}
                    POWERUNIT={delivery.POWERUNIT}
                    STOP={delivery.STOP.toString()}
                    PRONUMBER={delivery.PRONUMBER}
                    MFSTKEY={delivery.MFSTKEY}
                    toggle={header}
                    onClick={collapseHeader}
                />

                <div id="Delivery_Input_Div">
                    <form id="form_data" onSubmit={handleSubmit}>
                        <div id="datetime_Div">
                            <div className="cont_left input_wrapper">
                                <label>Delivery Date:</label>
                                <input type="date" id="dlvdate" value={formData.deliveryDate} className="input_form" onChange={handleChange} required/>
                                <div className="fail_flag" id="ff_admin_df_d">
                                    <p>Date is required!</p>
                                </div>
                            </div>
                            <div className="cont_right">
                                <label>Delivery Time:</label>
                                <input type="time" id="dlvtime" value={formData.deliveryTime} className="input_form" onChange={handleChange} required/>
                            </div>
                        </div>
                        <div id="pis_Div">
                            <div className="cont_left">
                                <label>Consignee Name:</label>
                                <input type="text" id="dlvcons" value={formData.deliveryConsignee} className="input_form" disabled/>
                            </div>
                            <div className="cont_right input_wrapper" onClick={() => flagDisabled("dlvdpcs","ff_admin_df_pd")}>
                                <label>Pieces Delivered:</label>
                                <input type="number" id="dlvdpcs" value={formData.deliveredPieces} className="input_form" min="0" max="999" onChange={handleChange} readOnly={DELIVERIES.length > 1} required />
                                <div className="fail_flag" id="ff_admin_df_pd">
                                    <p>Pieces Delivered is required!</p>
                                </div>
                            </div>
                        </div>
                        <div id="notes_Div">
                            <div className="cont_full input_wrapper" onClick={() => flagDisabled("dlvdnote","ff_admin_df_dn")}>
                                <label>Delivery Note: </label>
                                <input type="text" id="dlvdnote" value={formData.deliveryNotes} className="input_form" onChange={handleChange} maxLength="30" readOnly={DELIVERIES.length > 1}/>
                                <div className="fail_flag" id="ff_admin_df_dn">
                                    <p>Note is not allowed in batch editing!</p>
                                </div>
                            </div>
                        </div>
                        <div id="img_Div">
                            <div id="img_sig_div">
                                <label>Consignee Signature:</label>
                                <div id="img_Div_Sign">
                                    {images.Signature ? (
                                        <img 
                                            id="signatureThumbnail" 
                                            className="thumbnail" 
                                            src={images.Signature} 
                                            alt="Saved userSignature" 
                                            onClick={signatureToggle}
                                        />
                                    ) : <p className="signatureIMG_error_text">Error loading signature...</p>}
                                </div>
                                <div id="sigCapture" className="file_upload_widget" style={{display: "none"}} onClick={signatureToggle}>
                                    <img id="fileUploadLogo" src={SignUploadLogo} alt="file upload logo" />
                                    <p>Collect a signature</p>
                                </div>
                            </div>
                            <div id="img_loc_div">
                                <label>Delivery Location:</label>
                                <div id="img_Div_Loc">
                                    {images.Location ? (
                                        <img 
                                            id="locationThumbnail" 
                                            className="thumbnail" 
                                            src={images.Location} 
                                            alt="Saved delivery location" 
                                            onClick={handleImageClick}
                                        />
                                    ) : <p className="locationIMG_error_text">Error loading image...</p>}
                                </div>
                                <div id="locCapture" className="file_upload_widget" style={{display: "none"}} onClick={handleImageClick}>
                                    <img id="fileUploadLogo" src={ImageUploadLogo} alt="file upload logo" />
                                    <p>Upload an image</p>
                                </div>
                                <input type="file" accept="image/*" ref={hiddenFileInput} id="dlvdimage" className="input_image" onChange={handleChange} capture="environment" style={{display: "none"}}/>
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
                        {/*<button onClick={handleReturn} type="button">Back To Deliveries</button>*/}
                        <button id="undeliver" onClick={handleSubmit} type="button">Undo Delivery</button>
                        <button id="update" onClick={handleSubmit} type="button">Update Delivery</button>
                    </div>
                </div>

                <Footer id="footer"/>
                </>
            )}
            {/*** POPUP CONTENT - THIS SECTION IS HIDDEN BY DEFAULT ***/}
            <div id="popupSignatureWindow" className="overlay">
                <div className="popupSignature">
                    <div id="popupExit" className="content">
                        <h1 id="close" onClick={handlePopupClose}>&times;</h1>
                    </div>
                    <SignatureField id="sigField" onSubmit={handleSignature}/>
                </div>
            </div>
            <div id="popupAddWindow" className="overlay">
                <div className="popupLogin">
                    <div id="popupAddExit" className="content">
                        <h1 id="close_add" className="popupLoginWindow" onClick={closePopup}>&times;</h1>
                    </div>
                    <Popup 
                        message={popup}
                        date={null}
                        powerunit={null}
                        closePopup={closePopup}
                        handleDeliveryChange={null}
                        handleUpdate={handleUpdate}
                        company={company}
                    />
                </div>
            </div>
        </div>
    )
}

export default DeliveryForm;