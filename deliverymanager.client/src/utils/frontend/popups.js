import { SUCCESS_WAIT, FAIL_WAIT } from "../../scripts/helperFunctions";
import { Logout } from '../api/sessions';

const DEFAULT_POPUP = "users_update"

// set failed prompt AND send back to login...
export const returnOnFail = (popupType="fail", setPopup) => {
    setPopup(popupType);
    setTimeout(() => {
        Logout();
    },FAIL_WAIT);
}

// handle opening popup state...
export const openPopup = (popupType, setPopup, setVisible) => {
    setPopup(popupType);
    setVisible(true);
};

// handle closing popup state...
export const closePopup = (setPopup, setVisible, clearState=null) => {
    setVisible(false);
    setPopup(DEFAULT_POPUP);
    if (clearState) {
        clearState();
    }
    Logout();
};

// set success prompt popup...
export const successPopup = (popupType, setPopup, duration=SUCCESS_WAIT) => {
    setPopup(popupType);
    setTimeout(() => {
        closePopup();
    },duration)
}

// set failed prompt popup...
export const failedPopup = (popupType, setPopup) => {
    setPopup(popupType);
    setTimeout(() => {
        closePopup();
    },FAIL_WAIT)
}