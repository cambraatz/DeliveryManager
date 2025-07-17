import PropTypes from 'prop-types';
import UserWidget from '../UserWidget/UserWidget';
import toggleDots from '../../assets/Toggle_Dots.svg';
import "./Header.css";

import { useAppContext } from '../../hooks/useAppContext';

const Header = ({ 
    company, 
    title, 
    subtitle,
    currUser, 
    logoutButton, 
    root 
}) => {
    const { collapsed, setCollapsed } = useAppContext();

    const toggleHeader = () => {
        setCollapsed(prevCollapsed => !prevCollapsed);
        // phase this out...
        const collapsedSS = sessionStorage.getItem("collapsed") === "true";
        sessionStorage.setItem("collapsed", !collapsedSS);
    }

    return(
        <header className={`header ${collapsed ? "collapsed-header" : ''}`}>
            <div className={`buffer ${collapsed ? "collapsed-buffer" : ''}`}></div>
            
            <div className={`company_title ${collapsed ? "hidden" : ''}`}>
                {company.map((word, index) => (
                    <h4 className="company_list_title" key={index}>{word}</h4>
                ))}
            </div>
            <div className="sticky_header">
                <div className={`module_title ${collapsed ? "hidden" : ''}`}>
                    <h1>{title}</h1>
                    {/*<h2 id="title_dash">-</h2>*/}
                    <h2>{subtitle}</h2>
                </div>
                <div id="collapse_toggle_button" onClick={toggleHeader}>
                    <img id="toggle_dots" src={toggleDots} alt="toggle dots" />
                </div>
                <UserWidget 
                    currUser={currUser} 
                    logoutButton={logoutButton}
                    root={root}
                />
            </div>
        </header>
    )
};

export default Header;

// *state variable actively managed in parent...
Header.propTypes = {
    company: PropTypes.array, // var company name {activeCompany}*
    title: PropTypes.string, // const module name
    subtitle: PropTypes.string, // const page title
    currUser: PropTypes.string, // var current username {currUser}*
    logoutButton: PropTypes.bool, // render logout button?
    root: PropTypes.bool
};