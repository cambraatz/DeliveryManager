import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner.jsx';

const DL_Popup = (props) => {
    const [loading,setLoading] = useState(true);
    const [dl,setDL] = useState([]);
    const [selected,setSelected] = useState([]);

    useEffect(() => {
        if (!props.deliveries || props.deliveries.length == 0) {
            setDL([]);
            setSelected([]);
            setLoading(false);
        }

        setLoading(true);
        setDL(props.deliveries);
        setSelected(props.deliveries.map((delivery) => delivery.MFSTKEY));
        setLoading(false);
    }, [props.deliveries]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelected(dl.map((delivery) => delivery.MFSTKEY))
        } else {
            setSelected([]);
        }
    };

    const handleCheckboxChange = (mfstkey) => {
        setSelected((prevSelected) => {
            return prevSelected.includes(mfstkey)
                ? prevSelected.filter((key) => key !== mfstkey)
                : [...prevSelected, mfstkey];
        });
        console.log("selected:", selected);
    };

    // <span className="desktop_table"> 1</span>
    return(
        <>
        {loading || !dl || dl.length === 0 ? (
            <LoadingSpinner />
        ) : (
            <div className="popup_DL">
                <div id="popupExit" className="content">
                    <h1 id="close" className="popupWindow" onClick={props.onClose}>&times;</h1>
                </div>
                <div className="table_div">
                    <table className="Delivery_Table cb_table">
                        <thead className="dl_table_header">
                            <tr className="title_row">
                                <th className="title" colSpan="6">{dl[0].CONSNAME}</th>
                            </tr>
                            <tr className="title_row title_secondary">
                                <td className="title" colSpan="6">{`${dl[0].CONSADD2 ? (dl[0].CONSADD1 + `, ${dl[0].CONSADD2}`) : dl[0].CONSADD1}`}</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th id="cb_select_all" className="cb_col1">
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={selected.length === dl.length} onChange={handleSelectAll} />
                                        <span className="select_all_box custom-checkmark"></span>
                                    </label>
                                </th>
                                <th className="cb_col2">Stop</th>
                                <th className="cb_col3">Pro No</th>
                                <th className="cb_col4">Manifest Key</th>
                                <th className="cb_col5 desktop_table">Pieces</th>
                                <th className="cb_col6 desktop_table">Yards</th>
                            </tr>
                            {dl.map((delivery,i) => {
                                return (
                                    <tr id={`dl_${i}`} key={`dl_${i}`} className="Table_Body"> {/*onClick={() => props.onClick(i,delivery)}>*/}
                                        <th id={`cb_select_${i}`} className="cb_col1">
                                            <label className="checkbox-container">
                                                <input type="checkbox" checked={selected.includes(delivery.MFSTKEY)} onChange={() => handleCheckboxChange(delivery.MFSTKEY)} />
                                                <span className="secondary_box custom-checkmark"></span>
                                            </label>

                                            {/*<input className="popup_checkbox" type="checkbox" checked={selected.includes(delivery.MFSTKEY)} onChange={() => handleCheckboxChange(delivery.MFSTKEY)} />*/}
                                        </th>
                                        <td className="cb_col2">{delivery.STOP}</td>
                                        <td className="cb_col3">{delivery.PRONUMBER}</td>
                                        <td className="cb_col4">{delivery.TTLPCS}</td>
                                        <td className="cb_col5 desktop_table">{delivery.TTLYDS}</td>
                                        <td className="cb_col6 desktop_table">{delivery.TTLWGT}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div id="dl_button_div">
                    <button id="dl_cancel_button" className="dl_popup_button popup_button" onClick={props.onClose}>Cancel</button>
                    <button id="dl_proceed_button" className="dl_popup_button popup_button" onClick={() => props.onClick(selected)}>Proceed</button>
                </div>
            </div>
        )}
        </>
    );
};

export default DL_Popup;

DL_Popup.propTypes = {
    deliveries: PropTypes.array, // delivery list of objects
    onClose: PropTypes.func, // close popup button (press x)
    onClick: PropTypes.func, // isolate table selection
};