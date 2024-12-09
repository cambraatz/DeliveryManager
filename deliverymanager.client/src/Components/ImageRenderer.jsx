/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { API_URL } from '../Scripts/helperFunctions';

const ImageRenderer = (props) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!props.URL) {
            //console.log("No image to load...");
            setError(true);
            return;
        }

        const fetchImage = async () => {
            try {
                const response = await fetch(API_URL + "api/DriverChecklist/GetImage?IMAGE=" + props.URL);
                
                if (!response.ok) {
                    console.log('failed here');
                    setError(true);
                } else {
                    const image = API_URL + "api/DriverChecklist/GetImage?IMAGE=" + props.URL;
                    setImageSrc(image);
                }
            } catch (error) {
                console.log(`Image ${props.URL} was not found...`);
                setError(true);
            }
        };

        fetchImage();
    }, [props.URL]);

    if (error) {
        return (
            <div id={props.id}>
                <p>Image load failed...</p>
            </div>
        );
    }

    if (!imageSrc) {
        return (
            <div id={props.id}>
                <p>Loading image...</p>
            </div>
        );
    }
    /*
    let img_type = "Image";
    if (props.id == "img_Div_Sign") {
        img_type = "Signature"
    }*/

    return (
        <div id={props.id}>
            <img className="thumbnail" src={imageSrc} alt="Error loading image, please upload new image..." onClick={props.onClick}/>
            {/*<label className="thumbnail_label">
                <small>Replace {img_type}?</small>
            </label>*/}
        </div>
    );
};

export default ImageRenderer;