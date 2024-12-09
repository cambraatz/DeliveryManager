/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { translateDate } from '../Scripts/helperFunctions';
import UserWidget from './UserWidget';

//const Header = (props) => {
const Header = (props) => {
    /*
    const [orientation,setOrientation] = useState(null);

    useEffect(() => {
        setOrientation(screen.orientation.type.split("-")[0]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[screen.orientation.type])
    */
    const deliveryCondition = () => {
        let condition = (
            <div id="widgetHeader">
                <h4 className="prompt">{props.alt}</h4>
            </div>
        );

        if (props.header === "Manifest" || props.header === "Admin"){
            condition = null;
        }
        else if (props.header === "Full"){
            condition = (
                <>
                    {/*<div id="MDPU_Row">
                        <h3>Manifest Date: <span className="weak">{props.MFSTDATE ? translateDate(props.MFSTDATE) : "00/00/0000"}</span></h3>
                        <h3>Power Unit: <span className="weak">{props.POWERUNIT}</span></h3>
                    </div>
                    <h4 className="prompt">{props.alt}</h4> */}
                    <div id="SPM_Row">
                        <div className="SPM_Col">
                            <h5>Stop No:</h5>
                            <h5 className="weak">{props.STOP}</h5>
                        </div>
                        <div className="SPM_Col">
                            <h5>Pro No:</h5>
                            <h5 className="weak">{props.PRONUMBER}</h5>
                        </div>
                        <div className="SPM_Col">
                            <h5>Manifest Key:</h5>
                            <h5 className="weak">{props.MFSTKEY}</h5>
                        </div>
                    </div>                
                </>
            )
        }
        return condition;
    };

    const company = props.company ? props.company.split(' ') : [""];


    const deliveryHeader = () => {
        let header = (
            <>
                <div id="title_div">
                    {/*h4 className="TCS_title">Transportation Computer Support, LLC</h4>*/}
                    {/*<h4 className="TCS_title">Transportation</h4>
                    <h4 className="TCS_title">Computer</h4>
                    <h4 className="TCS_title">Support,</h4>
                    <h4 className="TCS_title">LLC</h4>*/}
                    {company.map((word, index) => (<h4 className="TCS_title" key={index}>{word}</h4>))}
                </div>
                <div className="sticky_header" onClick={props.onClick}>
                    <div id="main_title">
                        <h1>Driver Manifest</h1>
                        <h2 id="title_dash">-</h2>
                        <h2>{props.title}</h2>
                    </div>
                    <UserWidget 
                        company={props.company}
                        driver={props.currUser} 
                        status={props.status} 
                        header={props.header} 
                        MFSTDATE={props.MFSTDATE} 
                        POWERUNIT={props.POWERUNIT} 
                        toggle={props.toggle}/>
                </div>
            </>
        );
        
        return header;
    }
    

    return(
        <>
        <header id="Header">
            <div id="buffer"></div>
            
            {deliveryHeader()}
        </header>
        {deliveryCondition()}
        </>
    )
};

export default Header;