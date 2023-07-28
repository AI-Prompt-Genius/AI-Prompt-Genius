let myAuth;
let threads;
let offset = 0;
async function auth(openLogin = false) {
  async function getAuth() {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      const response = await fetch(
        "https://chat.openai.com/api/auth/session?stop=true",
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
          signal,
        },
      );

      clearTimeout(timeout);

      if (response.ok) {
        return response.json();
      } else {
        //console.log("Not OK!");
        if (openLogin === true) {
          window.open("https://chat.openai.com/auth/login", "_blank");
        }
        return Promise.reject(response);
      }
    } catch (error) {
      //console.log(error);
      if (openLogin === true) {
        window.open("https://chat.openai.com/auth/login", "_blank");
      }
      return Promise.reject(error);
    }
  }
  getAuth().then((result) => {
    //console.log(result)
    myAuth = result?.accessToken;
    if (myAuth) {
      chrome.storage.local.set({ auth: myAuth });
      chrome.storage.local.set({ signedIn: true });
    } else {
      chrome.storage.local.set({ signedIn: false });
    }
    chrome.storage.local.get({ v2_history: false }, function (result) {
      if (result.v2_history !== true) {
        chrome.storage.local.get({ awaitingSignIn: false }, function (result) {
          if (!result.awaitingSignIn) {
            chrome.storage.local.get({ offset: 0 }, function (result) {
              setTimeout(() => checkOffsetThenResync(result.offset), 15000);
            });
          }
        });
      }
    });
    getAccountStatus();
  });
}
auth();

async function checkOffsetThenResync(beginningOffset, openLogin = false) {
  chrome.storage.local.get({ offset: 0 }, async function (result) {
    if (beginningOffset === result.offset) {
      if (openLogin) {
        myAuth = await auth(true);
      }
      resyncAll();
    }
  });
}

async function getAccountStatus() {
  function fetchy() {
    return fetch(`https://chat.openai.com/backend-api/accounts/check`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: myAuth,
      },
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
    });
  }
  let data = await fetchy();
  //console.log(data)
  let isPlus = data?.account_plan?.is_paid_subscription_active;
  //console.log("Plus USER: "+ isPlus)
  let plusVal = JSON.stringify(isPlus);
  const input = `<input id="plusNetwork" value="${plusVal}" type="hidden" style="width: 0; height: 0; display: none">`;
  document.body.insertAdjacentHTML("beforeend", input);
}

function getConversations(offset = 0, limit = 100, authToken = myAuth) {
  return fetch(
    `https://chat.openai.com/backend-api/conversations?offset=${offset}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: authToken,
      },
    },
  ).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return Promise.reject(response);
    }
  });
}

function convoToTree(obj, id) {
  const messages = obj["mapping"];
  let firstItem = findTopParent(obj.current_node, messages);
  let tree = new TreeNode(null);
  let convo = [];
  function buildTree(node, tree) {
    let newTree = new TreeNode(node.message.content.parts[0]);
    tree.addLeaf(newTree);
    if (tree.currentLeafIndex === 0) {
      convo.push(node.message.content.parts[0]);
    }
    for (let each of node.children) {
      buildTree(messages[each], newTree);
    }
  }
  for (let each of firstItem.children) {
    buildTree(messages[each], tree);
  }
  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const date = new Date(obj.create_time * 1000).toLocaleDateString(
    "default",
    dateOptions,
  );
  const timeOptions = { hour12: true, hour: "numeric", minute: "numeric" };
  const time = new Date(obj.create_time * 1000).toLocaleTimeString(
    "default",
    timeOptions,
  );
  return {
    branch_state: tree.toJSON(),
    date: date,
    unified_id: true,
    mkdwn: true,
    convo: convo,
    time: time,
    title: obj.title,
    id: id,
    favorite: false,
    create_time: obj.create_time,
  };
}

function findTopParent(startingNodeId, tree) {
  let currentNode = tree[startingNodeId];
  while (currentNode.parent) {
    currentNode = tree[currentNode.parent];
  }
  let baseSystemNode = tree[currentNode.children[0]];
  return baseSystemNode;
}

function getConversation(id, authToken = myAuth) {
  return fetch(`https://chat.openai.com/backend-api/conversation/${id}`, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: authToken,
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  });
}

async function resyncArray(
  convoIds,
  existingIds,
  threads,
  delayMs = 1000,
  authToken = myAuth,
  offset = null,
) {
  for (let convoId of convoIds) {
    if (existingIds.includes(convoId)) {
      let thread = convoToTree(await getConversation(convoId), convoId);
      let oldThreadIdx = getObjectIndexByID(thread.id, threads);
      threads[oldThreadIdx] = thread;
    } else {
      let thread = convoToTree(
        await getConversation(convoId, authToken),
        convoId,
      );
      threads.push(thread);
    }
    if (offset !== null) {
      offset += 1;
      //console.log("Offset" +offset)
      chrome.storage.local.set({ offset: offset });
    }
    chrome.storage.local.set({ threads: threads.reverse() });
    await new Promise((r) => setTimeout(r, delayMs)); // basically sleeping for 600 ms to not send a bunch of requests
  }
}
let max = null;
async function resyncAll() {
  chrome.storage.local.set({ alreadyResyncing: true });
  //console.log("resyncing all")
  chrome.storage.local.get({ threads: [] }, async function (result) {
    threads = result.threads;
    let ids = [];
    for (let thread of threads) {
      ids.push(thread.id);
    }
    chrome.storage.local.get({ offset: 0 }, async function (result) {
      offset = result.offset - 2; // overlap for safety
      if (offset < 0) {
        offset = 0;
      }
      let convoData = await getConversations(offset);
      max = await convoData.total;
      while (offset !== max) {
        let allIds = convoData.items.map((convo) => convo.id);
        await resyncArray(allIds, ids, threads, 15000, myAuth, offset);
        chrome.storage.local.get({ offset: 0 }, async function (result) {
          offset = result.offset;
          convoData = await getConversations(await offset);
          max = await convoData.total;
          await new Promise((r) => setTimeout(r, 30000)); // 30s cooldown
        });
      }
      //console.log("FINISHED TOTAL RESYNC")
      chrome.storage.local.set({ offset: 0 });
      chrome.storage.local.set({ v2_history: true });
      chrome.storage.local.set({ alreadyResyncing: false });
    });
  });
}
