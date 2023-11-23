// we use an IIFE so as to not pollute the global namespace in the page
// unlike other scripts, this will be injected, and so namespace pollution does matter
const ExportButtons = (function () {
  const ADD_BUTTONS_DELAY = 500;

  let markdown_box = document.createElement("div");
  markdown_box.setAttribute("id", "markdown_box");
  if (document.querySelector("main"))
    document.querySelector("main").appendChild(markdown_box);
  let mdb = document.querySelector("#markdown_box");
  if (mdb) mdb.style.display = "none";

  const Format = {
    PNG: "png",
    PDF: "pdf",
    MD: "markdown",
  };

  function messageToMarkdown(html) {
    var converter = new TurndownService({
      codeBlockStyle: "fenced",
      emDelimiter: "*",
    });
    var gfm = turndownPluginGfm.gfm;
    converter.addRule("math", {
      filter: function (node) {
        return node.classList.contains("math");
      },
      replacement: function (content, node, options) {
        const text = node.querySelector("annotation").textContent;
        console.log(text);
        return `$${text}$`;
      },
    });
    converter.use(gfm);
    const md = converter.turndown(html);
    return md;
  }

  function convertChatToMarkdown(chat, title) {
    let string = "";
    if (title) {
      string += "# " + title + "\n";
    } else {
      string += "# " + `ChatGPT Conversation` + "\n";
    }
    string += "\n"; // two newlines because MD is like that
    let convo = chat;
    for (let i = 0; i < convo.length; i++) {
      let speaker = i % 2 === 0 ? "Human" : "Assistant";
      string += "**" + speaker + ":**\n";
      string += convo[i] + "\n";
      string += "\n";
      string += "***\n";
      string += "\n";
    }

    // timestamp
    let date = getDate();
    let time = getTime();

    string += `Exported on ` + date + " " + time + ".";

    let blob = encodeStringAsBlob(string);
    return blob;
  }

  function getCurrentChatText() {
    let mainElement = document.querySelector("main");
    // new version is probaby more robust, can't see how they would change the flex col anytime soon
    let chatContainer = mainElement.querySelector(".flex.flex-col.text-sm.gizmo\\:pb-9.dark\\:bg-gray-800");

    console.log(chatContainer)
    // what is one part of a conversation called again? let's just call it a chat bubble
    let chatBubbleElements = chatContainer.children;
    let chat = [];

    const isPlus = true;
    const startIndex = isPlus ? 1 : 0;
    // remember to disregard the last element, which is always a filler element
    for (let i = startIndex; i < chatBubbleElements.length - 1; i++) {
      let isHuman = i % 2 === 0;
      if (isPlus) isHuman = !isHuman;
      let chatBubble = chatBubbleElements[i];
      let text = getChatBubbleText(chatBubble, isHuman);
      chat.push(text);
    }

    return chat;
  }

  function formatCodeBlocks(node) {
    // Clone the input node to work with the clone, not the original node.
    const fragment = node.cloneNode(true);

    // Get all the <pre> elements in the clone.
    const preElements = fragment.querySelectorAll("pre");

    // Iterate through each <pre> element and replace it with its <code> content.
    preElements.forEach((preElement) => {
      const codeContent = preElement.querySelector("code").outerHTML;
      preElement.innerHTML = codeContent;
    });

    // Return the modified clone with code blocks replaced.
    return fragment;
  }

  // gets chat with errors, for current export.
  function getChatBubbleText(chatBubble, isHuman) {
    let text;
    if (isHuman) {
      text = chatBubble;
      if (chatBubble.tagName === "BUTTON") {
        // query the textarea instead
        text = chatBubble.querySelector("textarea");
      }
      text = messageToMarkdown(text.innerText);
    } else {
      text = messageToMarkdown(
        formatCodeBlocks(chatBubble.querySelector(".prose")).outerHTML,
      ); // saves as html
    }
    return text;
  }

  /* GUI functions */
  function addDropDownStyle() {
    let style = document.createElement("style");
    style.innerHTML = `
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
			.show {display:block;} !important`;
    document.head.appendChild(style);
  }

  function createDropDown() {
    const button_class =
      "flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm";
    const shareSVG = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" width="16" style="fill: white"  viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;

    let html = `
		<div class="dropdown">
		<div id="myDropdown" class="dropdown-content">
		<a id="download-pdf-button" class="${button_class}"><svg viewBox="0 0 24 24" width="18" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Download PDF</a>
		<a id="download-png-button" class="${button_class}"><svg xmlns="http://www.w3.org/2000/svg" style="fill: white" stroke="currentColor" width="18" height="19" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48z"></path></svg> Download PNG</a>
		<a id="download-markdown-button" class="${button_class}"><svg xmlns="http://www.w3.org/2000/svg" width="18" style="fill: white" viewBox="0 0 640 512"><path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"></path></svg>Export md</a>
		</div>
		<a id="shareExport" class="dropbtn ${button_class}">${shareSVG} Export</a>
		</div>
		`;
    const nav = document.querySelector("nav");
    nav.insertAdjacentHTML("beforeend", html);

    /* When the user clicks on the button,
		toggle between hiding and showing the dropdown content */
    function showDropDown() {
      //console.log("showing dropdown")
      document.getElementById("myDropdown").classList.toggle("show");
    }
    document
      .querySelector("#shareExport")
      .addEventListener("click", showDropDown);

    // Close the dropdown menu if the user clicks outside of it
    document.body.addEventListener("click", function (event) {
      if (!event.target.matches(".dropbtn")) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains("show")) {
            openDropdown.classList.remove("show");
          }
        }
      }
    });
  }

  function createButtons() {
    // generated by ChatGPT
    createDropDown();
    addDropDownStyle();
    // add listeners
    let pdfButton = document.querySelector("#download-pdf-button");
    let pngButton = document.querySelector("#download-png-button");
    let markdownButton = document.querySelector("#download-markdown-button");

    pdfButton.onclick = () => {
      ExportButtons.downloadThread(Format.PDF);
    };
    pngButton.onclick = () => {
      ExportButtons.downloadThread(Format.PNG);
    };
    markdownButton.onclick = () => {
      ExportButtons.downloadThread(Format.MD);
    };
  }

  class Elements {
    constructor() {
      this.init();
    }
    init() {
      // this.threadWrapper = document.querySelector(".cdfdFe");
      this.thread = document.querySelector(
        "[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div",
      );
      if (this.thread === undefined) {
        this.thread = document.querySelector("main > div > div > div");
      }
      this.spacer =
        this.thread.querySelectorAll("div")[
          this.thread.querySelectorAll("div").length - 1
        ];
      this.positionForm = document.querySelector("form").parentNode;
      // this.styledThread = document.querySelector("main");
      // this.threadContent = document.querySelector(".gAnhyd");
      this.scroller = Array.from(
        document.querySelectorAll('[class*="react-scroll-to"]'),
      ).filter((el) => el.classList.contains("h-full"))[0];
      this.hiddens = Array.from(document.querySelectorAll(".overflow-hidden"));
      this.images = Array.from(document.querySelectorAll("img[srcset]"));
    }
    fixLocation() {
      this.hiddens.forEach((el) => {
        el.classList.remove("overflow-hidden");
      });
      if (this.spacer) this.spacer.style.display = "none";
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
      if (this.spacer) this.spacer.style.display = null;
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

  function handleImg(imgData) {
    const binaryData = atob(imgData.split("base64,")[1]);
    const data = [];
    for (let i = 0; i < binaryData.length; i++) {
      data.push(binaryData.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(data)], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
  }

  function handlePdf(imgData, canvas, pixelRatio) {
    const { jsPDF } = window.jspdf;
    const orientation = canvas.width > canvas.height ? "l" : "p";
    var pdf = new jsPDF(
      orientation,
      "pt",
      [canvas.width / pixelRatio, canvas.height / pixelRatio],
      true,
    );
    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, "", "FAST");
    let title = document.title;
    pdf.save(title + ".pdf");
  }

  // listen for URLChange to add buttons
  window.addEventListener("message", (event) => {
    // readd buttons on URL change
    if (event.data?.type === "urlChange") {
      // of course, we must set timeout, because otherwise the main app will delete it
      setTimeout(ExportButtons.addButtons, ADD_BUTTONS_DELAY);
    } else if (event.data?.type === "readdExportButtons") {
      // no delay, since presumably this is after everything else has loaded
      // and since it's idempotent, it doesn't matter how many times we call it. no handling necessary
      ExportButtons.addButtons();
    }
  });
  return {
    /**
			Adds the buttons.
			Should be idempotent (ie, you can call it a million times without worrying about it adding stuff twice).
		 */
    addButtons: function () {
      // we must test since the buttons can be removed by the page
      if (!document.getElementById("download-markdown-button")) {
        createButtons();
      }
    },

    downloadThread: function (format) {
      switch (format) {
        case Format.PNG:
        case Format.PDF:
          const elements = new Elements();
          elements.fixLocation();
          const pixelRatio = window.devicePixelRatio;
          const minRatio = format === Format.PDF ? 2 : 2.5;
          window.devicePixelRatio = Math.max(pixelRatio, minRatio);

          html2canvas(elements.thread, {
            allowTaint: true, useCORS: true
          }).then(async function (canvas) {
            elements.restoreLocation();
            window.devicePixelRatio = pixelRatio;
            const imgData = canvas.toDataURL("image/png");
            requestAnimationFrame(() => {
              if (format === Format.PDF) {
                return handlePdf(imgData, canvas, pixelRatio);
              } else {
                handleImg(imgData);
              }
            });
          });
          break;
        case Format.MD:
          let fileName = `${document.title}.md`;
          let data = getCurrentChatText();
          let blob = convertChatToMarkdown(data, document.title);
          downloadBlobAsFile(blob, fileName);
          break;
        default:
          console.warn(
            `ExportButtons.downloandThread: format "${format}" not recognized.`,
          );
          break;
      }
    },
  };
})();
// for init
setTimeout(ExportButtons.addButtons, 500);
