if (typeof browser === "undefined") {
    browser = chrome
}

console.log(`Adding export buttons...`);

let markdown_box = document.createElement("div");
markdown_box.setAttribute("id", "markdown_box");
document.querySelector('main').appendChild(markdown_box);
let mdb = document.querySelector("#markdown_box");
mdb.style.display = "none";

function dropDownStyleAndScript(){
    let style =
        `
        <style>
        /* Dropdown Content (Hidden by Default) */
        .dropdown-content {
          display: none;
          border: 1px solid #f1f1f1;
          border-radius: 10px;
          z-index: 1;
        }
        
        #shareExport {
           border: none !important;
        }
          
        /* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
        .show {display:block;} !important
        </style>
        `
    document.head.insertAdjacentHTML('beforeend', style)
}

function createChromeDropDown(){
    let button_class = 'flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
    let shareSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" style="fill: white" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3V320c0 17.7 14.3 32 32 32s32-14.3 32-32V109.3l73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 53 43 96 96 96H352c53 0 96-43 96-96V352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V352z"/></svg>`
    let html =
    `
    <div class="dropdown">
        <a id="shareExport" class="dropbtn ${button_class}">${shareSVG} Share & Export</a>
        <div id="myDropdown" class="dropdown-content">
            <a id="download-pdf-button" class="${button_class}"><svg viewBox="0 0 24 24" width="18" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Download PDF</a>
            <a id="download-png-button" class="${button_class}"><svg xmlns="http://www.w3.org/2000/svg" style="fill: white" stroke="currentColor" width="18" height="19" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48z"></path></svg> Download PNG</a>
            <a id="download-markdown-button" class="${button_class}"><svg xmlns="http://www.w3.org/2000/svg" width="18" style="fill: white" viewBox="0 0 640 512"><path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"></path></svg> Export md</a>
            <a id="share-link-button" class="${button_class}"><svg xmlns="http://www.w3.org/2000/svg" style="fill: white" viewBox="0 0 640 512" width="18"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg> Share Link</a>
        </div>
    </div>
    `
    let nav = document.querySelector('nav > div')
    nav.insertAdjacentHTML("afterend", html);

    /* When the user clicks on the button,
    toggle between hiding and showing the dropdown content */
    function showDropDown() {
        console.log("showing dropdown")
        document.getElementById("myDropdown").classList.toggle("show");
    }
    document.querySelector('#shareExport').addEventListener('click', showDropDown)

    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
}

// BEGIN PDF/PNG/HTML DOWNLOAD BUTTONS
function add_buttons(){ // generated by ChatGPT
	console.log("Hello World!");
    if(!firefox)
    {
        createChromeDropDown()
        dropDownStyleAndScript()
        let pdf = document.querySelector('#download-pdf-button');
        let png = document.querySelector('#download-png-button');
        let buttonExportToMarkdown = document.querySelector('#download-markdown-button');
        let shareButton = document.querySelector('#share-link-button');
        pdf.onclick = () => {
            downloadThread({ as: Format.PDF });
        };
        png.onclick = () => {
            downloadThread({ as: Format.PNG });
        }
        buttonExportToMarkdown.onclick = () => {
            let fileName = `${document.title}.md`;
            let data = get_current_chat_text();
            let blob = convertChatToMarkdown(data, document.title);
            downloadBlobAsFile(blob, fileName);
        }
        shareButton.onclick = () => {
            sendRequest()
        }
    }
    else{
        let nav = document.querySelector('nav')
        let buttonExportToMarkdown = document.createElement("a");
        buttonExportToMarkdown.id = 'download-markdown-button';
        buttonExportToMarkdown.onclick = () => {
            let fileName = `${document.title}.md`;
            let data = get_current_chat_text();
            let blob = convertChatToMarkdown(data, document.title);
            downloadBlobAsFile(blob, fileName);
        }
        buttonExportToMarkdown.setAttribute("class", button_class)
        let markdown_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" style="fill: white" viewBox="0 0 640 512"><path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"/></svg>`
        buttonExportToMarkdown.innerHTML = `${markdown_svg} Export md`;
        nav.insertBefore(buttonExportToMarkdown, nav.children[nav.children.length-4]);
    }
}
function exportMain() {
    let buttons;
    browser.storage.local.get({settings: defaults}, function (result) {
        let settings = result.settings
        buttons = true; // temp for testing
		// I have no idea why, but if this is put after add_buttons it just... doesn't go.
		readdThemeSelect(); // just going to yoink this in here, from themes.js, as this is more convenient.
        if (buttons === true) {
            if (!document.getElementById('download-markdown-button')) {
                add_buttons();
            }
        }
    })
}
exportMain()
let current_url = window.location.href;

function check_url() {
    if (current_url !== window.location.href) {
        current_url = window.location.href;
        setTimeout(exportMain, 500)
        console.log("URL CHANGE")
    }
}

setInterval(check_url, 500);

const Format = {
    PNG: "png",
    PDF: "pdf",
};

function getData() {
    const globalCSS = getCSSFromSheet(
        document.querySelector("link[rel=stylesheet]").sheet
    );
    const localCSS =
        getCSSFromSheet(
            document.querySelector(`style[data-styled][data-styled-version]`).sheet
        ) || "body{}";
    const data = {
        main: document.querySelector("main").outerHTML,
        // css: `${globalCSS} /* GLOBAL-LOCAL */ ${localCSS}`,
        globalCSS,
        localCSS,
    };
    return data;
}

