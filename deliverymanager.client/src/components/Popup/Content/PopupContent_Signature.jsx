import SignatureField from '../../SignatureField/SignatureField';
//import Success from '../../../assets/success.svg';
//import Fail from '../../../assets/error.svg';
import PropTypes from 'prop-types';
import "../Popup.css";

const PopupContent_Signature = ({ handleSignature }) => {

    return (
        <SignatureField id="sigField" onSubmit={handleSignature}/>
    )
};

export default PopupContent_Signature;

PopupContent_Signature.propTypes = {
    popupType: PropTypes.string,
    credentials: PropTypes.object,
    handleSignature: PropTypes.func,
}