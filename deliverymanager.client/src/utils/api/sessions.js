const API_URL = import.meta.env.VITE_API_URL;
import { SUCCESS_WAIT, FAIL_WAIT, scrapeDate } from "../../scripts/helperFunctions";
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

// Helper function to parse response body for a message and the full parsed JSON
async function parseResponseForMessage(response) {
    let message = `An unexpected error occurred with status ${response.status}.`;
    let parsedBody = null;

    try {
        // Clone the response so we can read the body multiple times if needed later
        // (though in this specific refactor, we'll aim to read it once and store)
        const clonedResponse = response.clone(); 
        parsedBody = await clonedResponse.json(); // Try to parse as JSON first

        if (parsedBody && parsedBody.message) {
            message = parsedBody.message;
        } else if (parsedBody && parsedBody.errors) { // Common for ASP.NET Core BadRequest (400)
            // Flatten validation errors into a single string
            const errorMessages = Object.values(parsedBody.errors).flat().join('; ');
            if (errorMessages) {
                message = errorMessages;
            }
        } else {
            // If JSON parsed but no specific message found, return a generic one
            message = `Server responded with status ${response.status}.`;
        }
    } catch {
        // If it's not JSON, try to get it as plain text
        try {
            const text = await response.text();
            if (text) {
                message = text;
            }
        } catch {
            // Fallback if unable to get any text
        }
    }
    return { message, parsedBody }; // Return both the message and the parsed body
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

export async function Return(root, userId) {    
    if (root) {
        const response = await fetch(`${API_URL}v1/sessions/return/${userId}`, {
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
            console.error("Return cookie generation failed, logging out.");
            Logout();
            return;
        }
    }
    else {
        const path = goBackOneDirectory();
        return path;
    }
}

export async function Logout(session=null) {
    localStorage.clear();
    sessionStorage.clear();

    const response = await fetch(`${API_URL}v1/sessions/logout/${session.id}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(session),
        credentials: "include",
    })
    if (response.ok) {
        console.log("Logout Successful!");
        setTimeout(() => {
            //console.log(`Logged Out... [${session.id}]`);
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

export async function checkManifestAccess(powerUnit, mfstDate, userId) {
    try {
        const response = await fetch(`${API_URL}v1/sessions/check-manifest-access/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                powerUnit: powerUnit,
                mfstDate: scrapeDate(mfstDate) // e.g., "07182025"
            }),
            credentials: "include",
        });

        const statusCode = response.status;
        let { message: resultMessage, parsedBody: serverResponseJson } = await parseResponseForMessage(response);

        if (response.ok) {
            console.log("Server's 200 OK JSON response:", serverResponseJson);

            if (serverResponseJson && serverResponseJson.conflict) {
                if (serverResponseJson.conflictType === "same_user") {
                    console.warn("Same user conflict detected. Server message:", resultMessage)

                    // Return specific flags for client to trigger popup
                    return {
                        success: false,
                        message: resultMessage, // Use server's message for popup
                        conflict: true,
                        conflictType: "same_user",
                        conflictingSessionId: serverResponseJson.conflictingSessionId,
                        conflictingSessionUser: serverResponseJson.conflictingSessionUser
                    };
                }
                else {
                    // This branch should ideally not be hit if server is strict with 200 OK + conflictTy
                    console.error("Unexpected conflict type with 200 OK status. Server message:", serverResponseJson.message);
                    return { success: false, message: serverResponseJson.message || "An unexpected conflict occurred.", conflict: true, conflictType: "unknown" };
                }
                
            } else {
                // No conflict, or 'current_session' type, which is treated as success
                console.log("Manifest access granted:", serverResponseJson.message);
                return { success: true, message: serverResponseJson.message || "Manifest access granted.", code: statusCode };
            }
        } else { // handle non-2xx statuses
            console.error(`Failed to check manifest access: ${statusCode}`);
            console.error("Error message from server:", resultMessage);

            // Attempt to get specific conflictType if available (e.g., for 403)
            let conflictType = "unknown";
            let conflictingSessionId = null;
            let conflictingSessionUser = null;

            // Use the already parsed JSON body to get conflict details if available
            if (serverResponseJson && serverResponseJson.conflictType) {
                conflictType = serverResponseJson.conflictType;
                conflictingSessionId = serverResponseJson.conflictingSessionId;
                conflictingSessionUser = serverResponseJson.conflictingSessionUser;
            }

            // Provide specific messages for common HTTP error codes
            if (statusCode === 400) {
                resultMessage = resultMessage || "Invalid request. Please check your input.";
            } else if (statusCode === 401) {
                resultMessage = "Session expired or unauthorized. Please log in again.";
                console.error("Unauthorized: Session expired. Redirecting to login.");
                window.location.href = '/'; // Redirect to login page
            } else if (statusCode === 403 && conflictType === "different_user") {
                // Specific handling for different user conflict (immediate rejection)
                resultMessage = resultMessage || "Access denied. Manifest is in use by another user.";
                console.error("Different user conflict detected. Immediately rejecting.");
                return {
                    success: false,
                    message: resultMessage,
                    conflict: true,
                    conflictType: "different_user", // Client will look for this
                    conflictingSessionId: conflictingSessionId,
                    conflictingSessionUser: conflictingSessionUser,
                    code: statusCode
                };
            } else if (statusCode === 403) { // Generic 403 if not a specific conflictType
                resultMessage = resultMessage || "Access denied. You do not have permission to perform this action.";
            } else if (statusCode === 404) {
                resultMessage = resultMessage || "Resource not found.";
            } else if (statusCode === 409) { // Conflict status (e.g., from your server if it returns 409)
                resultMessage = resultMessage || "A conflict occurred. The resource might be in use.";
            } else if (statusCode >= 500) {
                resultMessage = resultMessage || "An internal server error occurred. Please try again later.";
            } else {
                resultMessage = resultMessage || `Error (${statusCode}): An unexpected status code was received.`;
            }

            return { success: false, message: resultMessage, code: statusCode, conflict: true, conflictType: conflictType };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Network error: ${errorMessage}`, code: 500, conflict: false, conflictType: "none" };
    }
}

export async function releaseManifestAccess(username, powerunit=null, mfstdate=null, userId) {
    try {
        const response = await fetch(`${API_URL}v1/sessions/release-manifest-access/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Cookies are usually sent automatically by the browser for same-site requests
            },
            body: JSON.stringify({
                username: username,
                powerunit: powerunit,
                mfstdate: scrapeDate(mfstdate) // e.g., "07182025"
            }),
            credentials: "include",
        });

        if (response.ok) { // Status 200-299
            const result = await response.json();
            console.log("Manifest released successfully:", response.message);
            // Proceed to load manifest data
            return { success: true, message: result.message };
        } 
        else {
            const error = await response.text();
            console.error("Failed to release manifest access:", response.status, error);
            return { success: false, message: `Error (${response.status}): ${error}`, code: response.status };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { success: false, message: `Network error: ${error.message}`, code: 500 };
    }
}

export async function resetManifestAccess(username, powerunit, mfstdate, userId) {
    try {
        const response = await fetch(`${API_URL}v1/sessions/reset-manifest-access/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Cookies are usually sent automatically by the browser for same-site requests
            },
            body: JSON.stringify({
                username: username,
                powerunit: powerunit,
                mfstdate: scrapeDate(mfstdate) // e.g., "07182025"
            }),
            credentials: "include",
        });

        if (response.ok) { // Status 200-299
            const result = await response.json();
            console.log("Manifest reset successfully:", response.message);
            // Proceed to load manifest data
            return { success: true, message: result.message };
        }
        else {
            const error = await response.text();
            console.error("Failed to release manifest access:", response.status, error);
            return { success: false, message: `Error (${response.status}): ${error}`, code: response.status };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { success: false, message: `Network error: ${error.message}`, code: 500 };
    }
}