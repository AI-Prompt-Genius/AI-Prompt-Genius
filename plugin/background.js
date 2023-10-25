chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
    if (command === "open-sidebar"){
        console.warn("HEYYY")
        sidePanel.open()
    }
});