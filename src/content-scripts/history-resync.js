let authToken = null;
async function auth() {
    async function getAuth() {
        const fetchResult = await fetch("https://chat.openai.com/api/auth/session?stop=true", {
            method: "GET",
            headers: {
                'content-type': 'application/json',
            }
        })
        return await fetchResult.json()
    }
    getAuth().then(result => {
        authToken = result.accessToken
        chrome.storage.local.get({v2_history: false}, function (result){
            if (result.v2_history !== true){
                resyncAll()
            }
        })
    })
}
auth()

function getConversations(offset=0, limit=100){
    return fetch(`https://chat.openai.com/backend-api/conversations?offset=${offset}&limit=${limit}`, {
        method: "GET",
        headers: {
            'content-type': 'application/json',
            Authorization: authToken
        }
    }).then(response => {
        if (response.ok) {
            return response.json()
        }
        else{
            return Promise.reject(response);
        }
    })
}

function convoToTree(obj) {
    const messages = obj["mapping"]
    let firstItem = findTopParent(obj.current_node, messages)
    console.log(firstItem)
    let tree = new TreeNode(null)
    let convo = []
    function buildTree(node, tree){
        let newTree = new TreeNode(node.message.content.parts[0])
        tree.addLeaf(newTree)
        console.log(tree.currentLeafIndex)
        if (tree.currentLeafIndex === 0){
            convo.push(node.message.content.parts[0])
        }
        for (let each of node.children){
            buildTree(messages[each], newTree)
        }
    }
    for (let each of firstItem.children){
        buildTree(messages[each], tree)
    }
    const date = new Date(obj.create_time * 1000).toLocaleDateString();
    const time = new Date(obj.create_time * 1000).toLocaleTimeString();
    return {branch_state: tree.toJSON(), date: date, unified_id: true, mkdwn: true, convo: convo, time: time, title: obj.title, id: obj.current_node, favorite: false, create_time: obj.create_time}
}

function findTopParent(startingNodeId, tree) {
    let currentNode = tree[startingNodeId];
    while (currentNode.parent) {
        currentNode = tree[currentNode.parent];
    }
    let baseSystemNode = tree[currentNode.children[0]]
    return baseSystemNode;
}

function getConversation(id){
    return fetch(`https://chat.openai.com/backend-api/conversation/${id}`, {
        method: 'GET',
        headers: {
            'content-type': 'application/json',
            Authorization: authToken,
        },
    }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            return Promise.reject(response);
    })
}

async function resyncArray(convoList, ids, threads, delayMs=1000){
    for (let convo of convoList){
        if (ids.includes(convo.current_node)){
                let thread = convoToTree(await getConversation(convo.id))
                let oldThreadIdx = getObjectIndexByID(thread.id, threads)
                threads[oldThreadIdx] = thread
        }
        else {
            let thread = convoToTree(await getConversation(convo.id))
            threads.push(thread)
        }
        chrome.storage.local.set({threads: threads.reverse()})
        await new Promise(r => setTimeout(r, delayMs)); // basically sleeping for 600 ms to not send a bunch of requests
    }
}

let threads;
async function resyncAll(){
    chrome.storage.local.get({threads: []}, async function (result){
        threads = result.threads
        let ids = [];
        for (let thread of threads){
            ids.push(thread.id)
        }
        let convoData = await getConversations()
        let max = convoData.total
        let offset = 0
        while (max > 0) {
            let convoList = convoData.items
            resyncArray(convoList, ids, threads, 1000)
            max -= 100
            offset += 100
            convoData = await getConversations(offset)
            await new Promise(r => setTimeout(r, 30000)); // 30s cooldown
        }
        console.log("FINISHED TOTAL RESYNC")
        chrome.storage.local.set({v2_history: false})
    })
}

