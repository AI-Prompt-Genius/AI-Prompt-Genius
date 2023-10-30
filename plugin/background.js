chrome.commands.onCommand.addListener((command, tab) => {
    console.error(`Command: ${command}`);
    if (command === "open-sidebar"){
        chrome.sidePanel.open({ windowId: tab.windowId })
    }
});