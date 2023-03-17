let myAuth;
async function auth() {
    async function getAuth() {
        const fetchResult = await fetch("https://chat.openai.com/api/auth/session?stop=true", {
            method: "GET",
            headers: {
                'content-type': 'application/json',
            }
        })
        return await fetchResult.json()
    }
    getAuth().then(result => {
        myAuth = result.accessToken
        chrome.storage.local.set({auth: myAuth})
        getAccountStatus()
    })
}
auth()

async function getAccountStatus(){
    function fetchy() {
        return fetch(`https://chat.openai.com/backend-api/accounts/check`, {
            method: "GET",
            headers: {
                'content-type': 'application/json',
                Authorization: myAuth
            }
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        })
    }
    let data = await fetchy()
    console.log(data)
    let isPlus = data?.account_plan?.is_paid_subscription_active
    console.log("Plus USER: "+ isPlus)
    let plusVal = JSON.stringify(isPlus)
    document.body.appendChild(document.createElement(`input`)).setAttribute("id", "plusNetwork")
    document.querySelector("#plusNetwork").setAttribute("type", "hidden")
    document.querySelector("#plusNetwork").value = plusVal
}