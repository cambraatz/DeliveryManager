/* eslint-disable react/prop-types */

const Popup = (props) => {
    if(props.message === null){
        return(
            <>
                <div id="popupLoginPrompt" className="content">
                    <p>Confirm Delivery Info</p>
                </div>
                <div className="popupLoginContent">
                    <div>
                        <label>Delivery Date:</label>
                        <input type="date" id="dlvdate" value={props.date} className="input_form" onChange={props.handleDeliveryChange} />
                    </div>
                    <div>
                        <label>Power Unit:</label>
                        <input type="text" id="powerunit" value={props.powerunit} className="input_form" onChange={props.handleDeliveryChange} />
                    </div>
                    <div id="popupLoginInner">
                        <button onClick={props.handleUpdate}>Validate</button>
                    </div>
                </div>
            </>
        )
    }
    else if(props.message === "Invalid Delivery Information"){
        return(
            <>
                <div id="popupLoginPrompt" className="content">
                    <p>{props.message}</p>
                </div>
                <div className="popupLoginContent">
                    <div>
                        <label>Delivery Date:</label>
                        <input type="date" id="dlvdate" value={props.date} className="input_form invalid_input" onChange={props.handleDeliveryChange} />
                    </div>
                    <div>
                        <label>Power Unit:</label>
                        <input type="text" id="powerunit" value={props.powerunit} className="input_form invalid_input" onChange={props.handleDeliveryChange} />
                    </div>
                    <div id="popupLoginInner">
                        <button onClick={props.handleUpdate}>Continue</button>
                    </div>
                </div>
            </>
        )
    }
    else if(props.message === "Delivery Information Found"){
        return(
            <>
                <div id="popupLoginPrompt" className="content">
                    <p>{props.message}</p>
                </div>
            </>
        )
    }
        
    
};

export default Popup;