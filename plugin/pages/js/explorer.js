chrome.storage.local.get({ threads: null }, async function (result) {
  await expungeDuplicates(result.threads);
  chrome.storage.local.get({ threads: null }, async function (result1) {
    if (result.threads !== null) {
      load_threads(result1.threads);
    } else {
      main.innerHTML = `<h1 class="p-3 m-3 even dark">${await translate(
        "welcome_history",
      )}</h1>`;
    }
  });
});

let main = document.querySelector(".main");
function sliceString(str, num) {
  //created by ChatGPT
  // Check if the string is longer than num characters
  if (str.length > num) {
    return `${str.slice(0, num)}...`
      .replace(`<p>`, "")
      .replace(`</p>`, "")
  }
  // If the string is not longer than num characters, return it as is
  return str;
}

function delete_thread(i, row) {
  chrome.storage.local.get(["threads"], function (result) {
    let t = result.threads;
    t.splice(i, 1);
    threads_g = t;
    chrome.storage.local.set({ threads: t });
  });
  row.classList.add("d-none");
}

function toggle_thread_title_editable(i, row) {
  let title_text = row.querySelector(".title-text");
  let edit_icon = row.querySelector(".edit-title-button");
  if (title_text.contentEditable === "inherit") {
    // if thread.title, import the FULL title into the text if it exists
    chrome.storage.local.get(["threads"], function (result) {
      let t = result.threads;
      let thread = t[i];
      if (thread.title)
        title_text.innerHTML = thread.title.replaceAll("<", "&lt;");
    });
    title_text.classList.add("editable");
    title_text.contentEditable = "true";
    title_text.focus();
    edit_icon.classList.remove("fa-pen-to-square");
    edit_icon.classList.add("fa-floppy-disk");
  } else {
    title_text.classList.remove("editable");
    title_text.contentEditable = "inherit";
    // now set the title instead
    chrome.storage.local.get(["threads"], function (result) {
      let t = result.threads;
      let thread = t[i];
      thread.title = title_text.innerText;
      chrome.storage.local.set({ threads: t });
      threads_g = t;
    });
    edit_icon.classList.remove("fa-floppy-disk");
    edit_icon.classList.add("fa-pen-to-square");
  }
}

function export_thread(id) {
  chrome.storage.local.get(["threads"], function (result) {
    let t = result.threads;
    let idx = getObjectIndexByID(id, t);
    let thread = t[idx];
    let title = `${thread.title}.md`;
    let file = thread.markdown ? encode_string_as_blob(thread) : convert_thread_to_markdown_file(thread);
    download_blob_as_file(file, title);
  });
}

async function expungeDuplicates(threads) {
  const uniqueThreads = {};
  threads.forEach((thread) => {
    if (!uniqueThreads[thread.id]) {
      uniqueThreads[thread.id] = thread;
    }
  });
  return chrome.storage.local.set(
    { threads: Object.values(uniqueThreads) },
    async function (re) {
      return true;
    },
  );
}

function encode_string_as_blob(string) {
  let bytes = new TextEncoder().encode(string);
  let blob = new Blob([bytes], {
    type: "application/json;charset=utf-8",
  });
  return blob;
}

// basially using the fileSaver.js, it's an IIFE to save on implementing the <a> singleton.
const download_blob_as_file = (function () {
  let a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (blob, file_name) {
    let url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = file_name;
    a.click();
    window.URL.revokeObjectURL(url);
  };
})();

/* conversion functions for export and download */
function convert_thread_to_JSON_file(thread) {
  let data = thread;
  let string = JSON.stringify(data);
  let blob = encode_string_as_blob(string);
  return blob;
}

function convert_thread_to_text_file(thread) {
  let string = "Date:" + thread.date + " " + thread.time + "\n";
  let convo = thread.convo;
  for (let i = 0; i < convo.length; i++) {
    let speaker = i % 2 === 0 ? "Human" : "Assistant";
    string += speaker + ": " + convo[i] + "\n";
  }
  let blob = encode_string_as_blob(string);
  return blob;
}

