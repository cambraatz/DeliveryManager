import { useRef } from 'react';
import PropTypes from 'prop-types';
//import ReactDOM from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import './SignatureField.css';

const SignatureField = ({ onSubmit }) => {
    const sigCanvas = useRef(null);
    //const [image, setImage] = useState(null);

    const clearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            //setImage(null);
        }
    };

    async function acceptSignature() {
        let url = null;
        if (sigCanvas.current) {
            url = sigCanvas.current.toDataURL();
            //setImage(url);
        }
        const base64Data = url;
        const response = await fetch(base64Data);
        const blob = await response.blob()

        const fileName = 'blobToJPG.jpg';
        // eslint-disable-next-line no-unused-vars
        const jpegFile = new File([blob], fileName, { type: 'image/jpeg' });

        //props.onSubmit(jpegFile);
        onSubmit(blob);
    }

    return (
        <div id="sigDiv">
            <SignatureCanvas id="sigCanvas" ref={sigCanvas} penColor='black' canvasProps={{border: '1px solid black', className: 'sigCanvas'}} />
            <div>
                <button onClick={clearSignature} type="button">Clear Signature</button>
                <button onClick={acceptSignature} type="button">Submit Signature</button>
            </div>
        </div>
    );
};

export default SignatureField;

SignatureField.propTypes = {
    onSubmit: PropTypes.func,
}