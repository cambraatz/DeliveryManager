import "./MenuWindow.css";
import PropTypes from 'prop-types';
import /*React,*/ { useRef, useState, useEffect } from 'react';

import Popup from "../Popup/Popup.jsx";
import ImageUploadLogo from '../../assets/add_image.svg';
import SignUploadLogo from '../../assets/add_sign.svg';
import { showFailFlag } from '../../scripts/helperFunctions.jsx';

import { usePopup } from '../../hooks/usePopup.js';

const handleKeyPress = (reference) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && reference.current) {
            e.preventDefault();
            reference.current.click();
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    }
}

const MenuWindowContent = ({ 
    contentType, 
    formData, 
    inputErrors,
    handleSubmit,
    handleChange,
    deliveries,
    images,
    handleSignature,
    showSignatureThumbnail,
    showLocationThumbnail,
    //sigImageFail,
    //locImageFail,
 }) => {
    const confirmDeliveryRef = useRef(null);
    useEffect(() => {
       const cleanup = handleKeyPress(confirmDeliveryRef);
       return cleanup;
    }, [confirmDeliveryRef]);

    // create null react reference...
    const hiddenFileInput = useRef(null);
    const handleImageClick = () => {
        hiddenFileInput.current.click();
    }

    const addContinueButtonRef = useRef(null);
    useEffect(() => {
        handleKeyPress(addContinueButtonRef);
    }, [addContinueButtonRef]);

    // custom hooks...
    const { popupType, popupVisible, openPopup, closePopup } = usePopup();

    const [sigImageFail, setSigImageFail] = useState(false);
    const [locImageFail, setLocImageFail] = useState(false);

    const flagDisabled = (elementID,flagID) => {
        //console.log(`flagging disabled: ${elementID}, ${flagID}`);
        if (document.getElementById(elementID) && document.getElementById(elementID).readOnly) {
            showFailFlag(flagID, elementID === "dlvdpcs" ? "Cannot edit pieces on batch delivery." : "Cannot edit note on batch delivery.");
        }
    }

    const handleSignatureUpdate = (signatureIMG) => {
        handleSignature(signatureIMG);
        closePopup();
    }

    const locateFailFlag = (fieldId) => {
        const { dlvddate, dlvdtime, dlvdpcs } = inputErrors;

        // date is only field in error...
        if (fieldId === "dlvddate" && dlvddate && !dlvdtime && !dlvdpcs) {
            console.log('fieldId === "dlvddate"')
            return dlvddate;
        }

        // time error (assumes date is valid)...
        if (fieldId === "dlvdtime" && dlvdtime && !(dlvddate && !dlvdtime && !dlvdpcs) && !dlvdpcs) {
            console.log('fieldId === "dlvdtime"')
            console.log(dlvdtime);
            return dlvdtime;
        }

        // catch all other errors...
        if (fieldId === "dlvdpcs" && dlvdpcs) {
            console.log('fieldId === "dlvdpieces"');
            return dlvdpcs;
        }

        return null;
    };
    
    switch (true) {
        case (contentType.startsWith("delivery_confirm")):
            return (
                <>
                <div className="dm_pd_div">
                    <form id="loginForm">
                        <div className="input_wrapper">
                            <label htmlFor="dlvdate">Delivery Date:</label>
                            <input 
                                type="date"
                                id="dlvddate" // WARNING functional ID
                                value={formData?.deliverydate}
                                className={`input_form ${inputErrors?.mfstdate ? 'invalid_input' : ''}`}
                                onChange={handleChange}
                                aria-invalid={!!inputErrors?.mfstdate}
                                aria-describedby={inputErrors?.mfstdate ? "ff_dm_confirm_date": undefined}
                            />
                            {(inputErrors?.mfstdate && !inputErrors?.powerunit) && (
                                <div className={`aria_fail_flag ${inputErrors?.mfstdate ? 'visible' : ''}`}
                                    id="ff_dm_confirm_date" // WARNING functional ID
                                    role="alert"
                                >
                                    <p>{inputErrors?.mfstdate}</p>
                                </div>
                            )}
                        </div>        
                        <div className="input_wrapper">
                            <label htmlFor="powerunit">Power Unit:</label>
                            <input 
                                type="text"
                                id="powerunit" // WARNING functional ID
                                value={formData?.powerunit}
                                className={`input_form ${inputErrors?.powerunit ? 'invalid_input' : ''}`}
                                onChange={handleChange}
                                aria-invalid={!!inputErrors?.powerunit}
                                aria-describedby={inputErrors?.powerunit ? "ff_dm_confirm_powerunit": undefined}
                            />
                            {inputErrors.powerunit && (
                                <div className={`aria_fail_flag ${inputErrors?.powerunit ? 'visible' : ''}`}
                                    id="ff_dm_confirm_powerunit" // WARNING functional ID
                                    role="alert"
                                >
                                    <p>{inputErrors?.powerunit}</p>
                                </div>
                            )}
                        </div>
                        <button 
                            type="button"
                            id="dm_confirm_button"
                            onClick={handleSubmit}
                            ref={addContinueButtonRef}
                        >Continue</button>
                    </form>
                </div>
                {popupVisible && (
                    <Popup
                        popupType={popupType}
                        isVisible={popupVisible}
                        closePopup={closePopup}
                        //handleSignature={handleSignatureUpdate}
                    />
                )}
                </>
            )
        case (contentType.startsWith("delivery_update")):
            //console.log(`formData: ${formData}`);
            return (
                <>
                <div id="delivery_update_div">
                    <form id="form_data" onSubmit={handleSubmit}>
                        <div id="date_time_div">
                            <div className="cont_left input_wrapper">
                                <label>Delivery Date:</label>
                                <input 
                                    type="date"
                                    id="dlvddate" // WARNING functional ID
                                    value={formData.deliveryDate ?? ''}
                                    className={`input_form ${inputErrors?.dlvddate ? 'invalid_input' : ''}`}
                                    name="dlvddate"
                                    onChange={handleChange}
                                    aria-invalid={!!inputErrors?.dlvddate}
                                    aria-describedby={inputErrors?.dlvddate ? "dm_update_invalid_date" : undefined}
                                    required
                                />
                                {locateFailFlag("dlvddate") && (
                                    <div 
                                        className={`aria_fail_flag aria_in_body ${inputErrors?.dlvddate ? 'visible' : ''}`} 
                                        id="dm_update_invalid_date" // WARNING functional ID
                                        role="alert"
                                    >
                                        <p>{inputErrors?.dlvddate}</p>
                                    </div>
                                )}
                            </div>
                            <div className="cont_right input_wrapper">
                                <label>Delivery Time:</label>
                                <input 
                                    type="time"
                                    id="dlvdtime" // WARNING functional ID
                                    value={formData.deliveryTime ?? ''}
                                    className={`input_form ${inputErrors?.dlvdtime ? 'invalid_input' : ''}`}
                                    onChange={handleChange}
                                    aria-invalid={!!inputErrors?.dlvdtime}
                                    aria-describedby={inputErrors?.dlvdtime ? "dm_update_invalid_time" : undefined}
                                    required
                                />
                                {locateFailFlag("dlvdtime") && (
                                    <div className={`aria_fail_flag aria_in_body ${inputErrors?.dlvdtime ? 'visible' : ''}`} 
                                        id="dm_update_invalid_time" // WARNING functional ID
                                        role="alert">
                                        <p>{inputErrors?.dlvdtime}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div id="consign_pieces_div">
                            <div className="cont_left">
                                <label>Consignee Name:</label>
                                <input 
                                    type="text" 
                                    id="dlvcons" // WARNING functional ID
                                    value={formData.deliveryConsignee} 
                                    className="input_form" 
                                    disabled
                                />
                            </div>
                            <div className="cont_right input_wrapper" onClick={() => flagDisabled("dlvdpcs","ff_admin_df_pd")}>
                                <label>Pieces Delivered:</label>
                                <input 
                                    type="number"
                                    id="dlvdpcs" // WARNING functional ID
                                    value={formData.deliveredPieces ?? ''}
                                    className={`input_form ${inputErrors?.dlvdpcs ? 'invalid_input' : ''}`}
                                    min="0"
                                    max="999"
                                    onChange={handleChange}
                                    aria-invalid={!!inputErrors?.dlvdpcs}
                                    aria-describedby={inputErrors?.dlvdpcs ? "dm_update_invalid_pieces" : undefined}
                                    readOnly={deliveries.length > 1}
                                    required 
                                />
                                {locateFailFlag("dlvdpcs") && (
                                    <div className={`aria_fail_flag aria_in_body ${inputErrors?.dlvdpcs ? 'visible' : ''}`} 
                                        id="dm_update_invalid_pieces" // WARNING functional ID
                                        role="alert">
                                        <p>{inputErrors?.dlvdpcs}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div id="note_div">
                            <div className="cont_full input_wrapper" onClick={() => flagDisabled("dlvdnote","ff_admin_df_dn")}>
                                <label>Delivery Note: </label>
                                <input 
                                    type="text"
                                    id="dlvdnote" // WARNING functional ID
                                    value={formData.deliveryNotes}
                                    className="input_form"
                                    onChange={handleChange}
                                    maxLength="30"
                                    readOnly={deliveries.length > 1}
                                />
                                <div className="fail_flag" id="ff_admin_df_dn">
                                    <p>Note is not allowed in batch editing!</p>
                                </div>
                            </div>
                        </div>
                        <div id="img_div">
                            <div id="img_signature_div">
                                <label>Consignee Signature:</label>
                                { // render fetched thumbnail when present, else render prompt thumbnail...
                                showSignatureThumbnail && typeof images.Signature === 'string' && images.Signature.trim() !== "" && (
                                    <div id="img_signature" /* WARNING functional ID */ > 
                                        <img 
                                            id="signatureThumbnail" 
                                            className="thumbnail" 
                                            src={images.Signature} 
                                            alt="Saved userSignature" 
                                            onClick={() => openPopup("deliveries_signature")}
                                            onError={() => setSigImageFail(true)}
                                        />
                                        {sigImageFail && (
                                            <p className="signatureIMG_error_text">Error loading image...</p>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id="sigCapture" 
                                    className="file_upload_widget" 
                                    style={{display: showSignatureThumbnail ? 'none' : 'flex'}} 
                                    onClick={() => openPopup("deliveries_signature")}
                                >
                                    <img className="signature_upload_logo" src={SignUploadLogo} alt="file upload logo" />
                                    <p>Collect a signature</p>
                                </div>
                            </div>
                            <div id="img_location_div">
                                <label>Delivery Location:</label>
                                { // render fetched thumbnail when present, else render prompt thumbnail...
                                showLocationThumbnail && typeof images.Location === 'string' && images.Location.trim() !== "" && (
                                    <div id="img_location" /* WARNING functional ID */ >
                                        <img 
                                            id="locationThumbnail" 
                                            className="thumbnail" 
                                            src={images.Location} 
                                            alt="Saved delivery location" 
                                            onClick={handleImageClick}
                                            onError={() => setLocImageFail(true)}
                                        />
                                        {locImageFail && (
                                            <p className="locationIMG_error_text">Error loading image...</p>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id="locCapture"
                                    className="file_upload_widget"
                                    style={{display: showLocationThumbnail ? "none" : "flex"}}
                                    onClick={handleImageClick}
                                >
                                    <img className="signature_upload_logo" src={ImageUploadLogo} alt="file upload logo" />
                                    <p>Upload an image</p>
                                </div>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    ref={hiddenFileInput}
                                    id="dlvdimage"
                                    className="input_image"
                                    onChange={handleChange}
                                    capture="environment"
                                    style={{display: "none"}}/>
                            </div>
                        </div>
                        <div id="signature_print_div">
                            <div className="cont_left">
                                <label>Consignee Signature Printed:</label>
                                <input type="text" id="dlvdsign" value={formData.deliverySign} className="input_form" min="0" max="999" onChange={handleChange} required/>
                            </div>
                        </div>
                    </form>
                    <div id="button_div">
                        <button 
                            id="undeliver"
                            onClick={handleSubmit}
                            type="button"
                        >Undo Delivery</button>
                        <button
                            id="update"
                            onClick={handleSubmit}
                            type="button"
                        >Update Delivery</button>
                    </div>
                </div>
                {popupVisible && (
                    <Popup
                        popupType={popupType}
                        isVisible={popupVisible}
                        closePopup={closePopup}
                        handleSignature={handleSignatureUpdate}
                    />
                )}
                </>
            )
    }
}

export default MenuWindowContent;

MenuWindowContent.propTypes = {
    contentType: PropTypes.string, // switch case string descriptor
    formData: PropTypes.object, // generic window field/form state
    inputErrors: PropTypes.object, // error field object

    handleSubmit: PropTypes.func, // delivery update form onSubmit
    handleChange: PropTypes.func, // delivery update form onChange
    deliveries: PropTypes.arrayOf(PropTypes.object), // list of deliveries (i.p. find out what purpose)
    images: PropTypes.any, // packaged
    handleSignature: PropTypes.func,

    showSignatureThumbnail: PropTypes.bool,
    showLocationThumbnail: PropTypes.bool,
}