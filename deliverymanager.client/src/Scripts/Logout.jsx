import { API_URL } from "./helperFunctions";

export default async function Logout() {
    localStorage.clear();
    sessionStorage.clear();
    const response = await fetch(`${API_URL}/api/Registration/Logout`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
    })
    if (response.ok) {
        console.log("Logout Successful!");
        setTimeout(() => {
            window.location.href = `https://login.tcsservices.com`;
        },1500)
    } else {
        console.alert("Cookie removal failed, Logout failure.")
    }
}