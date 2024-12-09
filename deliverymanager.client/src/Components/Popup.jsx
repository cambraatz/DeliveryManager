import Success from '../assets/success.svg';
import Fail from '../assets/error.svg';

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
                        <label>Delivery Date</label>
                        <input type="date" id="dlvdate" value={props.date} className="input_form" onChange={props.handleDeliveryChange} />
                    </div>
                    <div>
                        <label>Power Unit</label>
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
                        <label>Delivery Date</label>
                        <input type="date" id="dlvdate" value={props.date} className="input_form invalid_input" onChange={props.handleDeliveryChange} />
                    </div>
                    <div>
                        <label>Power Unit</label>
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
    else if(props.message === "Signature"){
        return(
            <>
                <div id="popupLoginPrompt" className="content">
                    <p>Confirm Delivery Info</p>
                </div>
                <div className="popupLoginContent">
                    <div>
                        <label>Delivery Date</label>
                        <input type="date" id="dlvdate" value={props.date} className="input_form" onChange={props.handleDeliveryChange} />
                    </div>
                    <div>
                        <label>Power Unit</label>
                        <input type="text" id="powerunit" value={props.powerunit} className="input_form" onChange={props.handleDeliveryChange} />
                    </div>
                    <div id="popupLoginInner">
                        <button onClick={props.handleUpdate}>Validate</button>
                    </div>
                </div>
            </>
        )
    }
    /*else if(props.message === "Admin"){
        return(
            <>
                <div className="popupLoginContent">
                    <div>
                        <label>Username</label>
                        <input type="text" id="username" value={props.credentials.USERNAME} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="text" id="password" value={props.credentials.PASSWORD} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div>
                        <label>Power Unit</label>
                        <input type="text" id="powerunit" value={props.credentials.POWERUNIT} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div id="update_user">
                        <button className="popup_button" onClick={props.onPressFunc.updateDriver}>Update User</button>
                    </div>
                    <div id="remove_user">
                        <button className="popup_button" onClick={props.pressButton}>Remove User</button>
                    </div>
                </div>
            </>
        )
    }*/
    else if(props.message === "Edit User"){
        return(
            <>
                <div className="popupLoginContent">
                    <div>
                        <label>Username</label>
                        <input type="text" id="username" value={props.credentials.USERNAME} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="text" id="password" value={props.credentials.PASSWORD ? props.credentials.PASSWORD : ""} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div>
                        <label>Power Unit</label>
                        <input type="text" id="powerunit" value={props.credentials.POWERUNIT} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div id="submit_user">
                        <button className="popup_button" onClick={props.onPressFunc.updateDriver}>Update User</button>
                    </div>
                    <div id="remove_user">
                        <button className="popup_button" onClick={props.onPressFunc.removeDriver}>Remove User</button>
                    </div>
                    <div id="cancel_user" >
                        <button className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                    </div>
                </div>
            </>
        )
    }
    else if(props.message === "Edit New User"){
        //console.log("props.message: ", props.message); onSubmit={props.pressButton}
        return(
            <div className="popupLoginContent">
                <div id="popupLoginPrompt" className="content">
                    <p>Set Password</p>
                </div>
                <div>
                    <label>Username</label>
                    <input type="text" id="username" value={props.credentials.USERNAME} className="input_form" onChange={props.updateNew} disabled/>
                </div>
                <div>
                    <label>Password</label>
                    <input type="text" id="password" value={props.credentials.PASSWORD} className="input_form" onChange={props.updateNew} required/>
                </div>
                <div>
                    <label>Power Unit</label>
                    <input type="text" id="powerunit" value={props.credentials.POWERUNIT} className="input_form" onChange={props.updateNew} required/>
                </div>
                <div id="submit_user">
                    <button className="popup_button" onClick={props.onPressFunc.updateDriver}>Update User</button>
                </div>
                <div id="cancel_user">
                    <button type="button" className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                </div>
            </div>
        )
    }
    else if(props.message === "Add User"){
        return(
            <div className="popupLoginContent">
                <div>
                    <label>Username</label>
                    <input type="text" id="username" value={props.credentials.USERNAME} className="input_form" onChange={props.handleUpdate} required/>
                </div>
                <div>
                    <label>Power Unit</label>
                    <input type="text" id="powerunit" value={props.credentials.POWERUNIT} className="input_form" onChange={props.handleUpdate} required/>
                </div>
                <div id="add_user">
                    <button type="button" className="popup_button" onClick={props.onPressFunc.addDriver}>Add User</button>
                </div>
                <div id="cancel_user">
                    <button type="button" className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                </div>
            </div>
        )
    }
    // admin logic...
    else if(props.message === "Find User"){
        return(
            <>
                <div className="popupLoginContent">
                    <div>
                        <label>Username</label>
                        <input type="text" id="username" value={props.credentials.USERNAME} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div id="find_user">
                        <button id="find_user" className="popup_button" onClick={props.onPressFunc.pullDriver}>Find User</button>
                    </div>
                    <div id="cancel_user">
                        <button className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                    </div>
                </div>
            </>
        )
    }
    // login logic...
    else if(props.message === "New User Signin"){
        return(
            <>
                <div className="popupLoginContent">
                    <div>
                        <label>Username</label>
                        <input type="text" id="username" value={props.credentials.USERNAME ? props.credentials.USERNAME : ""} className="input_form" onChange={props.updateNew}/>
                    </div>
                    <div id="set_password">
                        <button id="set_password" className="popup_button" onClick={props.pressButton}>Authorize</button>
                    </div>
                    <div id="cancel_user">
                        <button className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                    </div>
                </div>
            </>
        )
    }
    else if(props.message === "Change Company"){
        return(
            <>
                <div className="popupLoginContent">
                    <div>
                        <label>Company Name</label>
                        <input type="text" id="company" value={props.company} className="input_form" onChange={props.handleUpdate}/>
                    </div>
                    <div id="submit_company">
                        <button className="popup_button" onClick={props.onPressFunc.updateCompany}>Update Company</button>
                    </div>
                    <div id="cancel_user">
                        <button className="popup_button" onClick={props.onPressFunc.cancelDriver}>Cancel</button>
                    </div>
                </div>
            </>
        )
    }
    else if(props.message === "Add Success"){
        const user = props.credentials.USERNAME;
        return(
            <>
                <div className="popupLoginContent">
                    <img id="success" src={Success} alt="succss"/>
                    <p>{user} was added successfully!</p>
                </div>
            </>
        )
    }
    else if(props.message === "Update Success"){
        const user = props.credentials.USERNAME;
        return(
            <>
                <div className="popupLoginContent">
                    <img id="success" src={Success} alt="succss"/>
                    <p>{user} successfully updated!</p>
                </div>
            </>
        )
    }
    else if(props.message === "Delete Success"){
        const user = props.credentials.USERNAME;
        return(
            <>
                <div className="popupLoginContent">
                    <img id="success" src={Success} alt="succss"/>
                    <p>{user} successfully deleted!</p>
                </div>
            </>
        )
    }
    else if(props.message === "Company Success"){
        const company = props.company;
        return(
            <>
                <div className="popupLoginContent">
                    <img id="success" src={Success} alt="succss"/>
                    <p>{company} successfully updated!</p>
                </div>
            </>
        )
    }
    else if(props.message === "Fail"){
        return(
            <>
                <div className="popupLoginContent">
                    <img id="fail" src={Fail} alt="fail"/>
                    <p>Oops! Something went wrong, please try again.</p>
                </div>
            </>
        )
    }
};

export default Popup;