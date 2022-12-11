chrome.storage.local.get(['threads']).then((result) => {
    load_threads(result.threads)
})

let main = document.querySelector(".main")
function sliceString(str, num) { //created by ChatGPT
    // Check if the string is longer than num characters
    if (str.length > num) {
        return `${str.slice(0, num)}...`;
    }
    // If the string is not longer than num characters, return it as is
    return str;
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
        temp.querySelector('.title').innerHTML = sliceString(threads[i].convo[0], 60)
        temp.querySelector('.subtitle').innerHTML = sliceString(threads[i].convo[1], 120)
        let link = `thread.html?thread=${i}`
        temp.querySelector('.link').href = link
        let row = temp.querySelector('.row')
        row.addEventListener('click', () => {window.open(link, '_blank')})
        main.appendChild(temp)
    }
}