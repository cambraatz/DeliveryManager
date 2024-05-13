import * as React from 'react';
import { useState, useEffect} from 'react';
import { scrapeDate, renderDate, translateDate } from '../Scripts/helperFunctions';
import UserWidget from './UserWidget';

const Header = (props) => {

    const deliveryCondition = (condition) => {
        if (props.header === "Manifest"){
            return(
                <>
                    <div id="MDPU_Row">
                        <h3>Manifest Date: <span className="weak">{translateDate(props.MFSTDATE)}</span></h3>
                        <h3>Power Unit: <span className="weak">{props.POWERUNIT}</span></h3>
                    </div>
                    <h4 className="prompt">{props.alt}</h4>                    
                </>
            );
        }
        else if (props.header === "Full"){
            return(
                <>
                    <div id="MDPU_Row">
                        <h3>Manifest Date: <span className="weak">{translateDate(props.MFSTDATE)}</span></h3>
                        <h3>Power Unit: <span className="weak">{props.POWERUNIT}</span></h3>
                    </div>
                    <h4 className="prompt">{props.alt}</h4>    
                    <div id="SPM_Row">
                        <div className="SPM_Col">
                            {/*<h5>Stop No: <span className="weak">{props.STOP}</span></h5>*/}
                            <h5>Stop No:</h5>
                            <h5 className="weak">{props.STOP}</h5>
                        </div>
                        <div className="SPM_Col">
                            {/*<h5>Stop No: <span className="weak">{props.STOP}</span></h5>*/}
                            <h5>Pro No:</h5>
                            <h5 className="weak">{props.PRONUMBER}</h5>
                        </div>
                        <div className="SPM_Col">
                            {/*<h5>Stop No: <span className="weak">{props.STOP}</span></h5>*/}
                            <h5>Manifest Key:</h5>
                            <h5 className="weak">{props.MFSTKEY}</h5>
                        </div>
                    </div>                
                </>
            )
        }
        return(
            <div id="widgetHeader">
                <h4 className="prompt">{props.alt}</h4>
            </div>
        );
    };
    

    return(
        <header id="Header">
            <h4 className="TCS_title">Transportation<br/>Computer<br/>Services, LLC</h4>
            <h1 className="TCS_title">Driver Manifest</h1>
            <h2>{props.title}</h2>
            <hr></hr>
            <UserWidget driver={props.currUser} status={props.status}/>

            {deliveryCondition()}

            {/*}
            <div id="MDPU_Row">
                <h3>Manifest Date: <span className="weak">{translateDate(props.MFSTDATE)}</span></h3>
                <h3>Power Unit: <span className="weak">{props.POWERUNIT}</span></h3>
            </div>
            <div id="SPM_Row">
                <h5>Stop No: <span className="weak">{props.STOP}</span></h5>
                <h5>Pro No: <span className="weak">{props.PRONUMBER}</span></h5>
                <h5>Manifest Key: <span className="weak">{props.MFSTKEY}</span></h5>
    </div>*/}
        </header>
    )
};

export default Header;