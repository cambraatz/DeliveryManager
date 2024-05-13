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

export const translateDate = (date) => {
    const month = date.slice(0,2);
    const day = date.slice(2,4);
    const year = date.slice(4);
    return month + "/" + day + "/" + year;
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