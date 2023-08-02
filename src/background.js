if (typeof browser !== "undefined") {
  chrome.action = browser.browserAction;
}
// Listen for a click on the browser action
chrome.action.onClicked.addListener(function (tab) {
  chrome.storage.local.get(
    { settings: { home_is_prompts: true } },
    function (result) {
      let settings = result.settings;
      let url;
      if (settings.hasOwnProperty("home_is_prompts")) {
        if (settings.home_is_prompts === true) {
          url = "pages/prompts.html";
        } else {
          url = "pages/explorer.html";
        }
      } else {
        url = "pages/prompts.html";
      }
      chrome.tabs.create({ url: url });
    },
  );
});

chrome.runtime.onInstalled.addListener(function (object) {
  const welcomeUrl = "https://link.aipromptgenius.app/welcome-install";
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: welcomeUrl });
  }
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === "resync") {
    //console.log("resyncing!")
    let mp = message.params;
    syncPrompts(mp[0], mp[1], mp[2], mp[3], mp[4]);
  } else if (message.type === "resyncNow") {
    //console.log("Resycning Now")
    resyncStuff();
  } else if (message.type === "b_continue_convo") {
    //console.log('background received')
    chrome.tabs.create(
      { url: "https://chat.openai.com/chat", active: true },
      function (my_tab) {
        let sent = false;
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
          if (
            tab.id === my_tab.id &&
            changeInfo.status === "complete" &&
            !sent
          ) {
            setTimeout(
              () =>
                chrome.tabs.sendMessage(my_tab.id, {
                  type: "c_continue_convo",
                  id: message.id,
                  convo: message.convo,
                }),
              500,
            );
            sent = true;
          }
        });
      },
    );
  } else if (message.type === "openPrompts") {
    let url = chrome.runtime.getURL("pages/prompts.html");
    chrome.tabs.create({ url: url });
  } else if (message.type === "b_use_prompt") {
    //console.log('background received')
    chrome.tabs.create(
      { url: "https://chat.openai.com/chat", active: true },
      function (my_tab) {
        let sent = false;
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
          if (
            tab.id === my_tab.id &&
            changeInfo.status === "complete" &&
            !sent
          ) {
            setTimeout(
              () =>
                chrome.tabs.sendMessage(my_tab.id, {
                  type: "c_use_prompt",
                  id: message.id,
                  prompt: message.prompt,
                }),
              500,
            );
            sent = true;
          }
        });
      },
    );
  }
});

async function getFromStorage(key, defaultKey = null) {
  return await new Promise(resolve =>
      chrome.storage.local.get({ [key]: defaultKey }, result => resolve(result[key]))
  );
}

async function getCurrentAdLocales(){
  const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
  const rando = generateUUID(); // to not get cached version because headers were causing problems.
  const response = await fetch(`${host}/ads/activeLocales.txt?nocache=${rando}`);
  const activeLocales = JSON.parse(`${await response.text()}`);
  console.log(await activeLocales)
  return activeLocales;
}

chrome.runtime.onMessage.addListener(async function (message) {
  if (message.type === "ad") {
    const userCountry = await getFromStorage("userCountry", "US")
    const activeCountries = await getCurrentAdLocales()
    const adLocale = (activeCountries.includes(userCountry)) ? userCountry : "US" // if the user's country has a specific ad active, use that one instead
    const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
    const rando = generateUUID(); // to not get cached version because headers were causing problems.
    const response = await fetch(`${host}/ads/local/${adLocale}/current.txt?nocache=${rando}`);
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const text = await response.text();
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const [tab] = tabs;
      chrome.tabs.sendMessage(tab.id, { ad: text, type: "adresponse" });
    });
  }
});

function checkForResync() {
  chrome.storage.sync.get({ cloudSyncing: false }, async function (result) {
    if (result.cloudSyncing === true) {
      const ls = await chrome.storage.local.get({ lastSynced: 0 });
      if (moreThan15Min(ls.lastSynced)) {
        resyncStuff();
      }
    }
  });
}
checkForResync();

