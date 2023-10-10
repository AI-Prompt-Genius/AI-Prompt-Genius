// these are now "general" export import functions

function exportCsv() {
  chrome.storage.local.get({ "prompts": [] }, function (result) {
    let prompts = result.prompts;
    let new_prompts = prompts.map((prompt) => {
      return {
        title: prompt.title,
        content: prompt.text,
        platform: "ChatGPT",
        category: prompt.category,
        tags: prompt.tags.join(",")
      };
    });

    let currentTimeString = new Date().toJSON();
    let filename = `AI-Prompt-Genius-Prompts_${currentTimeString}.csv`;

    // Convert the prompts to CSV format
    let csv = convertToCSV(new_prompts);

    // Encode the CSV string as a Blob
    let blob = encodeStringAsBlob(csv);

    // Download the Blob as a CSV file
    downloadBlobAsFile(blob, filename);
  });
}


function convertToCSV(data) {
  const headers = Object.keys(data[0]); // Get the headers from the first object

  // Create an array to hold the CSV lines
  const csvLines = [];

  // Push the header line to the array
  csvLines.push(headers.join(','));

  // Iterate through the data and convert each object to a CSV line
  for (const item of data) {
    const values = headers.map(header => {
      let value = item[header];

      // Check if the value contains a comma or a double quote and enclose it in double quotes if needed
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`; // Double up double quotes inside the value
      }

      return value;
    });

    csvLines.push(values.join(','));
  }

  // Join all the CSV lines with newline characters
  return csvLines.join('\n');
}

function exportFiles(h = true, p = true, s = true) {
  chrome.storage.local.get(
    ["threads", "prompts", "settings"],
    function (result) {
      let threads = result.threads ?? [];
      let prompts = result.prompts ?? [];
      let settings = result.settings ?? [];
      let title = "";

      let data = {};
      if (h) {
        data.threads = threads;
        title += "-History";
      }
      if (p) {
        data.prompts = prompts;
        title += "-Prompts";
      }
      if (s) {
        data.settings = settings;
        title += "-Settings";
      }

      let string = JSON.stringify(data);
      let blob = encodeStringAsBlob(string);
      let currentTimeString = new Date().toJSON();
      let filename = `AI-Prompt-Genius-Archive${title}_${currentTimeString}.txt`;
      downloadBlobAsFile(blob, filename);
    },
  );
}

// basially using the fileSaver.js, it's an IIFE to save on implementing the <a> singleton.
const downloadBlobAsFile = (function () {
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

function encodeStringAsBlob(string) {
  let bytes = new TextEncoder().encode(string);
  let blob = new Blob([bytes], {
    type: "application/json;charset=utf-8",
  });
  return blob;
}

function importAny() {
  let input = document.querySelector("#import-any");
  let file = input.files[0];
  if (!file) {
    console.warn(`unable to find a valid file`);
    return;
  }

  let reader = new FileReader();
  reader.onload = function (event) {
    let string = event.target.result;
    let data = JSON.parse(string);

    // backwards compatability
    if (Array.isArray(data)) {
      data = { threads: data };
    }

    importThreads(data);
    importPrompts(data);
    importSettings(data);
  };
  reader.onerror = function (event) {
    //console.log(`Error occured in file reader: `);
    //console.log(event);
  };
  reader.readAsText(file);
  animate(id("import-label"));
}

// takes an object that looks like {threads:data[]}
function importThreads(data) {
  chrome.storage.local.get({ threads: [] }, function (result) {
    //console.log(`Importing threads...`);
    let t = result.threads;

    // validate each thread before adding
    let new_t = data.threads ?? [];
    for (let i = 0, len = new_t.length; i < len; i++) {
      let thread = new_t[i];
      let id = thread.id;

      // in case there is no ID, we have to use a simpler heuristic.
      // if date and convo is the same, for all intents and purposes it is the same, bookmark/id don't matter.
      if (!id) {
        // if found duplicate, then do nothing
        if (get_thread_in_list_deep_equals(thread, t)) {
          continue;
        } else {
          // otherwise, it is completely original; give the thread a random new ID
          thread.id = generateUUID();
        }
      }

      // If the ID is the same as one of our own, that means it is the same thread and we should ignore it.
      if (id && getObjectById(id, t) !== null) {
        continue;
      }

      t.push(thread);
    }

    chrome.storage.local.set({ threads: t });
  });
}
function importSettings(data) {
  if (data.settings) {
    chrome.storage.local.set({ settings: data.settings });
  }
}

function importPrompts(data) {
  chrome.storage.local.get({ prompts: [] }, function (result) {
    //console.log(`Importing prompts...`);

    let prompts = result.prompts;
    let new_prompts = data.prompts ?? [];
    let newSync = [];
    for (let i = 0, len = new_prompts.length; i < len; i++) {
      let prompt = new_prompts[i];
      let id = prompt.id;

      // If the ID is the same as one of our own, ignore it.
      // thankfully, all prompts have IDs
      if (id && getObjectById(id, prompts) !== null) {
        continue;
      }
      newSync.push(id);

      prompts.push(prompt);
    }

    chrome.storage.local.get({ newPrompts: [] }, function (result) {
      let newP = result.newPrompts;
      let newList = newP.concat(newSync);
      //console.log(newList)
      chrome.storage.local.set({ newPrompts: newList });
    });

    chrome.storage.local.set({ prompts: prompts });
  });
}

function animate(button) {
  let html = button.innerHTML;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  setTimeout(() => (button.innerHTML = html), 1000);
}

function showDeletePrompts() {
  id("confirm-prompts").classList.remove("d-none");
}

function deletePrompts() {
  chrome.storage.local.get({ prompts: [] }, function (result) {
    chrome.storage.local.get({ deletedPrompts: [] }, function (r) {
      let dp = r.deletedPrompts;
      let prompts = result.prompts;
      for (let prompt of prompts) {
        dp.push(prompt.id);
      }
      chrome.storage.local.set({ deletedPrompts: dp });
      chrome.storage.local.set({ prompts: [] });
      id("confirm-prompts").classList.add("d-none");
      animate(id("delete-prompts"));
    });
  });
}

function showDeleteHistory() {
  id("confirm-history").classList.remove("d-none");
}

function deleteHistory() {
  chrome.storage.local.set({ threads: [] });
  id("confirm-history").classList.add("d-none");
  animate(id("delete-history"));
}

function id(el) {
  return document.getElementById(el);
}

document.querySelector("#export-all").addEventListener("click", exportFiles);
document.querySelector("#import-any").addEventListener("change", importAny);
id("export-history").addEventListener("click", () =>
  exportFiles(true, false, false),
);
id("export-prompts").addEventListener("click", () =>
  exportFiles(false, true, false),
);
id("export-settings").addEventListener("click", () =>
  exportFiles(false, false, true),
);
id("delete-prompts").addEventListener("click", showDeletePrompts);
id("confirm-prompts").addEventListener("click", deletePrompts);
id("delete-history").addEventListener("click", showDeleteHistory);
id("confirm-history").addEventListener("click", deleteHistory);
id("export-csv").addEventListener("click", exportCsv)
