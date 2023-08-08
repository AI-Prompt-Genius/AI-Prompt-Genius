window.useArkoseSetupEnforcement = function(myEnforcement){
    myEnforcement.setConfig({
        selector: ".arkose-35536E1E-65B4-4D96-9D97-6ADB7EFF8147-wrapper > div",
        onCompleted: (response) => {
            console.warn(response)
            window.alert(response)
        },
    })
}