function setUserRegion(){
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (userTimeZone) {
    const tzArr = userTimeZone.split("/");
    const userRegion = tzArr[0];
    const userCity = tzArr[tzArr.length - 1];
    const cityToCountryCode = {"Andorra":"AD","Dubai":"AE","Kabul":"AF","Tirane":"AL","Yerevan":"AM","Casey":"AQ","Davis":"AQ","Mawson":"AQ","Palmer":"AQ","Rothera":"AQ","Troll":"AQ","Vostok":"AQ","Buenos_Aires":"AR","Cordoba":"AR","Salta":"AR","Jujuy":"AR","Tucuman":"AR","Catamarca":"AR","La_Rioja":"AR","San_Juan":"AR","Mendoza":"AR","San_Luis":"AR","Rio_Gallegos":"AR","Ushuaia":"AR","Pago_Pago":"AS","Vienna":"AT","Lord_Howe":"AU","Macquarie":"AU","Hobart":"AU","Melbourne":"AU","Sydney":"AU","Broken_Hill":"AU","Brisbane":"AU","Lindeman":"AU","Adelaide":"AU","Darwin":"AU","Perth":"AU","Eucla":"AU","Baku":"AZ","Barbados":"BB","Dhaka":"BD","Brussels":"BE","Sofia":"BG","Bermuda":"BM","Brunei":"BN","La_Paz":"BO","Noronha":"BR","Belem":"BR","Fortaleza":"BR","Recife":"BR","Araguaina":"BR","Maceio":"BR","Bahia":"BR","Sao_Paulo":"BR","Campo_Grande":"BR","Cuiaba":"BR","Santarem":"BR","Porto_Velho":"BR","Boa_Vista":"BR","Manaus":"BR","Eirunepe":"BR","Rio_Branco":"BR","Thimphu":"BT","Minsk":"BY","Belize":"BZ","St_Johns":"CA","Halifax":"CA","Glace_Bay":"CA","Moncton":"CA","Goose_Bay":"CA","Toronto":"CA","Nipigon":"CA","Thunder_Bay":"CA","Iqaluit":"CA","Pangnirtung":"CA","Winnipeg":"CA","Rainy_River":"CA","Resolute":"CA","Rankin_Inlet":"CA","Regina":"CA","Swift_Current":"CA","Edmonton":"CA","Cambridge_Bay":"CA","Yellowknife":"CA","Inuvik":"CA","Dawson_Creek":"CA","Fort_Nelson":"CA","Whitehorse":"CA","Dawson":"CA","Vancouver":"CA","Cocos":"CC","Zurich":"CH","Abidjan":"CI","Rarotonga":"CK","Santiago":"CL","Punta_Arenas":"CL","Easter":"CL","Shanghai":"CN","Urumqi":"CN","Bogota":"CO","Costa_Rica":"CR","Havana":"CU","Cape_Verde":"CV","Christmas":"CX","Nicosia":"CY","Famagusta":"CY","Prague":"CZ","Berlin":"DE","Copenhagen":"DK","Santo_Domingo":"DO","Algiers":"DZ","Guayaquil":"EC","Galapagos":"EC","Tallinn":"EE","Cairo":"EG","El_Aaiun":"EH","Madrid":"ES","Ceuta":"ES","Canary":"ES","Helsinki":"FI","Fiji":"FJ","Stanley":"FK","Chuuk":"FM","Pohnpei":"FM","Kosrae":"FM","Faroe":"FO","Paris":"FR","London":"GB","Tbilisi":"GE","Cayenne":"GF","Gibraltar":"GI","Nuuk":"GL","Danmarkshavn":"GL","Scoresbysund":"GL","Thule":"GL","Athens":"GR","South_Georgia":"GS","Guatemala":"GT","Guam":"GU","Bissau":"GW","Guyana":"GY","Hong_Kong":"HK","Tegucigalpa":"HN","Port-au-Prince":"HT","Budapest":"HU","Jakarta":"ID","Pontianak":"ID","Makassar":"ID","Jayapura":"ID","Dublin":"IE","Jerusalem":"IL","Kolkata":"IN","Calcutta":"IN","Chagos":"IO","Baghdad":"IQ","Tehran":"IR","Reykjavik":"IS","Rome":"IT","Jamaica":"JM","Amman":"JO","Tokyo":"JP","Nairobi":"KE","Bishkek":"KG","Tarawa":"KI","Kanton":"KI","Kiritimati":"KI","Pyongyang":"KP","Seoul":"KR","Almaty":"KZ","Qyzylorda":"KZ","Qostanay":"KZ","Aqtobe":"KZ","Aqtau":"KZ","Atyrau":"KZ","Oral":"KZ","Beirut":"LB","Colombo":"LK","Monrovia":"LR","Vilnius":"LT","Luxembourg":"LU","Riga":"LV","Tripoli":"LY","Casablanca":"MA","Monaco":"MC","Chisinau":"MD","Majuro":"MH","Kwajalein":"MH","Yangon":"MM","Ulaanbaatar":"MN","Hovd":"MN","Choibalsan":"MN","Macau":"MO","Martinique":"MQ","Malta":"MT","Mauritius":"MU","Maldives":"MV","Mexico_City":"MX","Cancun":"MX","Merida":"MX","Monterrey":"MX","Matamoros":"MX","Mazatlan":"MX","Chihuahua":"MX","Ojinaga":"MX","Hermosillo":"MX","Tijuana":"MX","Bahia_Banderas":"MX","Kuala_Lumpur":"MY","Kuching":"MY","Maputo":"MZ","Windhoek":"NA","Noumea":"NC","Norfolk":"NF","Lagos":"NG","Managua":"NI","Amsterdam":"NL","Oslo":"NO","Kathmandu":"NP","Nauru":"NR","Niue":"NU","Auckland":"NZ","Chatham":"NZ","Panama":"PA","Lima":"PE","Tahiti":"PF","Marquesas":"PF","Gambier":"PF","Port_Moresby":"PG","Bougainville":"PG","Manila":"PH","Karachi":"PK","Warsaw":"PL","Miquelon":"PM","Pitcairn":"PN","Puerto_Rico":"PR","Gaza":"PS","Hebron":"PS","Lisbon":"PT","Madeira":"PT","Azores":"PT","Palau":"PW","Asuncion":"PY","Qatar":"QA","Reunion":"RE","Bucharest":"RO","Belgrade":"RS","Kaliningrad":"RU","Moscow":"RU","Simferopol":"RU","Kirov":"RU","Volgograd":"RU","Astrakhan":"RU","Saratov":"RU","Ulyanovsk":"RU","Samara":"RU","Yekaterinburg":"RU","Omsk":"RU","Novosibirsk":"RU","Barnaul":"RU","Tomsk":"RU","Novokuznetsk":"RU","Krasnoyarsk":"RU","Irkutsk":"RU","Chita":"RU","Yakutsk":"RU","Khandyga":"RU","Vladivostok":"RU","Ust-Nera":"RU","Magadan":"RU","Sakhalin":"RU","Srednekolymsk":"RU","Kamchatka":"RU","Anadyr":"RU","Riyadh":"SA","Guadalcanal":"SB","Mahe":"SC","Khartoum":"SD","Stockholm":"SE","Singapore":"SG","Paramaribo":"SR","Juba":"SS","Sao_Tome":"ST","El_Salvador":"SV","Damascus":"SY","Grand_Turk":"TC","Ndjamena":"TD","Kerguelen":"TF","Bangkok":"TH","Dushanbe":"TJ","Fakaofo":"TK","Dili":"TL","Ashgabat":"TM","Tunis":"TN","Tongatapu":"TO","Istanbul":"TR","Funafuti":"TV","Taipei":"TW","Kiev":"UA","Uzhgorod":"UA","Zaporozhye":"UA","Wake":"UM","New_York":"US","Detroit":"US","Louisville":"US","Monticello":"US","Indianapolis":"US","Vincennes":"US","Winamac":"US","Marengo":"US","Petersburg":"US","Vevay":"US","Chicago":"US","Tell_City":"US","Knox":"US","Menominee":"US","Center":"US","New_Salem":"US","Beulah":"US","Denver":"US","Boise":"US","Phoenix":"US","Los_Angeles":"US","Anchorage":"US","Juneau":"US","Sitka":"US","Metlakatla":"US","Yakutat":"US","Nome":"US","Adak":"US","Honolulu":"US","Montevideo":"UY","Samarkand":"UZ","Tashkent":"UZ","Caracas":"VE","Ho_Chi_Minh":"VN","Efate":"VU","Wallis":"WF","Apia":"WS","Johannesburg":"ZA","Antigua":"AG","Anguilla":"AI","Luanda":"AO","McMurdo":"AQ","DumontDUrville":"AQ","Syowa":"AQ","Aruba":"AW","Mariehamn":"AX","Sarajevo":"BA","Ouagadougou":"BF","Bahrain":"BH","Bujumbura":"BI","Porto-Novo":"BJ","St_Barthelemy":"BL","Kralendijk":"BQ","Nassau":"BS","Gaborone":"BW","Blanc-Sablon":"CA","Atikokan":"CA","Creston":"CA","Kinshasa":"CD","Lubumbashi":"CD","Bangui":"CF","Brazzaville":"CG","Douala":"CM","Curacao":"CW","Busingen":"DE","Djibouti":"DJ","Dominica":"DM","Asmara":"ER","Addis_Ababa":"ET","Libreville":"GA","Grenada":"GD","Guernsey":"GG","Accra":"GH","Banjul":"GM","Conakry":"GN","Guadeloupe":"GP","Malabo":"GQ","Zagreb":"HR","Isle_of_Man":"IM","Jersey":"JE","Phnom_Penh":"KH","Comoro":"KM","St_Kitts":"KN","Kuwait":"KW","Cayman":"KY","Vientiane":"LA","St_Lucia":"LC","Vaduz":"LI","Maseru":"LS","Podgorica":"ME","Marigot":"MF","Antananarivo":"MG","Skopje":"MK","Bamako":"ML","Saipan":"MP","Nouakchott":"MR","Montserrat":"MS","Blantyre":"MW","Niamey":"NE","Muscat":"OM","Kigali":"RW","St_Helena":"SH","Ljubljana":"SI","Longyearbyen":"SJ","Bratislava":"SK","Freetown":"SL","San_Marino":"SM","Dakar":"SN","Mogadishu":"SO","Lower_Princes":"SX","Mbabane":"SZ","Lome":"TG","Port_of_Spain":"TT","Dar_es_Salaam":"TZ","Kampala":"UG","Midway":"UM","Vatican":"VA","St_Vincent":"VC","Tortola":"VG","St_Thomas":"VI","Aden":"YE","Mayotte":"YT","Lusaka":"ZM","Harare":"ZW"}
    const userCountry = cityToCountryCode[userCity];
    chrome.storage.local.set({"userCountry": userCountry})
  }
}
setUserRegion()