function convert_thread_to_markdown_file(thread) {
  let string = "";
  string += "# " + "ChatGPT Conversation" + "\n";
  string += "Date:" + thread.date + " " + thread.time + "\n";
  string += "\n"; // two newlines because MD is like that
  let convo = thread.convo;
  for (let i = 0; i < convo.length; i++) {
    let speaker = i % 2 === 0 ? "Human" : "Assistant";
    string += "### " + speaker + "\n";
    string += convo[i] + "\n";
    string += "\n";
  }
  let blob = encode_string_as_blob(string);
  return blob;
}

let timer;
function searchThreads(threads, searchTerm) {
  // created by ChatGPT
  searchTerm = searchTerm.toLowerCase();
  return threads.filter((thread) => {
    return (
      thread.convo.some((message) =>
        message.toLowerCase().includes(searchTerm),
      ) ||
      (thread.title && thread.title.toLowerCase().includes(searchTerm))
    );
  });
}

function search() {
  let search_term = document.querySelector(".search-bar").value;
  update_threads();
  let ts = searchThreads(
    threads_g,
    document.querySelector(".search-bar").value,
  );
  main.innerHTML = "";
  if (search_term === "") {
    load_threads(threads_g);
  } else {
    load_threads(ts, true, search_term);
  }
}

document.querySelector(".search-bar").addEventListener("input", search);

let threads_g = [];
let updated = false;
function update_threads() {
  chrome.storage.local.get(["threads"], function (result) {
    threads_g = result.threads;
  });
}
update_threads();

function update_bookmark(btn, saved) {
  if (saved) {
    btn.classList.remove("btn-outline-success");
    btn.classList.add("btn-success");
  } else {
    btn.classList.remove("btn-success");
    btn.classList.add("btn-outline-success");
  }
}

function searchList(strings, searchTerm) {
  // created by ChatGPT
  searchTerm = searchTerm.toLowerCase();
  const matchingStrings = strings.filter((string) =>
    string.toLowerCase().includes(searchTerm),
  );

  return matchingStrings
    .map((string) => {
      const index = string.toLowerCase().indexOf(searchTerm);
      const startIndex = Math.max(0, index - 50);
      const endIndex = Math.min(string.length, index + 50);

      let substring = string.substring(startIndex, endIndex);
      if (startIndex > 0) {
        substring = "..." + substring;
      }
      if (endIndex < string.length) {
        substring = substring + "...";
      }

      // use the original case of the search term when highlighting it
      const searchTermRegex = new RegExp(searchTerm, "gi");
      return substring.replace(
        searchTermRegex,
        `<span class="highlight">$&</span>`,
      );
    })
    .join(", ");
}

const MAX_TITLE_DISPLAY_LENGTH = 55;

