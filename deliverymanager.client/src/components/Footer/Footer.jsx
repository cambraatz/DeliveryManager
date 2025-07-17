import PropTypes from 'prop-types';
import './Footer.css';

const Footer = (props) => {
    return(
        <div className={props.className}>
            <p className="footer_text">Developed by Transportation Computer Support, LLC.</p>
        </div>
    )
}

export default Footer;

Footer.propTypes = {
    className: PropTypes.string,
}