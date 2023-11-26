function main() {
    document.head.insertAdjacentHTML("beforeend", styles())
    document.body.insertAdjacentHTML("beforeend", modal())
}
const existing_modal = document.getElementById("modal-pg")
if (!existing_modal) main()
function modal() {
    const url = chrome.runtime.getURL("pages/search.html")
    return `
    <div id="modal-pg" class="modal-pg">
        <!-- Modal content -->
        <div class="modal-content-pg">
            <iframe csp="" class="pg-iframe" src=${url} style="width:100%; height:100%;"></iframe>
        </div>
    </div>
`
}

function styles() {
    return `
    <style>
    /* Modal styling */
.modal-pg {
    display: block; /* Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 10000000000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content */
.modal-content-pg {
    background-color: #fefefe;
    margin: 15% auto; /* 15% from the top and centered */
    padding: 0px;
    border: none; /* No border */
    width: 80%; /* Could be more or less, depending on screen size */
}

.pg-iframe {
    border: none; /* Remove border for the iframe */
}
</style>
    `
}