function JSONtoNestedList(prompts) {
  if (prompts.length === 0) {
    return [
      [
        "category",
        "date",
        "id",
        "lastChanged",
        "tags",
        "text",
        "time",
        "title",
      ],
    ];
  }

  prompts = prompts.reverse();

  const headers = [
    "category",
    "date",
    "id",
    "lastChanged",
    "tags",
    "text",
    "time",
    "title",
  ];
  const values = [];

  // Add headers to the values array
  values.push(headers);

  // Loop through each prompt in the array
  for (let prompt of prompts) {
    const promptValues = [];

    // Loop through each header and check if the prompt has the key
    for (let header of headers) {
      if (prompt.hasOwnProperty(header)) {
        // If the prompt has the key, add the value to the promptValues array
        if (Array.isArray(prompt[header])) {
          promptValues.push(prompt[header].join(";"));
        } else {
          promptValues.push(prompt[header]);
        }
      } else {
        // If the prompt does not have the key, add an empty string to the promptValues array
        promptValues.push("");
      }
    }

    // Add the promptValues array to the values array
    values.push(promptValues);
  }

  return values;
}

async function updateSheetData(spreadsheetId, range, data) {
  try {
    const token = await getAuthToken();
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
    const clearResponse = await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    if (!clearResponse.ok) {
      throw new Error("Failed to clear sheet");
    }
    const values = JSONtoNestedList(data);
    const requestBody = {
      values: values,
    };
    const valueInputOption = "USER_ENTERED";
    const endpointUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`;
    const response = await fetch(endpointUrl, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error("Failed to update spreadsheet");
    }
  } catch (error) {
    console.error(error);
  }
}

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        chrome.storage.local.set({ token: token });
        resolve(token);
      }
    });
  });
}

async function getSheetData(spreadsheetId, range) {
  try {
    const mumboJumbo = "AIzaSyAjjnHsq4rkzK7jtjZ_zvs62lT8nqeQVoU"; // this isn't dangerous but you can ignore it
    const token = await getAuthToken();
    const endpointUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${mumboJumbo}`;
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    const response = await fetch(endpointUrl, {
      method: "GET",
      headers: headers,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch data from endpoint");
    }
    const data = await response.json();
    const headersRow = [
      "category",
      "date",
      "id",
      "lastChanged",
      "tags",
      "text",
      "time",
      "title",
    ]; // allows user to translate if they want
    const values = data.values.slice(1);
    const jsonData = values.map((row) => {
      const obj = {};
      headersRow.forEach((header, index) => {
        if (header === "tags") {
          obj[header] = row[index].split(";");
          if (obj[header][0] === "") {
            obj[header] = [];
          }
        } else {
          obj[header] = row[index];
        }
      });
      return obj;
    });
    return jsonData.reverse();
  } catch (error) {
    console.error(error);
  }
}

async function getPrompts() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ prompts: [] }, function (data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.prompts);
      }
    });
  });
}

