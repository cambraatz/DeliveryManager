/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/9/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header/Header.jsx';
import Popup from './Popup/Popup.jsx';
import Footer from './Footer/Footer.jsx';
import { scrapeDate, 
    renderDate, 
    renderTime, 
    scrapeTime, 
    getDate, 
    getTime, 
    translateDate,   
    SUCCESS_WAIT,
    FAIL_WAIT} from '../scripts/helperFunctions.jsx';
//import Logout from '../scripts/Logout.jsx';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner.jsx';
import MenuWindow from './MenuWindow/MenuWindow.jsx';

import { clearDeliveryForms, updateDeliveryForms } from '../utils/api/deliveries.js';
import { Logout } from '../utils/api/sessions.js';
import { validateDeliveryUpdate } from '../utils/validation/validateForms.js';

import { usePopup } from '../hooks/usePopup.js';
import { useAppContext } from '../hooks/useAppContext.js';

const API_URL = import.meta.env.VITE_API_URL;

const initializeDelivery = (delivery_in_loc) => {
    // pull dlvdtime if dlvd, else set to current...
    const currTime = getTime();
    const initDeliveryTime = renderTime(delivery_in_loc?.DLVDTIME) || currTime;

    // pull dlvddate if dlvd, else set to current...
    const currDate = getDate();
    const initDeliveryDate = delivery_in_loc?.DLVDDATE
        ? translateDate(delivery_in_loc.DLVDDATE)
        : currDate;

    // 1) pull dlvdpcs if dlvd, 2) pull ttlpcs (expected) if undlvd...
    // fallback to null when no delivery (error)...
    const initDeliveryPieces = delivery_in_loc 
        ? (delivery_in_loc.DLVDPCS || delivery_in_loc.TTLPCS)
        : null;

    // define delivery object...
    const deliveryState = {
        MFSTKEY: delivery_in_loc?.MFSTKEY || null,
        STATUS: delivery_in_loc?.STATUS || "1", // Default status to "1" if not present
        LASTUPDATE: delivery_in_loc?.LASTUPDATE || null,
        MFSTNUMBER: delivery_in_loc?.MFSTNUMBER || null,
        POWERUNIT: delivery_in_loc?.POWERUNIT || null,
        STOP: delivery_in_loc?.STOP || null,
        MFSTDATE: delivery_in_loc?.MFSTDATE || null,
        PRONUMBER: delivery_in_loc?.PRONUMBER || null,
        PRODATE: delivery_in_loc?.PRODATE || null,
        SHIPNAME: delivery_in_loc?.SHIPNAME || null,
        CONSNAME: delivery_in_loc?.CONSNAME || null,
        CONSADD1: delivery_in_loc?.CONSADD1 || null,
        CONSADD2: delivery_in_loc?.CONSADD2 || null,
        CONSCITY: delivery_in_loc?.CONSCITY || null,
        CONSSTATE: delivery_in_loc?.CONSSTATE || null,
        CONSZIP: delivery_in_loc?.CONSZIP || null,
        TTLPCS: delivery_in_loc?.TTLPCS || null,
        TTLYDS: delivery_in_loc?.TTLYDS || null,
        TTLWGT: delivery_in_loc?.TTLWGT || null,
        DLVDDATE: scrapeDate(initDeliveryDate),
        DLVDTIME: scrapeTime(initDeliveryTime),
        DLVDPCS: initDeliveryPieces,
        DLVDSIGN: delivery_in_loc?.DLVDSIGN || null,
        DLVDNOTE: delivery_in_loc?.DLVDNOTE || null,
        DLVDIMGFILELOCN: delivery_in_loc?.DLVDIMGFILELOCN || null,
        DLVDIMGFILESIGN: delivery_in_loc?.DLVDIMGFILESIGN || null
    };

    // define formDate object...
    const formDataState = {
        deliveryDate: initDeliveryDate,
        deliveryTime: initDeliveryTime, // Ensure time is rendered for display
        deliveredPieces: initDeliveryPieces,
        deliveryConsignee: delivery_in_loc?.CONSNAME || '',
        deliveryNotes: delivery_in_loc?.DLVDNOTE || "",
        deliveryImagePath: delivery_in_loc?.DLVDIMGFILELOCN || null,
        deliverySignaturePath: delivery_in_loc?.DLVDIMGFILESIGN || null,
        deliverySign: delivery_in_loc?.DLVDSIGN || ""
    };

    return {
        initDelivery: deliveryState,
        initFormData: formDataState,
        initImgLoc: delivery_in_loc?.DLVDIMGFILELOCN || null,
        initImgSign: delivery_in_loc?.DLVDIMGFILESIGN || null,
    };
}

/*////////////////////////////////////////////////////////////////////////////////////

DeliveryForm() - User Manipulation of Delivery Records

/*////////////////////////////////////////////////////////////////////////////////////

