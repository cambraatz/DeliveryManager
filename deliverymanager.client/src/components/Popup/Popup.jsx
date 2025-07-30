import Success from '../../assets/success.svg';
import Fail from '../../assets/error.svg';
import SignatureField from '../SignatureField/SignatureField';
import PropTypes from 'prop-types';
import "./Popup.css";

import {
    PopupContent_DeliveryList,
    PopupContent_SessionConflict,
    //PopupContent_Signature,
    //PopupContent_Sessions,
    //PopupContent_Users
} from './Content';

//import { usePopup } from '../../hooks/usePopup.js';

const Popup = ({
        popupType,
        isVisible,
        closePopup,
        deliveries,
        handleSubmit,
        handleSignature
    }) => {

    const popupContent = () => {
        if(popupType === "Success"){
            return(
                <>
                    <div className="popupLoginContent success_popup">
                        <img id="success" src={Success} alt="success"/>
                        <p>Logout success!</p>
                    </div>
                </>
            )
        }
        else if(popupType === "Fail" || popupType == "fail"){
            return(
                <>
                    <div className="popupLoginContent fail_popup">
                        <img id="fail" src={Fail} alt="fail"/>
                        <p>Oops! Something went wrong, logging out.</p>
                    </div>
                </>
            )
        }
        else if (popupType === "return") {
            return (
                <div className="popupLoginContent success_popup">
                    <img id="success" src={Success} alt="success"/>
                    <p>Returning to Login Portal.</p>
                </div>
            )
        }
        else if (popupType === "logout") {
            return (
                <div className="popupLoginContent success_popup">
                    <img id="success" src={Success} alt="success"/>
                    <p>Logging Out.</p>
                </div>
            )
        }
        else if (popupType === "deliveries_multiple") {
            return (
                <PopupContent_DeliveryList
                    deliveries={deliveries}
                    onClose={closePopup}
                    onClick={handleSubmit}
                />
            )
        }
        else if (popupType === "deliveries_signature") {
            return (
                <SignatureField id="sigField" onSubmit={handleSignature}/>
            )
        }
        else if (popupType === "deliveries_clear_success") {
            return(
                <>
                    <div className="popupLoginContent">
                        <img id="success" src={Success} alt="success"/>
                        <p>Manifest was cleared successfully!</p>
                    </div>
                </>
            )
        }
        else if (popupType === "deliveries_update_success") {
            return(
                <>
                    <div className="popupLoginContent">
                        <img id="success" src={Success} alt="success"/>
                        <p>Manifest was updated successfully!</p>
                    </div>
                </>
            )
        }
        else if (popupType === "deliveries_update_fail") {
            return(
                <>
                    <div className="popupLoginContent fail_popup">
                        <img id="fail" src={Fail} alt="fail"/>
                        <p>Updating delivery failed, try again.</p>
                    </div>
                </>
            )
        }
        else if (popupType === "sessions_existing_dm_conflict") {
            return(
                <PopupContent_SessionConflict 
                    closePopup={closePopup}
                    handleSubmit={handleSubmit}
                />
            )
        }
    }

    //const overlayClass = isVisible ? 'overlay-visible' : 'overlay-hidden';
    const overlayClass = isVisible ? 'overlay-visible' : 'overlay-hidden';

    let popupClass = "popupDeliveryManager";
    if (popupType.includes("Success") || popupType.includes("success") || popupType.includes("Fail") || popupType.includes("fail")) {
        popupClass = "popupGraphic";
    }
    else if (popupType.includes("signature")) {
        popupClass = "popupSignature";
    }
    else if (popupType.includes("multiple")) {
        popupClass = "popupCheckbox";
    }
    else if (popupType.includes("logout") || popupType.includes("return")) {
        popupClass = "popupGraphic";
    }
    else if (popupType.includes("conflict")) {
        popupClass = "popupSessionConflict";
    }

    return (
        <div id="popup_overlay" className={`overlay ${overlayClass}`}>
            <div className={popupClass}>
                <div id="popupExit" className="content">
                    <h1 id="close" className="popupLoginWindow" onClick={closePopup}>&times;</h1>
                </div>
                {popupContent()}
            </div>
        </div>
    )
};

export default Popup;

Popup.propTypes = {
    popupType: PropTypes.string,
    isVisible: PropTypes.bool,
    closePopup: PropTypes.func,
    deliveries: PropTypes.array,
    handleSubmit: PropTypes.func,
    handleSignature: PropTypes.func
}