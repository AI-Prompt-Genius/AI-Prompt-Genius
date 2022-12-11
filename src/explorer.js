chrome.storage.local.get(['threads']).then((result) => {
    load_threads(result.threads)
})

let main = document.querySelector(".main")
function sliceString(str, num) { //created by ChatGPT
    // Check if the string is longer than num characters
    if (str.length > num) {
        return `${str.slice(0, num)}...`.replace("<p>", "").replace("</p>", "");
    }
    // If the string is not longer than num characters, return it as is
    return str;
}

function delete_thread(i, row){
    chrome.storage.local.get(['threads']).then((result) => {
        let t = result.threads
        t.splice(i, 1)
        chrome.storage.local.set({threads: t})
    });
    row.classList.add('d-none')
}

function update_bookmark(btn, saved){
    if (saved) {
        btn.classList.remove('btn-outline-success')
        btn.classList.add('btn-success')
    }
    else {
        btn.classList.remove('btn-success')
        btn.classList.add('btn-outline-success')
    }
}

function load_threads(threads){
    for (let n = 0; n < threads.length; n++) {
        let i = threads.length - n - 1
        let temp;
        let even = n % 2 === 0;
        if (even) {
            temp = document.querySelector('#even').content.cloneNode(true);
        }
        else {
            temp = document.querySelector('#odd').content.cloneNode(true);
        }
        temp.querySelector('.date').innerHTML = threads[i].date
        temp.querySelector('.time').innerHTML = threads[i].time
        temp.querySelector('.title').innerHTML = sliceString(threads[i].convo[0], 55)
        temp.querySelector('.subtitle').innerHTML = sliceString(threads[i].convo[1], 100)
        let saved = threads[i].favorite
        let btn = temp.querySelector('.btn.bookmark')
        update_bookmark(btn, saved)
        let link = `thread.html?thread=${i}`
        let row = temp.querySelector('.row')
        row.addEventListener('click', event => {
            const target = event.target;
            if (target.classList.contains('trash')){
                delete_thread(i, row)
            }
            else if (target.classList.contains('bookmark')){
                threads[i].favorite = !threads[i].favorite
                chrome.storage.local.set({threads: threads})
                let saved = threads[i].favorite
                update_bookmark(btn, saved)
            } else{
                window.open(link, "_blank")
            }
        });
        main.appendChild(temp)
    }
}