/* utilities - always inject, translate */
injectScript(chrome.runtime.getURL("content-scripts/utility.js"), "body");
function addExportButtons() {
  let buttonsFlag = true
  if (buttonsFlag === true) {
    // we inject script to try to defeat CORS not allowing us to save images

    /* libraries */
    injectScript(
      chrome.runtime.getURL("included-libraries/html2canvas.js"),
      "body",
    );
    injectScript(
      chrome.runtime.getURL("included-libraries/jspdf.umd.js"),
      "body",
    );
    injectScript(
      chrome.runtime.getURL("included-libraries/turndown.min.js"),
      "body",
    );
    injectScript(
      chrome.runtime.getURL("included-libraries/turndown-plugin.min.js"),
      "body",
    );

    /* main script*/
    injectScript(
      chrome.runtime.getURL("content-scripts/export-buttons.js"),
      "body",
    )
  }
}
addExportButtons();
