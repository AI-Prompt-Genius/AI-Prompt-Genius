let messages = {};
function loadTranslations(lang) {
    fetch(`/_locales/${lang}/messages.json`)
        .then((response) => response.json())
        .then((translations) => {
            messages[lang] = translations;
            const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], template');
            elements.forEach((element) => {
                if (element.tagName === 'TEMPLATE') {
                    // Handle template element
                    const content = element.content;
                    const templateElements = content.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title]');
                    templateElements.forEach((templateElement) => {
                        replaceTranslation(templateElement, translations);
                    });
                } else {
                    // Handle non-template element
                    replaceTranslation(element, translations);
                }
            });

            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl)
            })
        });
}

function replaceTranslation(element, translations) {
    if (element.hasAttribute('data-i18n')) {
        const key = element.getAttribute('data-i18n');
        const translation = translations[key];
        if (translation && translation.message) {
            element.innerHTML = translation.message;
        }
    }
    if (element.hasAttribute('data-i18n-placeholder')) {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = translations[key];
        if (translation && translation.message) {
            element.setAttribute('placeholder', translation.message);
        }
    }
    if (element.hasAttribute('data-i18n-title')) {
        const key = element.getAttribute('data-i18n-title');
        const translation = translations[key];
        if (translation && translation.message) {
            element.setAttribute('title', translation.message);
        }
    }
}

let language = "en";
chrome.storage.local.get({lang: "en"}, function (response){
    language = response.lang
})

async function translate(key, lang=language) {
    // Check if the translations for the specified language have already been loaded
    if (messages[lang]) {
        // Check if the key exists in the translations object
        if (messages[lang][key] && messages[lang][key].message) {
            // Return the translation from the cache
            return messages[lang][key].message;
        }
    }

    // If the translations have not been loaded yet or the key does not exist in the cache, fetch the translations
    return fetch(`/_locales/${lang}/messages.json`)
        .then((response) => response.json())
        .then((json) => {
            // Store the translations in the global variable
            messages[lang] = json;
            // Check if the key exists in the translations object
            if (json[key] && json[key].message) {
                // Return the translation
                return json[key].message;
            }
        })
        .catch((error) => console.error(error));
}


chrome.storage.local.get({lang: "en"}, function (response) {
    loadTranslations(response.lang)
    setTimeout(() => loadTranslations(response.lang), 1000);
})