async function getSheetID() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({ sheetID: "" }, function (data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.sheetID);
      }
    });
  });
}

async function resyncStuff() {
  const dp = await chrome.storage.local.get({ deletedPrompts: [] });
  const deletedPrompts = dp.deletedPrompts;
  const np = await chrome.storage.local.get({ newPrompts: [] });
  const newPrompts = np.newPrompts;
  const cp = await chrome.storage.local.get({ changedPrompts: [] });
  const changedPrompts = cp.changedPrompts;
  const localPrompts = await getPrompts();
  const sheetID = await getSheetID();
  syncPrompts(
    deletedPrompts,
    newPrompts,
    changedPrompts,
    localPrompts,
    sheetID,
  );
}

function moreThan15Min(timestamp) {
  // Get the current time in milliseconds
  const currentTime = new Date().getTime();

  // Calculate the time difference in milliseconds
  const timeDiff = currentTime - timestamp;

  // Check if the time difference is less than 15 minutes (in milliseconds)
  const fifteenMinutesInMs = 15 * 60 * 1000; // 15 minutes in milliseconds
  return timeDiff > fifteenMinutesInMs;
}

async function syncPrompts(
  deletedPrompts,
  newPrompts,
  changedPrompts,
  localPrompts,
  sheetId,
) {
  try {
    // Get prompts from the Google Sheets version
    const syncedPrompts = await getSheetData(sheetId, "Sheet1!A1:Z");

    // Remove deleted prompts from the cloud version
    deletedPrompts.forEach((id) => {
      const index = syncedPrompts.findIndex((prompt) => prompt.id === id);
      if (index !== -1) {
        syncedPrompts.splice(index, 1);
      }
    });

    // Add new/revised prompts to the cloud version
    newPrompts.concat(changedPrompts).forEach((id) => {
      const localPrompt = localPrompts.find((prompt) => prompt.id === id);
      const cloudPrompt = syncedPrompts.find((prompt) => prompt.id === id);

      if (localPrompt) {
        if (!cloudPrompt) {
          syncedPrompts.push(localPrompt);
        } else {
          // Merge the two prompts
          if (
            cloudPrompt?.lastChanged === undefined ||
            localPrompt?.lastChanged > cloudPrompt?.lastChanged
          ) {
            cloudPrompt.text = localPrompt.text;
            cloudPrompt.time = localPrompt.time;
            cloudPrompt.category = localPrompt.category;
            cloudPrompt.title = localPrompt.title;
            cloudPrompt.date = localPrompt.date;
            cloudPrompt.tags = localPrompt.tags.join(";");
            if (!localPrompt?.lastChanged && !cloudPrompt?.lastChanged) {
              cloudPrompt.lastChanged = new Date().getTime();
            } else if (localPrompt?.lastChanged > cloudPrompt?.lastChanged) {
              cloudPrompt.lastChanged = localPrompt.lastChanged;
            } else {
              cloudPrompt.lastChanged = new Date().getTime();
            }
          }

          // Find the index of the merged prompt in the sheetData array
          const index = syncedPrompts.findIndex((prompt) => prompt.id === id);

          // Replace the old prompt with the merged prompt
          if (index !== -1) {
            syncedPrompts[index] = cloudPrompt;
          } else {
            syncedPrompts.push(cloudPrompt);
          }
        }
      }
    });

    // Update the Chrome storage version with the merged data
    const correctTags = [];
    for (let prompt of syncedPrompts) {
      if (typeof prompt.tags === "string") {
        if (prompt?.tags[0] && prompt?.tags !== "") {
          prompt.tags = prompt.tags.split(";");
        }
      }
      correctTags.push(prompt);
    }
    chrome.storage.local.set({ prompts: correctTags });
    chrome.storage.local.set({ deletedPrompts: [] });
    chrome.storage.local.set({ changedPrompts: [] });
    chrome.storage.local.set({ newPrompts: [] });
    const time = new Date().getTime();
    chrome.storage.local.set({ lastSynced: time });
    // Update the Google Sheets version with the merged data
    await updateSheetData(sheetId, "Sheet1!A1:Z", syncedPrompts);
  } catch (error) {
    console.error(error);
  }
}

