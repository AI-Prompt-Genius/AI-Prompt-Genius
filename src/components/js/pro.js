export async function getProStatus() {
    const wasPro = localStorage.getItem("pro") ?? "false"
    let isPro = false;
    if (wasPro === "true"){
        const key = getFromStorage("pro_key", "")
        isPro = await notFirstCheck(key)
    }
    return isPro;
}

async function firstKeyUse(license_key) {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `product_id=AkOGKEr0_Y0c3eZXKnTvDA==&license_key=${license_key}&increment_uses_count=true`
    });

    // Assuming the response is in JSON format
    const data = await response.json(); // This line extracts the response data as a JavaScript object

    return data; // If you want to return the data to the caller of 'firstKeyUse'
}

async function notFirstCheck(license_key) {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `product_id=AkOGKEr0_Y0c3eZXKnTvDA==&license_key=${license_key}&increment_uses_count=false`
    });

    // Assuming the response is in JSON format
    const data = await response.json(); // This line extracts the response data as a JavaScript object

    return data; // If you want to return the data to the caller of 'firstKeyUse'
}

