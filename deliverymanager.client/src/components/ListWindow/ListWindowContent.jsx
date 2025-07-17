import "./ListWindow.css";
import PropTypes from 'prop-types';
import /*React,*/ { /*useRef,*/ useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from "../Popup/Popup";

// eslint-disable-next-line no-unused-vars
const handleKeyPress = (reference) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && reference.current) {
            e.preventDefault();
            reference.current.click();
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    }
}

const renderDeliveries = (status, deliveries) => {
    if (status === "delivered" && Object.keys(deliveries).length === 0){
        return(<tr><td align="center" colSpan="7">No deliveries completed...</td></tr>);
    }
    else if (status === "undelivered" && Object.keys(deliveries).length === 0){
        return(<tr><td align="center" colSpan="7">No remaining deliveries...</td></tr>);
    }

    //const deliveries = status === "delivered" ? delivered : undelivered;
    //console.log(deliveries);
    try {
        // eslint-disable-next-line no-unused-vars
        return Object.entries(deliveries).flatMap(([stopNum,deliveryList]) => {
            return deliveryList.map((delivery) => (
                <tr key={`${delivery.MFSTKEY}`} value={delivery.MFSTKEY} className={`Table_Body ${status}`} id={delivery.MFSTKEY}>
                    <td className="col1">{delivery.STOP}</td>
                    <td className="col2">{delivery.PRONUMBER}</td>
                    <td className="col3">{delivery.CONSNAME}</td>
                    <td className="col4">{delivery.CONSADD1}</td>
                    <td className="col5 desktop_table">{delivery.CONSADD2 ? delivery.CONSADD2 : "---"}</td>
                    <td className="col6 desktop_table">{delivery.CONSCITY}</td>
                    <td className="col7 desktop_table">{delivery.SHIPNAME}</td>
                </tr>
            ))
        });
    } catch {
        console.error("Warning: delivered table rendering error");
    }
}

const ListWindowContent = ({ status, deliveries }) => {
    const navigate = useNavigate();

    const title = status.charAt(0).toUpperCase() + status.slice(1);

    const [deliveryList,setDeliveryList] = useState([]);

    const DEFAULT_POPUP = "Success"
    const [popupType, setPopupType] = useState(DEFAULT_POPUP);
    const [popupVisible, setVisible] = useState(false);

    // new popup rendering logic...
    const openPopup = (popupType) => {
        setPopupType(popupType);
        setVisible(true);
    };

    const closePopup = () => {
        setVisible(false);
        setPopupType(DEFAULT_POPUP);
    };

    const selectDelivery = (deliveries,proNum) => {
        // eslint-disable-next-line no-unused-vars
        for (const [stopNum,list] of Object.entries(deliveries)) {
            for (const delivery of list) {
                if (delivery.PRONUMBER === proNum) {
                    if (list.length == 1) {
                        const deliveryData = {
                            delivery: delivery,
                        };
                        navigate(`/deliveries/${delivery.PRONUMBER}`, {state: deliveryData});
                        return;
                    } else {
                        setDeliveryList(list);
                        openPopup("deliveries_multiple");
                        return;
                    }
                }
            }
        }
        console.error(`delivery ${proNum} was not found in delivery list...`);
    };

    const handleClick = (event) => {
        const row = event.target.parentNode;
        const proNum = row.querySelector('.col2').textContent;

        selectDelivery(deliveries,proNum);
    }

    const handlePopupSubmit = (mfstkeys) => {
        const keySet = new Set(mfstkeys);
        const activeDeliveries = deliveryList.filter(delivery => keySet.has(delivery.MFSTKEY));
        if (activeDeliveries && activeDeliveries.length > 0) {
            const deliveryData = {
                delivery: activeDeliveries[0],
                deliveries: activeDeliveries,
            };
            navigate(`/deliveries/${deliveryData.delivery.PRONUMBER}`, {state: deliveryData});
        }
        closePopup();
        return;
    };
    
    return (
        <>
        <div className="table_div">
            <table className={`Delivery_Table ${(status === "delivered") ? "trailing_table" : ""}`} onClick={handleClick}>
                <thead>
                    <tr className="title_row">
                        <th className="title" colSpan="7">{title}</th>
                    </tr>
                    <tr className={`column_headers ${(status === "delivered") ? "delivered_items" : ""}`}>
                        <th className="col1">Stop</th>
                        <th className="col2">Pro No</th>
                        <th className="col3">Consignee</th>
                        <th className="col4">Address<span className="desktop_span"> 1</span></th>
                        <th className="col5 desktop_table">Address 2</th>
                        <th className="col6 desktop_table">City</th>
                        <th className="col7 desktop_table">Shipper</th>
                    </tr>
                </thead>
                <tbody>
                    { renderDeliveries(status, deliveries) }
                </tbody>
            </table>
        </div>
        {popupVisible && (
            <Popup 
                popupType={popupType}
                isVisible={popupVisible}
                closePopup={closePopup}
                deliveries={deliveryList}
                handleSubmit={handlePopupSubmit}
            />
        )}
        </>
    )
}

export default ListWindowContent;

ListWindowContent.propTypes = {
    status: PropTypes.string,
    deliveries: PropTypes.object,
}