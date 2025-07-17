const API_URL = import.meta.env.VITE_API_URL;
import {  
    getDate, 
    getTime,
    scrapeDate,
    scrapeTime
 } from "../../Scripts/helperFunctions";

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

export async function validateAndAssignManifest(username, powerunit, mfstdate) {
    let response;
    // could wrap in try/catch for more nuanced error handling...
    response = await fetch(API_URL + "v1/deliveries/validate-and-assign", {
        body: JSON.stringify({
            USERNAME: username,
            POWERUNIT: powerunit,
            MFSTDATE: scrapeDate(mfstdate)
        }),
        method: "POST",
        headers: {
            //"Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8'
        },
        credentials: 'include',
    })
    
    if (!response.ok) {
        try {
            //const parsedResponse = parseErrorMessage(response);
            console.error(`Delivery validation failed for ${powerunit} and ${mfstdate}`);
        } catch (ex) {
            console.error("Error: ", ex);
        }
    }

    return response;
}

export async function fetchDeliveryManifest(powerunit, mfstdate) {
    let response;
    // could wrap in try/catch for more nuanced error handling...
    response = await fetch(API_URL + "v1/deliveries?powerunit=" + powerunit + "&mfstdate=" + mfstdate, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        credentials: 'include'
    });

    if (!response.ok) {
        //console.error("Fetching delivery manifests failed on server, logging out.");
        try {
            const parsedResponse = parseErrorMessage(response);
            console.error(`Fetching delivery manifest: [${mfstdate}] --- ${powerunit} failed on server, Status: ${parsedResponse.status} ${parsedResponse.message}`);
        } catch (ex) {
            console.error("Error: ", ex);
        }
    }

    return response;
}

export async function clearDeliveryForms(currUser, deliveries) {
    const currDate = getDate();
    const currTime = getTime();

    const sharedEntries = {
        USERNAME: currUser,
        LASTUPDATE: currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00",
        STATUS: "0",
        DLVDDATE: "",
        DLVDTIME: "",
        DLVDPCS: -1,
        DLVDSIGN: "",
        DLVDNOTE: "",
        DLVDIMGFILELOCN: null,
        DLVDIMGFILESIGN: null,
        location_string: "",
        signature_string: ""
    };

    // iterate list of deliveries and initialize reverted delivery objects...
    let deliveryList = deliveries.map((currDelivery) => {
        // initialize fresh FormData object for handling file upload...
        let deliveryData = new FormData();

        // iterate delivery entries to build FormData objects...
        for (const [key,value] of Object.entries(currDelivery)) {
            if (key in sharedEntries) {
                deliveryData.append(key, sharedEntries[key]);
            // standard delivery data processing...
            } else {
                deliveryData.append(key, value);
            }
        }

        return deliveryData;
    });

    let responses = [];
    let response;
    for (const deliveryData of deliveryList) {
        const mfstKey = deliveryData.get("MFSTKEY");
        if (!mfstKey) {
            console.error(`Clearing manifests failed with invalid delivery data`);
        }

        response = await fetch(API_URL + "v1/deliveries/" + mfstKey, {
            body: deliveryData,
            method: "PUT",
            credentials: 'include'
        });

        responses.push(response);

        if (!response.ok) {
            //console.error("Fetching delivery manifests failed on server, logging out.");
            try {
                const mfstdate = deliveryData.get("MFSTDATE");
                const powerunit = deliveryData.get("POWERUNIT");
                const parsedResponse = parseErrorMessage(response);
                console.error(`Clearing delivery manifest: [${mfstdate}] --- ${powerunit} failed on server, Status: ${parsedResponse.status} ${parsedResponse.message}`);
            } catch (ex) {
                console.error("Error: ", ex);
            }
        }
    }

    return responses;
}

