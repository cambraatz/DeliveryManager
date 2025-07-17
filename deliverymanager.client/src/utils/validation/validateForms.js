export function validateDeliveryConfirm(formData) {
    let isValid = true;
    let message = "";
    let dateError = null;
    let powerUnitError = null;

    const date_in_form = new Date(formData.deliverydate)
    //console.log(`date_in_form: ${date_in_form}`);

    // consolidate test logic into functions for flexibility?
    if (isNaN(date_in_form)) {
        dateError = "Valid date is required!";
        isValid = false;
    }
    if (formData.powerunit.trim() == "") {
        powerUnitError = "Valid powerunit is required!";
        isValid = false;
    }

    let errors = {
        mfstdate: "",
        powerunit: ""
    }

    if (dateError && powerUnitError) {
        errors.mfstdate = "Date and Powerunit are both required!";
        errors.powerunit = "Date and Powerunit are both required!";
        message = errors.mfstdate;
    } else if (dateError) {
        // Only date is invalid
        errors.mfstdate = dateError;
        message = dateError;
    } else if (powerUnitError) {
        // Only power unit is invalid
        errors.powerunit = powerUnitError;
        message = powerUnitError;
    }

    return {isValid, errors, message};
}

export function validateDeliveryUpdate(formData) {
    let isValid = true;
    let message = "";
    let dateError = null;
    let timeError = null;
    let piecesError = null;

    const date_in_form = new Date(formData.deliveryDate)
    if (isNaN(date_in_form)) {
        dateError = "Valid date is required!";
        isValid = false;
    }

    // flag invalid time format (implicitly not null)...
    if (!(formData.deliveryTime)) {
        /* add some time boundary threshold? */
        timeError = "Valid time is required!";
        isValid = false;
    }

    if (!formData.deliveredPieces || isNaN(parseFloat(formData.deliveredPieces))) {
        piecesError = "Valid piece count is required!";
        isValid = false;
    } else {
        const pieces = parseFloat(formData.deliveredPieces);
        if (pieces < 0 || pieces > 999) {
            piecesError = "Pieces must be between 0 and 999.";
            isValid = false;
        }
    }

    let errors = {
        dlvddate: "",
        dlvdtime: "",
        dlvdpcs: ""
    }

    if (dateError && timeError && piecesError) {
        message = "Date, Time and Pieces are all required!";
        errors.dlvddate = message;
        errors.dlvdtime = message;
        errors.dlvdpcs = message;
    } else if (dateError && timeError) {
        message = "Date and Time are both required!"
        errors.dlvddate = message;
        errors.dlvdtime = message;
    } else if (timeError && piecesError) {
        message = "Time and Pieces are both required!";
        errors.dlvdtime = message;
        errors.dlvdpcs = message;
    } else if (dateError && piecesError) {
        message = "Date and Pieces are all required!";
        errors.dlvddate = message;
        errors.dlvdpcs = message;
    } else if (dateError) {
        errors.dlvddate = dateError;
        message = dateError;
    } else if (timeError) {
        errors.dlvdtime = dateError;
        message = timeError;
    } else if (piecesError) {
        // Only power unit is invalid
        errors.dlvdpcs = piecesError;
        message = piecesError;
    }

    return {isValid, errors, message};
}