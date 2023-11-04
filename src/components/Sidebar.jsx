import i18n from "i18next";
import k from "./../i18n/keys";
import Logo from "./Logo.jsx";
import Folder from "./Folder.jsx";
import FolderModal from "./FolderModal.jsx";
import {
  getCurrentTimestamp,
  newBlankPrompt,
  newFilteredPrompt,
  uuid,
} from "./js/utils.js";
import {
  ArrowNewWindow,
  Cog,
  HomeIcon,
  PlusDoc,
  PlusFolder,
} from "./icons/Icons.jsx";
import React, { useState } from "react";
import SettingsModal from "./SettingsModal.jsx";
import Toast from "./Toast.jsx";

export default function Sidebar({
  setPrompts,
  setFolders,
  folders,
  filteredPrompts,
  filterPrompts,
  setFilteredPrompts,
  setSelectedFolder,
  selectedFolder,
  filterTags,
  setFilterTags,
  searchTerm,
  setSearchTerm,
  showToast,
}) {
  const t = i18n.t;

  const [folderModal, setFolderModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);

  function newPrompt() {
    const folder = selectedFolder;
    const promptObj = {
      title: "",
      text: "",
      tags: [],
      folder,
      id: uuid(),
      lastChanged: getCurrentTimestamp(),
    };
    setPrompts(newBlankPrompt(promptObj));
    setFilteredPrompts(newFilteredPrompt(promptObj, filteredPrompts));
    setTimeout(() => {
      const btn = document.querySelector(".edit");
      if (btn) btn.click();
    }, 50);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isFullScreen = urlParams.get("fullscreen") === "true";

  function openFolderModal() {
    setFolderModal(true);
  }

  function closeFolderModal() {
    setFolderModal(false);
  }

  function openSettings() {
    setSettingsModal(true);
  }

  function selectFolder(name) {
    setSelectedFolder(name);
    filterPrompts(name, filterTags, searchTerm);
    document.querySelectorAll(".folder").forEach((folder) => {
      folder.classList.remove("selected");
    });
    document.getElementById(`folder-${name}`).classList.add("selected");
  }

  function openFullscreen() {
    console.log("OPENING!");
    // Create the message object
    var message = {
      message: "openFullScreen",
    };

    // Stringify the object to send via postMessage
    var messageString = JSON.stringify(message);

    // Send the message to the parent window
    window.parent.postMessage(messageString, "*");
  }

  return (
    <div>
      <div>
        <div className="max-[400px]:hidden max-[600px]:w-[160px] z-30 flex w-[230px] flex-col overflow-hidden h-full">
          <div className="flex flex-col justify-between h-full border-r border-base-200 bg-base-200">
            <div className="flex grow flex-col overflow-y-auto">
              <Logo />
              <ul id="folderList" className="menu p-4 text-base-content sticky">
                {/* Sidebar content here */}
                <li
                  key=""
                  className="selected folder"
                  data-folder-name="all"
                  id="folder-"
                >
                  <a onClick={() => selectFolder("")}>
                    <HomeIcon></HomeIcon>
                    {t(k.ALL_PROMPTS)}
                  </a>
                </li>
                {folders.map((folder) => (
                  <Folder
                    id={`${t(k.FOLDER)}${folder}`}
                    key={folder}
                    folder={folder}
                    onClick={() => selectFolder(folder)}
                  ></Folder>
                ))}
              </ul>
            </div>
            <ul className="menu p-3 text-base-content flex flex-col border-t-2 border-base-300">
              <li>
                <a onClick={newPrompt}>
                  <PlusDoc /> {t(k.NEW_PROMPT)}
                </a>
              </li>
              <li>
                <a onClick={openFolderModal}>
                  <PlusFolder /> {t(k.NEW_FOLDER)}
                </a>
              </li>
              {!isFullScreen && (
                <li>
                  <a onClick={openFullscreen}>
                    {" "}
                    <ArrowNewWindow /> {t(k.OPEN_FULLSCREEN)}
                  </a>
                </li>
              )}
              <li>
                <a onClick={openSettings}>
                  <Cog /> {t(k.SETTINGS)}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="min-[400px]:hidden menu menu-horizontal bg-base-200 opacity-100 z-10 w-full flex absolute bottom-0">
          <li className="w-1/2">
            <a onClick={newPrompt}>
              <PlusDoc /> {t(k.NEW_PROMPT)}
            </a>
          </li>
          <li className="w-1/2">
            <a onClick={openFullscreen}>
              {" "}
              <ArrowNewWindow /> {t(k.OPEN_FULLSCREEN)}
            </a>
          </li>
        </div>
      </div>

      {folderModal && (
        <FolderModal setFolders={setFolders} onClose={closeFolderModal} />
      )}

      {settingsModal && (
        <SettingsModal
          setSettingsVisible={setSettingsModal}
          setSelectedFolder={setSelectedFolder}
          setFilterTags={setFilterTags}
          setSearchTerm={setSearchTerm}
          setFolders={setFolders}
          setFilteredPrompts={setFilteredPrompts}
          showToast={showToast}
          folders={folders}
          setPrompts={setPrompts}
          filterPrompts={filterPrompts}
        />
      )}
    </div>
  );
}
