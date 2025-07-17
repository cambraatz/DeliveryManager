/*/////////////////////////////////////////////////////////////////////
 
Author: Cameron Braatz
Date: 11/15/2023
Update Date: 1/8/2025

*//////////////////////////////////////////////////////////////////////

import { useState, useEffect } from 'react';
//import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header/Header.jsx';
import ListWindow from './ListWindow/ListWindow.jsx';
import Footer from './Footer/Footer.jsx';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner.jsx';
import Popup from './Popup/Popup.jsx';

//import { translateDate} from '../Scripts/helperFunctions';
import { Logout, /*Return*/ } from '../utils/api/sessions.js';
import { fetchDeliveryManifest } from '../utils/api/deliveries.js';
import { FAIL_WAIT, scrapeDate } from '../scripts/helperFunctions.jsx';
import { usePopup } from '../hooks/usePopup.js';
import { useAppContext } from '../hooks/useAppContext.js';

/*/////////////////////////////////////////////////////////////////////

DriverPortal() - Delivery Manifest Dynamic Table Generation

*//////////////////////////////////////////////////////////////////////

const DeliveryManifest = () => {
    const {
        loading, setLoading, // [bool] global app loading state
        session // [obj] credentials for session
    } = useAppContext();
    const { 
        popupType,
        popupVisible, 
    } = usePopup();

    /* Page rendering, navigation and state initialization... */

    // set delivery json data for table rendering...
    const [undelivered, setUndelivered] = useState({});
    const [delivered, setDelivered] = useState({});

    // rendered company state...

    // set credentials and query delivery information once on page load...
    useEffect(() => {
        if (
            session.username === "" || 
            session.mfstdate === "" || 
            session.powerunit === "" ||
            session.company === "" ||
            !session.valid
        ) {
            Logout();
        }

        getDeliveries(session.powerunit, scrapeDate(session.mfstdate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    /* Page rendering helper functions... */
    
    /* API requests + functions... */

    // query all deliveries matching the provided powerunit and date...
    async function getDeliveries(powerunit,mfstdate){
        // attempt to gather delivered + undelivered deliveries...
        try {
            setLoading(true);

            const response = await fetchDeliveryManifest(powerunit, mfstdate);
            if (response.ok) {
                const data = await response.json();
                const packagedDeliveries = packageDeliveries(data.Delivered);
                const packagedUndeliveries = packageDeliveries(data.Undelivered);

                // set delivered + undelivered states...
                setDelivered(packagedDeliveries); // package delivered if allowing batch update/deletes...
                sessionStorage.setItem("delivered", packagedDeliveries);
                setUndelivered(packagedUndeliveries);
                sessionStorage.setItem("undelivered", packagedUndeliveries);

                setLoading(false);
            }
        // divert all errors to login page...
        } catch (error) {
            console.error(error);
            // set delay before logging out...
            setTimeout(() => {
                Logout();
                return;
            }, FAIL_WAIT);
        }
    }

    // generates dynamic HTML table for returned deliveries...
    const packageDeliveries = (deliveries) => {
        const sharedAddress = (a,b) => {
            if (a.CONSADD1 === b.CONSADD1 && a.CONSADD2 === b.CONSADD2) {
                return true;
            }
            return false;
        };
    
        let i = 0;
        let currStop = null;
        let packagedDeliveries = {};
    
        while (i < deliveries.length) {
            // if address matches previous stop and has yet to be delivered...
            if (currStop && sharedAddress(deliveries[i],currStop) && deliveries[i].STATUS != "1"){
                let sharedDeliveries = [currStop];
                while (i < deliveries.length && sharedAddress(deliveries[i],currStop)) {
                    sharedDeliveries.push(deliveries[i]);
                    i += 1
                }
                packagedDeliveries[currStop.STOP] = sharedDeliveries;
            }
            // catch non-matching deliveries and delivered ones...
            else {
                currStop = deliveries[i];
                packagedDeliveries[deliveries[i].STOP] = [ deliveries[i] ];
                i += 1;
            }
        }
    
        return packagedDeliveries;
    };

    return(
        <div id="webpage">
            {loading || delivered === null || undelivered === null ? (
                <LoadingSpinner />
                ) : (
                    <>
                    <Header 
                        company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                        title="Delivery Manager"
                        subtitle="Delivery Manifest"
                        currUser={session.username}
                        logoutButton={true}
                        root={false}
                    />
                    <ListWindow
                        mfstdate={session.mfstdate}
                        powerunit={session.powerunit}
                        renderSubheader={true}
                        status="undelivered"
                        deliveries={undelivered}
                    />
                    <ListWindow
                        renderSubheader={false}
                        status="delivered"
                        deliveries={delivered}
                    />
                    <Footer className="table_window_footer" />
                    </>
            )}
            {popupVisible && (
                <Popup 
                    popupType={popupType}
                    isVisible={popupVisible}
                />
            )}
        </div>
    );
}

export default DeliveryManifest;