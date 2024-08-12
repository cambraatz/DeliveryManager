export const scrapeDate = (date) => {
    const year = date.slice(0,4);
    const month = date.slice(5,7);
    const day = date.slice(8);
    return month + day + year;
};

export const renderDate = (date) => {
    const year = date.slice(0,4);
    const month = date.slice(5,7);
    const day = date.slice(8);
    return year + "-" + month + "-" + day;
};

export const renderTime = (time) => {
    const hour = time.slice(0,2);
    const minute = time.slice(2);
    const new_time = hour + ":" + minute;
    return new_time
};
/*
export const translateDate = (date) => {
    const month = date.slice(0,2);
    const day = date.slice(2,4);
    const year = date.slice(4);
    return month + "/" + day + "/" + year;
};
*/
export const translateDate = (date) => {
    const month = date.slice(0,2);
    const day = date.slice(2,4);
    const year = date.slice(4);
    return year + "-" + month + "-" + day
};

export const getDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    var month = now.getMonth() + 1;

    if (month < 10) {month = "0" + month;}
    var day = now.getDate();

    if (day < 10) {day = "0" + day;}

    const currDate = year + "-" + month + "-" + day;
    return currDate;
};

export const getTime = () => {
    const now = new Date();
    var hours = now.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    }
    var minutes = now.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes
    }
    const currTime = hours + ":" + minutes;
    return currTime;
};

export const scrapeTime = (time) => {
    const hour = time.slice(0, 2);
    const minute = time.slice(3);
    return hour + minute;
};

export const scrapeFile = (file) => {
    const relLink = file.slice(12);
    return relLink;
};

export const API_URL = "http://www.deliverymanager.tcsservices.com:40730/"
//export const API_URL = "http://localhost:5113/";
