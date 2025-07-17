import PropTypes from 'prop-types';
import ListWindowContent from "./ListWindowContent";
import "./ListWindow.css";

const ListWindow = ({ mfstdate, powerunit, renderSubheader, status, deliveries }) => {
    return(
        <>
            {renderSubheader && (
                <div className="list_window_subheader">
                    <div className="list_window_subheader_item">
                        <h4>Manifest Date:</h4>
                        <h4 className="weak">{mfstdate}</h4>
                    </div>
                    <div className="list_window_subheader_item">
                        <h4>Power Unit:</h4>
                        <h4 className="weak">{powerunit}</h4>
                    </div>
                </div>
            )}
            <ListWindowContent 
                status={status}
                deliveries={deliveries}
            />
        </>
    )
};

export default ListWindow;

ListWindow.propTypes = {
    mfstdate: PropTypes.string,
    powerunit: PropTypes.string,

    renderSubheader: PropTypes.bool,
    status: PropTypes.string,
    deliveries: PropTypes.object,
};