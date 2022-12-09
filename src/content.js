let p = document.querySelector("main > div > div > div > div")
let c = p.children
// loop through c to see if they are p elements or pre elements
let page = []
let first_time = true
function save_thread(human, h) {
    if(human){
        let text = h.innerText
        page.push({md: false, text: text})
    }
    if(!human){
        let text = h.firstChild.children[1].firstChild.firstChild.innerHTML
        page.push({md: true, text: text})
    }
}
function save_page(){
    page = []
    for(let i = 0; i < c.length; i++){
        let human = i % 2 === 0;
        save_thread(human, c[i])
    }
    chrome.storage.local.get({threads: null}).then((result) => {
        let t = result.threads
        if (t !== null) {
            let t = result.threads
            if (first_time) {
                t.push(page)
                first_time = false
            }
            else {
                t[t.length - 1] = page
            }
            chrome.storage.local.set({threads: t})
        }
        else {
            let t = [page]
            chrome.storage.local.set({threads: t})
        }
    });}

document.addEventListener('keydown', function(event) {
    // Check if the pressed key was the Enter key
    if (event.key === 'Enter') {
        setTimeout(save_page, 500)
    }
});

let main = p
var interval;
main.addEventListener('DOMSubtreeModified', function() {
    clearInterval(interval)
    interval = setInterval(function() {
        save_page()
    }, 7000);

    setTimeout(function() {
        clearInterval(interval);
    }, 80000);

});
let reset = document.querySelector("nav").firstChild
reset.addEventListener('click', function() {
    first_time = true
})