async function sendRequest() {
    function conversationData() {
        let threadContainer = document.querySelector("[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div");
        if (threadContainer === null) {
            threadContainer = document.querySelector("main > div > div > div");
        }
        var result = {
            avatarUrl: getAvatarImage(),
            items: [],
        };

        for (const node of threadContainer.children) {
            console.log(node)
            const markdownContent = node.querySelector(".markdown");

            // tailwind class indicates human or gpt
            if ([...node.classList].includes("dark:bg-gray-800")) {
                result.items.push({
                    from: "human",
                    value: node.textContent,
                });
                // if it's a GPT response, it might contain code blocks
            } else if ([...node.classList].includes("bg-gray-50")) {
                result.items.push({
                    from: "gpt",
                    value: markdownContent.outerHTML,
                });
            }
        }

        return result;
    }

    function getAvatarImage() {
        // Create a canvas element
        const canvas = document.createElement("canvas");

        let image = document.querySelectorAll("img")[1];
        console.log(image)

        if (image === undefined) {
            image = document.querySelector("img");
        }

        // Set the canvas size to 30x30 pixels
        canvas.width = 30;
        canvas.height = 30;

        // Draw the img onto the canvas
        canvas.getContext("2d").drawImage(image, 0, 0);

        // Convert the canvas to a base64 string as a JPEG image
        const base64 = canvas.toDataURL("image/jpeg");

        return base64;
    }
    let cd = conversationData();
    const res = await fetch("https://sharegpt.com/api/conversations", {
        body: JSON.stringify(cd),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
    });
    const {id} = await res.json();
    const url = `https://shareg.pt/${id}`; // short link to the ShareGPT post
    window.open(url, "_blank");
}

function handleImg(imgData) {
    const binaryData = atob(imgData.split("base64,")[1]);
    const data = [];
    for (let i = 0; i < binaryData.length; i++) {
        data.push(binaryData.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(data)], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");

    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = "chat-gpt-image.png";
    //   a.click();
}
function handlePdf(imgData, canvas, pixelRatio) {
    const { jsPDF } = window.jspdf;
    const orientation = canvas.width > canvas.height ? "l" : "p";
    var pdf = new jsPDF(orientation, "pt", [
        canvas.width / pixelRatio,
        canvas.height / pixelRatio,
    ]);
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    let title = document.title
    pdf.save(title + ".pdf");
}


class Elements {
    constructor() {
        this.init();
    }
    init() {
        // this.threadWrapper = document.querySelector(".cdfdFe");
        this.spacer = document.querySelector(".w-full.h-48.flex-shrink-0");
        this.thread = document.querySelector("[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div");
        if (this.thread === null) {
            this.thread = document.querySelector("main > div > div > div");
        }
        this.positionForm = document.querySelector("form").parentNode;
        // this.styledThread = document.querySelector("main");
        // this.threadContent = document.querySelector(".gAnhyd");
        this.scroller = Array.from(
            document.querySelectorAll('[class*="react-scroll-to"]')
        ).filter((el) => el.classList.contains("h-full"))[0];
        this.hiddens = Array.from(document.querySelectorAll(".overflow-hidden"));
        this.images = Array.from(document.querySelectorAll("img[srcset]"));
    }
    fixLocation() {
        this.hiddens.forEach((el) => {
            el.classList.remove("overflow-hidden");
        });
        this.spacer.style.display = "none";
        this.thread.style.maxWidth = "960px";
        this.thread.style.marginInline = "auto";
        this.positionForm.style.display = "none";
        if (this.scroller) {
            this.scroller.classList.remove("h-full");
            this.scroller.style.minHeight = "100vh";
        }
        this.images.forEach((img) => {
            const srcset = img.getAttribute("srcset");
            img.setAttribute("srcset_old", srcset);
            img.setAttribute("srcset", "");
        });
        //Fix to the text shifting down when generating the canvas
        document.body.style.lineHeight = "0.5";
    }
    restoreLocation() {
        this.hiddens.forEach((el) => {
            el.classList.add("overflow-hidden");
        });
        this.spacer.style.display = null;
        this.thread.style.maxWidth = null;
        this.thread.style.marginInline = null;
        this.positionForm.style.display = null;
        if (this.scroller) {
            this.scroller.classList.add("h-full");
            this.scroller.style.minHeight = null;
        }
        this.images.forEach((img) => {
            const srcset = img.getAttribute("srcset_old");
            img.setAttribute("srcset", srcset);
            img.setAttribute("srcset_old", "");
        });
        document.body.style.lineHeight = null;
    }
}

function downloadThread({ as = Format.PNG } = {}) {
    const elements = new Elements();
    elements.fixLocation();
    const pixelRatio = window.devicePixelRatio;
    const minRatio = as === Format.PDF ? 2 : 2.5;
    window.devicePixelRatio = Math.max(pixelRatio, minRatio);

    html2canvas(elements.thread, {
        letterRendering: true,
    }).then(async function (canvas) {
        elements.restoreLocation();
        window.devicePixelRatio = pixelRatio;
        const imgData = canvas.toDataURL("image/png");
        requestAnimationFrame(() => {
            if (as === Format.PDF) {
                return handlePdf(imgData, canvas, pixelRatio);
            } else {
                handleImg(imgData);
            }
        });
    });
}