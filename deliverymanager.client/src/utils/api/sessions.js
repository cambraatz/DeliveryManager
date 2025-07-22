const API_URL = import.meta.env.VITE_API_URL;
import { SUCCESS_WAIT, FAIL_WAIT } from "../../scripts/helperFunctions";
import { useNavigate } from "react-router-dom";

async function parseErrorMessage(response) {
    let errorMessage = "An unknown error occurred";
    let errorType = "unknown";
    let errorStatus = ""

    // response objects are consumed on first use, temp clones...
    const responseJSON = response.clone();
    const responseTXT = response.clone();

    try {
        errorStatus = responseJSON.status;
        const errorBody = await responseJSON.json();
        if (errorBody && errorBody.message) {
            errorMessage = errorBody.message;
        }
        else if (errorBody && typeof errorBody === 'string') {
            errorMessage = errorBody;
        }
        else {
            errorMessage = `Server error (status: ${responseJSON.status}). Details: ${JSON.stringify(errorBody)}`;
        }
        errorType = 'json';
    // eslint-disable-next-line no-unused-vars
    } catch (ex) {
        try {
            errorStatus = responseTXT.status;
            const textError = await responseTXT.text();
            if (textError) {
                errorMessage = textError;
            } else {
                errorMessage = `HTTP Error! Status ${responseTXT.status} ${responseTXT.statusText || ''}`;
            }
            errorType = 'text';
        // eslint-disable-next-line no-unused-vars
        } catch (textParseEx) {
            errorMessage = `HTTP Error! Status: ${responseTXT.status} ${responseTXT.statusText || ''} (No response body)`;
            errorType = 'empty';
        }
    }

    console.error(`Error (${errorStatus} - ${errorType}):`, errorMessage);
    return {status: errorStatus, message: errorMessage };
}

export async function validateSession() {
    const response = await fetch(API_URL + "v1/sessions/me", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        credentials: 'include'
    });

    if (!response.ok) {
        console.error(`Session validation failed, Status: ${response.status} ${response.statusText}`);
        try {
            //const data = await response.json();
            const parsedResponse = parseErrorMessage(response);
            console.error(`Validating session failed: Status: ${parsedResponse.status} ${parsedResponse.message}`);
        } catch (ex) {
            console.error(`Error: ${ex}`);
        }
    }

    return response;
}

const goBackOneDirectory = () => {
    const currPath = window.location.pathname;
    if (currPath === '/' || currPath ==='') {
        return '/';
    }
    const pathSegments = currPath.split('/');
    if (pathSegments.length > 0) {
        pathSegments.pop();
    }
    if (pathSegments.length > 1 && pathSegments[pathSegments.length - 1] === '') {
        pathSegments.pop();
    }

    let newPath = pathSegments.join('/');
    if (newPath === '') {
        newPath = '/';
    } else if (!newPath.startsWith('/')) {
        newPath = '/' + newPath;
    }

    return newPath;
}

export async function Return(root) {    
    if (root) {
        const response = await fetch(`${API_URL}v1/sessions/return`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: "include"
        });

        if (response.ok) {
            console.log("Return Successful!");
            setTimeout(() => {
                //console.log("Logged Out... [dev]");
                window.location.href = `https://login.tcsservices.com`;
            }, SUCCESS_WAIT);
        } else {
            console.error("Return cookie generation failed, return failure.");
            return;
        }
    }
    else {
        const path = goBackOneDirectory();
        return path;
    }
}

export async function Logout() {
    localStorage.clear();
    sessionStorage.clear();

    const response = await fetch(`${API_URL}v1/sessions/logout`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        credentials: "include",
    })
    if (response.ok) {
        console.log("Logout Successful!");
        setTimeout(() => {
            //console.log("Logged Out... [dev]");
            window.location.href = `https://login.tcsservices.com`;
        },SUCCESS_WAIT);
    } else {
        console.error("Cookie removal failed, Logout failure.");
        setTimeout(() => {
            //console.log("Logged Out... [dev]");
            window.location.href = `https://login.tcsservices.com`;
        },FAIL_WAIT);
    }
}

export async function checkManifestAccess(powerUnit, mfstDateString) {
    try {
        const response = await fetch(`${API_URL}v1/sessions/check-manifest-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Cookies are usually sent automatically by the browser for same-site requests
            },
            body: JSON.stringify({
                powerUnit: powerUnit,
                mfstDateString: mfstDateString // e.g., "07182025"
            }),
            credentials: "include",
        });

        if (response.ok) { // Status 200-299
            const result = await response.json();
            console.log("Manifest access granted:", response.message);
            // Proceed to load manifest data
            return { success: true, message: result.message };
        } else if (response.status === 403) { // Forbidden due to SSO conflict
            const error = await response.text(); // Get raw text for specific message
            console.error("SSO Conflict:", error);
            return { success: false, message: error, code: 403 };
        } else if (response.status === 401) { // Unauthorized, session expired
            console.error("Unauthorized: Session expired. Redirecting to login.");
            // Redirect to login page
            window.location.href = '/'; // Or your login route
            return { success: false, message: "Session expired. Please log in again.", code: 401 };
        } else {
            const error = await response.text();
            console.error("Failed to check manifest access:", response.status, error);
            return { success: false, message: `Error (${response.status}): ${error}`, code: response.status };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { success: false, message: `Network error: ${error.message}`, code: 500 };
    }
}