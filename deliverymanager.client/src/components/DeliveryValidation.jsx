/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/7/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Header from './Header/Header.jsx';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner.jsx';
import MenuWindow from './MenuWindow/MenuWindow.jsx';
import Footer from './Footer/Footer.jsx';
import Popup from './Popup/Popup.jsx';
import { 
    renderDate, 
    getDate,
    FAIL_WAIT, 
} from '../scripts/helperFunctions.jsx';

import { checkManifestAccess, Logout, validateSession, releaseManifestAccess } from '../utils/api/sessions.js';
import { validateAndAssignManifest } from '../utils/api/deliveries.js';
import { validateDeliveryConfirm } from '../utils/validation/validateForms.js';

import { useAppContext } from '../hooks/useAppContext.js';
import { usePopup } from '../hooks/usePopup.js';

const DeliveryValidation = () => {
    const { 
        loading, setLoading, // [bool] global app loading state
        session, setSession, // [obj] credentials for session
     } = useAppContext();
    /*session = {
        id: -1,
        username: "",
        powerunit: "",
        mfstdate: "",
        company: "",
        valid: false,
    }*/

    const {
        popupType, /*setPopupType,*/
        openPopup, closePopup,
        popupVisible, /*setVisible,*/
    } = usePopup();

    // Date processing functions ...
    const currDate = getDate(); // "YYYY-MM-DD"
    const navigate = useNavigate();

    /* Site state & location processing functions... */

    // check delivery validity onLoad and after message state change...
    useEffect(() => {
        validateUserSession();
        //setPopupType("return");
        //setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // state 'formData' for rendering forms on page...
    const [formData, setFormData] = useState({
        deliverydate: currDate,
        powerunit: ""
    });

    /* Page rendering helper functions... */

    const [inputErrors, setInputErrors] = useState({ 
        mfstdate: "",
        powerunit: ""
     });

    const clearStateStyling = () => {
        setInputErrors({ 
            mfstdate: "",
            powerunit: ""
        });
    };

    /* Dynamic form/state change functions... */

    // handle delivery query form changes...
    const handleChange = (e) => {
        // reset styling to default...
        clearStateStyling();

        // handle delivery date + powerunit input field changes...
        let id = e.target.id;
        let val = e.target.value;
        switch(true) {
            case id.startsWith('dlvddate'):
                setFormData({
                    ...formData,
                    deliverydate: renderDate(val)
                });
                break;
            case id.startsWith('powerunit'):
                setFormData({
                    ...formData,
                    powerunit: val
                });
                break;
            default:
                break;
        }
    };
    
    /* API Calls and Functionality... */

    // validate credentials, prompt for correction in fail or open popup in success...
    async function validateUserSession(){
        setLoading(true);
        // direct bypass to powerunit validation...
        const response = await validateSession();
        if (response.ok) {
            const data = await response.json();
            console.log(data);

            // init results from data...
            const username = data.user.Username;
            const userId = data.userId;
            const company_map = JSON.parse(data.mapping);
            const company_name = company_map[data.user.ActiveCompany];
            const powerunit = data.user.Powerunit;

            // update state data...
            setSession({ 
                ...session, 
                username: username,
                id: userId,
                //mfstdate: null,
                powerunit: powerunit,
                company: company_name,
                valid: true,
             });
            setFormData({ 
                ...formData,
                powerunit: powerunit
            });

            setLoading(false);
            return;
        }
        else {
            /*const responseError = "Session could not be validated, please log in.";
            setInputErrors({
                mfstdate: responseError,
                powerunit: responseError,
            })*/

            openPopup("fail");
            setTimeout(() => {
                //clearStateStyling();
                Logout(session);
                closePopup();
                return;
            }, FAIL_WAIT);
        }        
    }

    async function validationLogin() {
        // validate delivery from data/powerunit...
        let response = await validateAndAssignManifest(session.username, formData.powerunit, formData.deliverydate, session.id);
        if(response.ok){
            // update global session state...
            setSession({
                ...session,
                mfstdate: formData.deliverydate,
                powerunit: formData.powerunit,
            });

            navigate(`/deliveries`);
            return;
        // handle failed validation...
        } else {
            // release manifest access (cleanup)...
            const release = await releaseManifestAccess(session.username, formData.powerunit, formData.deliverydate, session.id);
            if(release.ok){
                setTimeout(() => {
                    clearStateStyling();
                    return;
                }, FAIL_WAIT);
            }

            // handle unauthorized...
            if (response.status === 401 || release.status === 401) {
                const responseError = "Unauthorized attempt, please log in.";
                    setInputErrors({
                        mfstdate: responseError,
                        powerunit: responseError,
                    })

                    openPopup("fail");
                    setTimeout(() => {
                        clearStateStyling();
                        Logout(session);
                        closePopup();
                        return;
                    }, FAIL_WAIT);
            }
            // handle unauthorized...
            else if (response.status === 404 || release.status === 404) {
                const responseError = "No delivery found.";
                    setInputErrors({
                        mfstdate: responseError,
                        powerunit: responseError,
                    })
                    setTimeout(() => {
                        clearStateStyling();
                        return;
                    }, FAIL_WAIT);
            }
            else {
                const responseError = "Server error, contact administrator.";
                setInputErrors({
                    mfstdate: responseError,
                    powerunit: responseError,
                })
            }
        }
    }

    const [conflictID, setConflictID] = useState(-1);
    async function releaseSessionAndLogin() {
        // release previous user session in conflict...
        const release = await releaseManifestAccess(session.username, formData.powerunit, formData.deliverydate, conflictID);
        if(!release.ok){
            setTimeout(() => {
                clearStateStyling();
                return;
            }, FAIL_WAIT);
        }

        // ensure SSO gated access on mfstdate + powerunit...
        const result = await checkManifestAccess(formData.powerunit, formData.deliverydate, session.id);
        if (result.success) {
            // Manifest access was granted (either free or current user's current session)
            console.log("Manifest access granted:", result.message);
        } else {
            // Something went wrong or a conflict was detected
            console.error("Manifest access check failed:", result.message);

            if (result.conflict) {
                setConflictID(result.conflictingSessionId);
                if (result.conflictType === "same_user") {
                    console.warn("User already has an active session on this manifest. Presenting option to terminate old session.");
                    // Trigger popup for same-user conflict
                    openPopup("sessions_existing_dm_conflict");
                }
                else if (result.conflictType === "different_user") {
                    console.error("Manifest is in use by another user. Immediately rejecting.");
                    // Immediately reject, display an error message to the user
                    setInputErrors({
                        mfstdate: result.message,
                        powerunit: result.message
                    });
                }
                else {
                    // Fallback for unknown conflict types (shouldn't happen with strict server)
                    console.error("Unknown conflict type:", result.message);
                    setInputErrors({
                        mfstdate: result.message,
                        powerunit: result.message
                    });
                }
            } else {
                // Handle other non-conflict related errors (e.g., 400, 500, network errors)
                console.error("Non-conflict error:", result.message);
                setInputErrors({
                    mfstdate: result.message,
                    powerunit: result.message
                });
            }
        }

        await validationLogin();
    }

    // validate credentials, prompt for correction in fail or open popup in success...
    async function handleUpdate(e) {
        // prevent default and reset popup window...
        e.preventDefault();

        // form validation...
        let {isValid, errors, message} = validateDeliveryConfirm(formData);
        if (!isValid) {
            console.error("Input validation error: ", message);
            setInputErrors(errors);
            return;
        }

        // ensure SSO gated access on mfstdate + powerunit...
        const result = await checkManifestAccess(formData.powerunit, formData.deliverydate, session.id);
        if (result.success) {
            // Manifest access was granted (either free or current user's current session)
            console.log("Manifest access granted:", result.message);
        } else {
            // Something went wrong or a conflict was detected
            console.error("Manifest access check failed:", result.message);

            if (result.conflict) {
                setConflictID(result.conflictingSessionId);
                if (result.conflictType === "same_user") {
                    console.warn("User already has an active session on this manifest. Presenting option to terminate old session.");
                    // Trigger popup for same-user conflict
                    openPopup("sessions_existing_dm_conflict");
                }
                else if (result.conflictType === "different_user") {
                    console.error("Manifest is in use by another user. Immediately rejecting.");
                    // Immediately reject, display an error message to the user
                    setInputErrors({
                        mfstdate: result.message,
                        powerunit: result.message
                    });
                }
                else {
                    // Fallback for unknown conflict types (shouldn't happen with strict server)
                    console.error("Unknown conflict type:", result.message);
                    setInputErrors({
                        mfstdate: result.message,
                        powerunit: result.message
                    });
                }
            } else {
                // Handle other non-conflict related errors (e.g., 400, 500, network errors)
                console.error("Non-conflict error:", result.message);
                setInputErrors({
                    mfstdate: result.message,
                    powerunit: result.message
                });
            }
        }
        
        if (!result.success) {
            if (result.message && result.message.includes("already exists")) {
                console.error("user already has an active session!");
                openPopup("sessions_existing_dm_conflict");
                return;
            }

            // handle conflict...
            //const responseError = "Date/Powerunit is in active use, try again later.";
            setInputErrors({
                mfstdate: result.message,
                powerunit: result.message
            });
            return;
        }      
        await validationLogin();
        setTimeout(() => {
            clearStateStyling();
        }, FAIL_WAIT);
    }

    // render template...
    return(
        <div id="webpage">
            {loading ? ( 
                <LoadingSpinner />
            ) : (
                <>
                    <Header 
                        company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                        title="Delivery Manager"
                        subtitle="Delivery Validation"
                        currUser={session.username}
                        logoutButton={true}
                        root={true}
                    />
                    <MenuWindow
                        contentType="delivery_confirm"
                        prompt="Confirm Delivery Info"
                        formData={formData}
                        inputErrors={inputErrors}
                        handleChange={handleChange}
                        handleSubmit={handleUpdate}
                    />
                    <Footer className="validation_window_footer" />
                </>
            )}
            {popupVisible && (
                <Popup 
                    popupType={popupType}
                    isVisible={popupVisible}
                    closePopup={closePopup}
                    handleSubmit={releaseSessionAndLogin}
                />
            )}
        </div>
    )
};

export default DeliveryValidation;