const DeliveryForm = () => {
    const {
        loading, setLoading, // [bool] global app loading state
        session // [obj] credentials for session
    } = useAppContext();
    const { 
        popupType, openPopup, closePopup,
        popupVisible, setVisible,
        successPopup, failPopup 
    } = usePopup();

    /* Page rendering, navigation, globals and state initialization... */

    // site state & location processing functions...  
    const location = useLocation();
    const navigate = useNavigate();

    let DELIVERY = location.state ? location.state.delivery : null;
    let DELIVERIES = DELIVERY && location.state.deliveries ? location.state.deliveries : [DELIVERY];

    const {
        initDelivery,
        initFormData,
        initImgLoc,
        initImgSign
    } = initializeDelivery(DELIVERY);

    const [delivery,setDelivery] = useState(initDelivery);
    const [formData,setFormData] = useState(initFormData);
    const [images,setImages] = useState({
        Signature: null,
        Location: null,
    });

    const [showSignatureThumbnail, setShowSignatureThumbnail] = useState(false);
    const [showLocationThumbnail, setShowLocationThumbnail] = useState(false);

    // pre-render + on-refresh behavior...
    useEffect(() => {
        setLoading(true);
        //if (!session || !session.username || !session.company || !session.valid) {
        if (!session || !session.username || session.company === "" || !session.valid) {
            Logout();
            return;
        } else if (!DELIVERY) {
            Logout(session.id);
            return;
        }

        // pre-render initialization...
        initializeRender();

        setLoading(false);
        
        // uncomment to force popup visible...
        //openPopup("deliveries_update_fail");
        //setVisible(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, DELIVERY, initImgLoc, initImgSign]);

    /* Page rendering helper functions... */

    // dynamically render resources when present, hide when not...
    async function initializeRender() {
        // hide thumbnail when no image URL is in state...
        if (!initImgLoc) {
            //document.getElementById('img_location').style.display = "none";
            //document.getElementById('locCapture').style.display = "flex";
            setShowLocationThumbnail(false);
            //setLocImageFail(false);
        } else {
            // attempt to retrieve image URL from file path...
            try {
                const location_img = await retrieveImage(initImgLoc);
                if (location_img) {
                    // store image URL in state...
                    setImages((prevImages) => ({...prevImages, Location: location_img}));
                    //setDelivery((prevDelivery) => ({...prevDelivery, DLVDIMGFILELOCN: initImgLoc}));
                    setShowLocationThumbnail(true);
                    //setLocImageFail(false);
                } else {
                    setShowLocationThumbnail(false);
                    //setLocImageFail(true);
                }
            } catch (error) {
                console.error("Failed to retrieve location image:", error);
                setShowLocationThumbnail(false);
                //setLocImageFail(true);
            }
            setDelivery((prevDelivery) => ({...prevDelivery, DLVDIMGFILELOCN: initImgLoc}));
        }
        // hide thumbnail when no image URL is in state...
        if (!initImgSign) {
            //document.getElementById('img_signature').style.display = "none";
            //document.getElementById('sigCapture').style.display = "flex";
            setShowSignatureThumbnail(false);
            //setSigImageFail(false);

        } else {
            // attempt to retrieve image URL from file path...
            try {
                const signature_img = await retrieveImage(initImgSign);
                if (signature_img) {
                    // store image URL in state...
                    setImages((prevImages) => ({...prevImages, Signature: signature_img}));
                    //setDelivery((prevDelivery) => ({...prevDelivery, DLVDIMGFILESIGN: initImgSign}));
                    setShowSignatureThumbnail(true);
                    //setSigImageFail(false);
                } else {
                    setShowSignatureThumbnail(false); 
                    //setSigImageFail(true);
                }
            } catch (error) {
                console.error("Failed to retrieve signature image", error);
                setShowSignatureThumbnail(false); 
                //setSigImageFail(true);
            }
            setDelivery((prevDelivery) => ({...prevDelivery, DLVDIMGFILESIGN: initImgSign}));
        }

        // hide undeliver button if not delivered...
        if(DELIVERY.STATUS != 1) {
            document.getElementById('undeliver').style.display = "none";
            document.getElementById('button_div').style.justifyContent = "space-around";
            document.getElementById('button_div').style.padding = "0 10%";
        }
    }

    /* State management functions... */

    // handle delivery form changes + conditionally render assets...
    const handleChange = (e) => {
        clearErrorStyling();
        let val = e.target.value;
        const element = document.getElementById(e.target.id);
        switch (e.target.id) {
            case 'dlvddate':
                // reset input field styling on change...
                if (element.classList.contains("invalid_input")){
                    element.classList.remove("invalid_input");
                }
                setFormData({...formData, deliveryDate: renderDate(val)});
                setDelivery({...delivery, DLVDDATE: scrapeDate(val)});
                break;
            case 'dlvdtime':
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
                    setShowLocationThumbnail(true);
                }
                // render image thumbnail...
                //document.getElementById("img_location").style.display = "flex";
                //document.getElementById("locCapture").style.display = "none";
                break;
            default:
                break;
        }
    };

    /* API requests + functions... */

    async function clearDeliveries(navigateData) {
        const responses = await clearDeliveryForms(session.username, DELIVERIES);

        // catch unauth...
        const unauthError = responses.some(response => (response.status === 401 || response.status === 403));
        if (unauthError) {
            failPopup("Unauthorized attempt to clear delivery.");
            setTimeout(() => {
                Logout(session.id);
            }, FAIL_WAIT)
            return;
        }
        // catch errors on any responses...
        const httpErrors = responses.filter(response => !response.ok);
        if (httpErrors.length > 0) {
            failPopup(`Clearing manifests failed on delivery.`);
            return;
        }

        // set popup and navigate back...
        successPopup("deliveries_clear_success");
        setTimeout(() => {
            navigate(`/deliveries`, { state: navigateData });
        }, SUCCESS_WAIT)
    }

    const [inputErrors, setInputErrors] = useState({
        dlvddate: "",
        dlvdtime: "",
        dlvdpcs: ""
    });

    const clearErrorStyling = () => {
        setInputErrors({
            dlvddate: "",
            dlvdtime: "",
            dlvdpcs: ""
        });
    };

    // handle updating existing delivery records when changed...
    async function updateDeliveries(navigateData) {
        const { isValid, errors, message } = validateDeliveryUpdate(formData);
        if (!isValid) {
            console.error("Input validation error:", message);
            setInputErrors(errors);
            return;
        }

        const responses = await updateDeliveryForms(session.username, delivery, formData, DELIVERIES);
        
        // catch unauth...
        const unauthError = responses.some(response => (response.status === 401 || response.status === 403));
        if (unauthError) {
            failPopup("Unauthorized attempt to update delivery.");
            setTimeout(() => {
                Logout(session.id);
            }, FAIL_WAIT)
            return;
        }
        // catch errors on any responses...
        const httpErrors = responses.filter(response => !response.ok);
        if (httpErrors.length > 0) {
            failPopup(`Updating manifests failed on delivery.`);
            return;
        }

        // set popup and navigate back...
        successPopup("deliveries_update_success",SUCCESS_WAIT);
        setTimeout(() => {
            navigate(`/deliveries`, { state: navigateData });
        }, SUCCESS_WAIT)
    }

    // helper function to update delivery + return to previous page...
    async function handleSubmit(e) {
        // package delivery/driver information
        const deliveryData = {
            delivery: {
                MFSTDATE: session.mfstdate,
                POWERUNIT: session.powerunit
            },
            driver: {
                USERNAME: session.username,
                POWERUNIT: session.powerunit
            },
            //header: header,
            company: session.company,
            valid: true
        };

        if(e.target.id === "undeliver"){
            await clearDeliveries(deliveryData);
        }
        else{
            //console.log("Calling handleUpdate on deliveryData: ", deliveryData);
            //await handleUpdate(deliveryData);
            await updateDeliveries(deliveryData);
        }        
    }

    // process signature, save to state, and render thumbnail...
    async function handleSignature(image) {
        const url = URL.createObjectURL(image);
        setImages({...images, Signature: url});
        setShowSignatureThumbnail(true);
        //document.getElementById("sigCapture").style.display = "none";

        // is this necessary?
        setFormData({
            ...formData,
            deliverySignaturePath: "manual signature"
        });

        setDelivery({
            ...delivery,
            DLVDIMGFILESIGN: image
        });

        //document.getElementById("img_signature").style.display = "flex";
        //handlePopupClose();
    }

    // fetch image from server using stored file path string...
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

            // catch unauth...
            if (response.status === 401 || response.status === 403) {
                failPopup("Unauthorized attempt to clear delivery.");
                setTimeout(() => {
                    Logout(session.id);
                }, FAIL_WAIT)
                return;
            }

            /*if (response.status === 401 || response.status == 403) {
                console.error('Error retrieving image: Status ', response.status);
                //Logout();
            }*/

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

    // resize photo prior to uploading......
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

    // render template...
    return (
        <div id="webpage">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                <Header
                    company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                    title="Delivery Manager"
                    subtitle="Delivery Update"
                    currUser={session.username}
                    logoutButton={true}
                    root={false}
                />
                <MenuWindow
                    contentType="delivery_update"
                    prompt={null} // null for stop/pro/key header...
                    formData={formData}
                    inputErrors={inputErrors}
                    stopNum={delivery.STOP.toString()}

                    proNum={delivery.PRONUMBER}
                    mfstKey={delivery.MFSTKEY}
                    handleSubmit={handleSubmit}
                    handleChange={handleChange}
                    deliveries={DELIVERIES}
                    images={images}
                    handleSignature={handleSignature}

                    showSignatureThumbnail={showSignatureThumbnail}
                    showLocationThumbnail={showLocationThumbnail}
                    //sigImageFail={sigImageFail}
                    //locImageFail={locImageFail}
                />

                <Footer className="menu_window_footer"/>
                </>
            )}
            {popupVisible && (
                <Popup 
                    popupType={popupType}
                    isVisible={popupVisible}
                />
            )}
        </div>
    )
}

export default DeliveryForm;