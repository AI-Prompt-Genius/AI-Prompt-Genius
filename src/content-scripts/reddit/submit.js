if (typeof browser === "undefined"){
    browser = chrome;
}
function switch_to_fancy_pants(){ // will add settings toggle, but I think most people will want to switch to fancy pants
    let switch_btn = document.querySelector('._3uJP0daPEH2plzVEYyTdaH')
    console.log(switch_btn)
    switch_btn.click()
    let confirm_btn = document.querySelector('._2R3RlhymCOkPrz9TusvcPq').querySelector('._10BQ7pjWbeYP63SAPNS8Ts')
    confirm_btn.click()
}

chrome.storage.local.get({settings: {visual_editor: true}}, function(result) {
    if (result.settings.visual_editor === true) {
        setTimeout(switch_to_fancy_pants, 100) // short timeout for slow pages
    }
})