export async function updateDeliveryForms(currUser, selectedDelivery, formData, deliveries) {
    const currDate = getDate();
    const currTime = getTime();

    // define common data shared between selected deliveries...
    // borrow values from first delivery...
    const isNull = (updateField) => {
        return (updateField === null || updateField === undefined || updateField === "")
    }
    const sharedEntries = {
        USERNAME: currUser,
        LASTUPDATE: currDate.slice(0,4) + currDate.slice(5,7) + currDate.slice(8) + currTime.slice(0,2) + currTime.slice(3) + "00", 
        STATUS: "1",
        DLVDDATE: !isNull(selectedDelivery.DLVDDATE) ? selectedDelivery.DLVDDATE : scrapeDate(formData.deliveryDate),
        DLVDTIME: !isNull(selectedDelivery.DLVDTIME) ? selectedDelivery.DLVDTIME : scrapeTime(formData.deliveryTime),
        DLVDSIGN: !isNull(selectedDelivery.DLVDSIGN) ? selectedDelivery.DLVDSIGN : formData.deliverySign,
        DLVDNOTE: !isNull(selectedDelivery.DLVDNOTE) ? selectedDelivery.DLVDNOTE : formData.deliveryNotes,
        //DLVDPCS: !isNull(selectedDelivery.DLVDPCS) ? selectedDelivery.DLVDPCS : formData.deliveredPieces,
        //DLVDPCS: !isNull(selectedDelivery.DLVDPCS) ? selectedDelivery.DLVDPCS : formData.deliveredPieces,
    };

    // iterate list of deliveries and initialize delivery updates...
    let deliveryList = deliveries.map((currDelivery) => {
        // initialize fresh FormData object for handling file upload...
        let deliveryData = new FormData();

        // iterate delivery entries to build FormData objects...
        for (const [key,val] of Object.entries(currDelivery)) {
            // handle file/blob processing...
            if (key === "DLVDIMGFILELOCN" || key === "DLVDIMGFILESIGN") {
                console.log(`key: ${key}, val: ${val}`);
                const image = selectedDelivery[key];
                // if file/blob exists, save file path and nullify file upload...
                if (typeof val === "string" && val.trim() !== "" && val !== "null") {
                    deliveryData.append(key === "DLVDIMGFILELOCN" ? "location_string" : "signature_string", val);
                    deliveryData.append(key, "");
                // if image file uploaded, pull file from delivery state...
                } else if (image instanceof Blob || image instanceof File) {
                    //console.log("New image file upload recieved...");
                    deliveryData.append(key, image);
                    deliveryData.append(key === "DLVDIMGFILELOCN" ? "location_string" :"signature_string", "");
                // else, set to null...
                } else {
                    deliveryData.append(key, null);
                }
            // handle delivery pieces (different for each delivery)...
            } else if (key === "DLVDPCS") {
                // handle single delivery pieces updates...
                if (formData.deliveredPieces > 0) {
                    deliveryData.append(key, formData.deliveredPieces);
                }
                // handle undelivered updates...
                else if (currDelivery.DLVDPCS === null || currDelivery.DLVDPCS == undefined || currDelivery.DLVDPCS === 0) {
                    deliveryData.append(key, currDelivery.TTLPCS);
                } 
                // honor delivered records...
                else {
                    deliveryData.append(key, currDelivery.DLVDPCS);
                }
                
            // handle commonly shared data on batch processing...
            } else if (key in sharedEntries) {
                deliveryData.append(key, sharedEntries[key]);
            // standard delivery data processing...
            } else {
                deliveryData.append(key, val);
            }
        }
        return deliveryData;
    });

    let responses = [];
    let response;
    for (const deliveryData of deliveryList) {
        const mfstKey = deliveryData.get("MFSTKEY");
        if (!mfstKey) {
            console.error(`Updating manifests failed with invalid delivery data`);
        }

        response = await fetch(API_URL + "v1/deliveries/" + mfstKey, {
            body: deliveryData,
            method: "PUT",
            credentials: 'include'
        });

        responses.push(response);
        if (!response.ok) {
            //console.error("Fetching delivery manifests failed on server, logging out.");
            try {
                const mfstdate = deliveryData.get("MFSTDATE");
                const powerunit = deliveryData.get("POWERUNIT");
                const parsedResponse = parseErrorMessage(response);
                console.error(`Updating delivery manifest: [${mfstdate}] --- ${powerunit} failed on server, Status: ${parsedResponse.status} ${parsedResponse.message}`);
            } catch (ex) {
                console.error("Error: ", ex);
            }
        }
    }

    return responses;
}