
window.useArkoseSetupEnforcement = function(myEnforcement){
    myEnforcement.setConfig({
        selector: "#test",
        onCompleted: (response) => {
            console.warn(response)
            window.alert(response)
        },
    })
}
