// TODO, move this somewhere more central
let current_url = window.location.href;
function check_url() {
  // basically, constantly vigils and readds the menu buttons if they disappear for whatever reason
  if (!document.getElementById("download-markdown-button")) {
    window.postMessage(
      {
        type: "readdExportButtons",
      },
      "*",
    );
  }
}
setInterval(check_url, 500);
