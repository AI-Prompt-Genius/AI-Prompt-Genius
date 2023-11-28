/*
	Misc utilities that are repeated across different files in content-scripts.
	To access in page context, inject the entire file into the page.
 */
function getObjectIndexByID(id, list) {
  // created by ChatGPT
  // Iterate over the list of objects
  for (let i = 0; i < list.length; i++) {
    const obj = list[i];

    // Check if the object has an `id` property that matches the given id
    if (obj.id && obj.id === id) {
      // If a match is found, return the object
      return i;
    }
  }

  // If no match is found, return null
  return null;
}

function generateUUID() {
  // generated by ChatGPT
  // create an array of possible characters for the UUID
  var possibleChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // create an empty string that will be used to generate the UUID
  var uuid = "";

  // loop over the possible characters and append a random character to the UUID string
  for (var i = 0; i < 36; i++) {
    uuid += possibleChars.charAt(
      Math.floor(Math.random() * possibleChars.length),
    );
  }

  // return the generated UUID
  return uuid;
}

function getDate() {
  // generated by ChatGPT
  var date = new Date();
  var options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleString("default", options);
}

function isPaidSubscriptionActive() {
  let result =
    window.__NEXT_DATA__?.props?.pageProps?.accountStatusResponse?.account_plan
      ?.is_paid_subscription_active;
  if (result == undefined) {
    result = JSON.parse(window.__NEXT_DATA__?.textContent || "{}").props
      ?.pageProps?.accountStatusResponse?.account_plan
      ?.is_paid_subscription_active;
  }
  if (result == undefined) {
    // see history resync - this should be accurate but sometimes could be slow
    result = document.getElementById("plusNetwork")?.value === "true";
  }
  if (result == undefined) {
    // see prompt-inject - gets the user setting from storage.
    result = document.getElementById("plusManual")?.value === "true";
  }
  return result;
}

function getTime() {
  // generated by ChatGPT
  var currentDate = new Date();
  var options = {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  };
  var timeString = currentDate.toLocaleTimeString("default", options);
  return timeString;
}

function encodeStringAsBlob(string) {
  let bytes = new TextEncoder().encode(string);
  let blob = new Blob([bytes], {
    type: "application/json;charset=utf-8",
  });
  return blob;
}

/* conversion functions for export and download */
function convertThreadToJSONFile(thread) {
  let data = thread;
  let string = JSON.stringify(data);
  let blob = encodeStringAsBlob(string);
  return blob;
}

function convertThreadToTextFile(thread) {
  let string = "Date:" + thread.date + " " + thread.time + "\n";
  let convo = thread.convo;
  for (let i = 0; i < convo.length; i++) {
    let speaker = i % 2 === 0 ? "Human" : "Assistant";
    string += speaker + ": " + convo[i] + "\n";
  }
  let blob = encodeStringAsBlob(string);
  return blob;
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

function getCSSFromSheet(sheet) {
  return Array.from(sheet.cssRules)
    .map((rule) => rule.cssText)
    .join("");
}

function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  th.appendChild(s);
}

/*
	mirror the state in a non-binary tree
	we use a class for convenience and namespace;
	to export to JSON, use the dedicated .toJSON() function
 */
function TreeNode(data) {
  this.leaves = [];
  this.data = data;
  // instance
  this.currentLeafIndex = -1;
}

function removeElementInArray(array, element) {
  for (var index = 0, length = array.length; index < array.length; index++) {
    if (array[index] === element) {
      array.splice(index, 1);
      return true;
    }
  }
  return false;
}

TreeNode.prototype.getData = function () {
  return this.data;
};

TreeNode.prototype.getCurrentLeaf = function () {
  return this.leaves[this.currentLeafIndex];
};

TreeNode.prototype.getLeaves = function () {
  return this.leaves;
};

TreeNode.prototype.addLeaf = function (leaf) {
  this.leaves.push(leaf);
  this.currentLeafIndex++;
};

TreeNode.prototype.addLeafCurrentLeaf = function (leaf) {
  let currentLeaf = this.leaves[this.currentLeafIndex];
  if (currentLeaf) {
    currentLeaf.addLeaf(leaf);
  }
};

TreeNode.prototype.addLeafByData = function (data) {
  let leaf = new TreeNode(data);
  this.addLeaf(leaf);
};

TreeNode.prototype.setData = function (data) {
  this.data = data;
};

TreeNode.prototype.setCurrentLeafIndex = function (index) {
  this.currentLeafIndex = index;
};

// traverses the tree according to the current leaf indices
// returns the data in an array, much like the old .convo field
TreeNode.prototype.getCurrentData = function () {
  let data = [this.data];
  let currentLeaf = this.leaves[this.currentLeafIndex];
  let leafData = [];
  if (currentLeaf) {
    leafData = currentLeaf.getCurrentData();
  }
  return data.concat(leafData);
};

// return a primitive data version for storage
TreeNode.prototype.toJSON = function () {
  let JSONObject = { data: this.data, leaves: [] };
  for (let index = 0, length = this.leaves.length; index < length; index++) {
    if (this.leaves[index]) {
      JSONObject.leaves[index] = this.leaves[index].toJSON();
    } else {
      console.warn(`TreeNode.toJSON: Empty object at index ${index}.`);
    }
  }
  return JSONObject;
};