async function setUninstallURL() {
  const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
  const userCountry = await getFromStorage("userCountry", "US")
  const activeCountries = await getCurrentAdLocales()
  const adLocale = (activeCountries.includes(userCountry)) ? userCountry : "US" // if the user's country has a specific ad active, use that one instead
  const rando = generateUUID(); // to not get cached version because headers were causing problems.
  const response = await fetch(`${host}/ads/local/${adLocale}/currentUrl.txt?dummy=${rando}`);
  if (!response.ok) {
    throw new Error("HTTP error " + response.status);
  }
  const url = await response.text();
  chrome.runtime.setUninstallURL(url);
}
setUninstallURL();

function getDate() {
  // generated by ChatGPT
  var date = new Date();
  var options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleString("default", options);
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

function new_prompt(title, text, tags = "", category = "") {
  let prompt = {
    date: getDate(),
    time: getTime(),
    id: generateUUID(),
    title: title,
    text: text,
    tags: tags,
    category: category,
  };
  return prompt;
}
chrome.runtime.onInstalled.addListener(async () => {
  setUserRegion();
  setUninstallURL();
  chrome.contextMenus.create({
    id: "savePrompt",
    title: "Save text as prompt",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "savePrompt") {
    chrome.storage.local.get({ prompts: [] }, function (result) {
      let prompts = result.prompts;
      prompts.push(new_prompt("", info.selectionText));
      chrome.storage.local.set({ prompts: prompts });
      chrome.tabs.create({ url: "pages/prompts.html" });
      setTimeout(
        () => chrome.runtime.sendMessage({ message: "New Prompt" }),
        300,
      );
    });
  }
});

chrome.storage.local.get({ autoDetectedLocale: false }, function (result) {
  if (!result.autoDetectedLocale) {
    let acceptedLanguages = [
      "de",
      "en",
      "es",
      "fr",
      "hu",
      "it",
      "pt_BR",
      "pt_PT",
      "ru",
      "tr",
      "uk",
      "zh_CN",
      "zh_TW",
    ];
    chrome.i18n.getAcceptLanguages(function (languages) {
      //console.log(languages)
      for (let lang of languages) {
        lang = lang.replace("-", "_");
        if (acceptedLanguages.includes(lang)) {
          chrome.storage.local.set({ lang: lang });
          chrome.storage.local.set({ autoDetectedLocale: true });
          break;
        } else if (acceptedLanguages.includes(lang.split("_")[0])) {
          chrome.storage.local.set({ lang: lang.split("_")[0] });
          chrome.storage.local.set({ autoDetectedLocale: true });
          break;
        }
      }
    });
  }
});
