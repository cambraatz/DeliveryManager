//import Success from '../../../assets/success.svg';
import Fail from '../../../assets/error.svg';
import PropTypes from 'prop-types';
import "../Popup.css";

const PopupContent_Sessions = ({ popupType, credentials }) => {
    switch (popupType) {
        case "sessions_validation_fail":
            return (
                <div className="popupContent">
                    <img id="fail" src={Fail} alt="fail"/>
                    <p>Session validation failed for {credentials.USERNAME}.</p>
                </div>
            )
        /*case "sessions_unauthorized_fail":
            return (
                <div className="popupContent">
                    <img id="fail" src={Fail} alt="fail"/>
                    <p>Unauthorized attempt, logging out.</p>
                </div>
            )*/
    }
};

export default PopupContent_Sessions;

PopupContent_Sessions.propTypes = {
    popupType: PropTypes.string,
    credentials: PropTypes.object
}