function load_threads(
  threads,
  search = false,
  search_term = "",
  bookmarks = false,
) {
  const theme = document.body.classList[0];
  //console.log(theme)
  let threadsLoaded = [];
  threads = threads.sort((a, b) => {
    // load threads newest to oldest
    if (a.create_time && b.create_time) {
      return new Date(a.create_time) - new Date(b.create_time);
    } else if (a.create_time) {
      return -1;
    } else if (b.create_time) {
      return 1;
    } else {
      return 0;
    }
  });
  for (let n = 0; n < threads.length; n++) {
    let i = threads.length - n - 1;
    let temp;
    let even = n % 2 === 0;
    if (even) {
      temp = document.querySelector("#even").content.cloneNode(true);
    } else {
      temp = document.querySelector("#odd").content.cloneNode(true);
    }
    temp.querySelector(".date").innerHTML = threads[i].date;
    temp.querySelector(".time").innerHTML = threads[i].time;

    let thread_title = threads[i].title;
    if (!thread_title)
      thread_title = sliceString(threads[i].convo[0], MAX_TITLE_DISPLAY_LENGTH);
    if (thread_title.length > MAX_TITLE_DISPLAY_LENGTH)
      thread_title = sliceString(thread_title, MAX_TITLE_DISPLAY_LENGTH);

    temp.querySelector(".title-text").innerHTML = thread_title.replaceAll(
      "<",
      "&lt;",
    );

    if (!search && threads[i].convo[1] !== undefined) {
      temp.querySelector(".subtitle").innerHTML = sliceString(
        threads[i].convo[1],
        100,
      );
    } else {
      temp.querySelector(".subtitle").innerHTML = sliceString(
        searchList(threads[i].convo, search_term),
        100,
      );
      temp.querySelector(".title-text").innerHTML = sliceString(
        searchList([thread_title], search_term),
        100,
      );
      if (temp.querySelector(".title-text").innerHTML === "") {
        temp.querySelector(".title-text").innerHTML = thread_title;
      }
    }
    let saved = threads[i].favorite;
    let btn = temp.querySelector(".btn.bookmark");
    update_bookmark(btn, saved);
    let id = threads[i].id;
    let link = `thread.html?thread=${id}`;
    let row = temp.querySelector(".row");
    if (bookmarks) {
      if (!saved) {
        row.classList.add("d-none");
      }
    }
    row.classList.remove("dark" || "light");
    row.classList.add(`${theme}`);
    let title_input = row.querySelector(".title-text");
    title_input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        toggle_thread_title_editable(i, row);
      }
    });
    row.addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("trash")) {
        delete_thread(i, row);
      } else if (target.classList.contains("edit-title-button")) {
        toggle_thread_title_editable(i, row);
      } else if (target.classList.contains("title-text")) {
        // solely catch a do-nothing
      } else if (target.classList.contains("bookmark")) {
        chrome.storage.local.get({ threads: [] }, function (result) {
          let updatedThreads = result.threads;
          let idx = getObjectIndexByID(threads[i].id, updatedThreads);
          let thread = updatedThreads[idx];
          thread.favorite = !thread.favorite;
          updatedThreads[idx] = thread;
          //console.log(updatedThreads[idx])
          chrome.storage.local.set({ threads: updatedThreads });
          let saved = thread.favorite;
          update_bookmark(btn, saved);
        });
      } else if (target.classList.contains("export")) {
        export_thread(id, row);
      } else if (target.classList.contains("continue")) {
        let c = [];
        //console.log(threads[i])
        //console.log(threads[i].hasOwnProperty('unified_id'))
        if (
          threads[i].hasOwnProperty("unified_id") &&
          threads[i].unified_id === true
        ) {
          //console.log("unified")
          window.open(
            `https://chat.openai.com/chat/${threads[i].id}`,
            "_blank",
          );
        } else {
          for (let i = 0; i < threads[i].convo.length; i++) {
            let user = i % 2 === 0 ? "Me" : "ChatGPT";
            c.push({ [user]: htmlToPlainText(threads[0].convo[i]) });
          }

          chrome.runtime.sendMessage({ convo: c, type: "b_continue_convo" });
        }
      } else {
        window.open(link, "_blank");
      }
    });
    if (threadsLoaded.includes(id)) {
      // fix duplicates
      delete_thread(i, row);
    } else {
      main.appendChild(temp);
      threadsLoaded.push(id);
    }
  }
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]'),
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

async function b_load() {
  document.querySelector(
    "#blink",
  ).outerHTML = `<a href="explorer.html" class="mx-3 p-3 text-white text-sm"><i class="fa-solid fa-book"></i> &emsp; ${await translate(
    "all_threads",
  )}</a>`;
  load_threads(threads_g, false, "", true);
}

function bookmarks() {
  main.innerHTML = "";
  update_threads();
  setTimeout(b_load, 50);
}

chrome.storage.local.get({ threads: "none" }, function (result) {
  if (result.threads === "none") {
    // new user
    chrome.storage.local.set({ seen_v2_toast: true });
    chrome.storage.local.get(
      { settings: { home_is_prompts: true } },
      function (response) {
        let settings = response.settings;
        settings.home_is_prompts = true;
        chrome.storage.local.set({ settings: settings });
      },
    );
  } else {
    chrome.storage.local.get({ seen_v2_toast: false }, function (response) {
      let seen_v2_toast = response.seen_v2_toast;
      if (!seen_v2_toast) {
        chrome.storage.local.set({ seen_v2_toast: true });
        let toastEl = document.getElementById("liveToast");
        let toast = new bootstrap.Toast(toastEl);
        toast.show();
        chrome.storage.local.get(
          { settings: { home_is_prompts: true } },
          function (response) {
            let settings = response.settings;
            settings.home_is_prompts = true;
            chrome.storage.local.set({ settings: settings });
          },
        );
      }
    });
  }
});

document.querySelectorAll(".bnav").forEach((item) => {
  item.addEventListener("click", bookmarks);
});
