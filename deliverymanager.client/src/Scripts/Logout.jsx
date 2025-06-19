import { API_URL } from "./helperFunctions";

export default async function Logout() {
    localStorage.clear();
    sessionStorage.clear();
    const response = await fetch(`${API_URL}/v1/sessions/logout`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
    })
    if (response.ok) {
        //console.log("Logout Successful!");
        window.location.href = `https://login.tcsservices.com`;
    } else {
        console.alert("Cookie removal failed, Logout failure.")
    }
}