import PropTypes from 'prop-types';
import MenuWindowContent from "./MenuWindowContent";
import "./MenuWindow.css";

import Popup from "../Popup/Popup.jsx";
import { usePopup } from '../../hooks/usePopup.js';

const MenuWindow = ({ 
    contentType,
    prompt, 
    formData, 
    updateData, 
    handleUpdate, 
    handleDeliveryChange, 
    inputErrors,
    stopNum, 
    proNum, 
    mfstKey, 
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
    // custom hooks...
    const { popupType, popupVisible, openPopup, closePopup } = usePopup();
    const MenuHeader = (
            <>
            {prompt ? (
                <div className="mw_header">
                    <h4 className="prompt">{prompt}</h4>
                </div>
            ) : (
                <div className="mw_spm_row">
                    <div className="mw_spm_col">
                        <h5>Stop No:</h5>
                        <h5 className="weak">{stopNum}</h5>
                    </div>
                    <div className="mw_spm_col">
                        <h5>Pro No:</h5>
                        <h5 className="weak">{proNum}</h5>
                    </div>
                    <div className="mw_spm_col">
                        <h5>Manifest Key:</h5>
                        <h5 className="weak">{mfstKey}</h5>
                    </div>
                </div>                
            )}
            </>
        );

    return(
        <>
        { MenuHeader }
        <MenuWindowContent
            contentType={contentType}
            formData={formData} 
            updateData={updateData}
            handleUpdate={handleUpdate}
            handleDeliveryChange={handleDeliveryChange}
            inputErrors={inputErrors}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            deliveries={deliveries}
            images={images}
            handleSignature={handleSignature}
            showSignatureThumbnail={showSignatureThumbnail}
            showLocationThumbnail={showLocationThumbnail}
        />
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
};

export default MenuWindow;

MenuWindow.propTypes = {
    contentType: PropTypes.string,
    prompt: PropTypes.string, // const string page prompt
    formData: PropTypes.object,
    header: PropTypes.string, // inactive in admin page
    updateData: PropTypes.object,
    handleUpdate: PropTypes.func,
    handleDeliveryChange: PropTypes.func,
    inputErrors: PropTypes.object,

    stopNum: PropTypes.string, // inactive in admin page
    proNum: PropTypes.string, // inactive in admin page
    mfstKey: PropTypes.string, // inactive in admin page
    handleSubmit: PropTypes.func, // handle submit delivery update form
    handleChange: PropTypes.func, // handle delivery update form
    deliveries: PropTypes.arrayOf(PropTypes.object), // deliveries
    images: PropTypes.object, // packages signature/location images
    handleSignature: PropTypes.func,

    showSignatureThumbnail: PropTypes.bool,
    showLocationThumbnail: PropTypes.bool,
};