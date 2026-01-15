// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        activeMode: null,
        syllabus: "Data Structures, Algorithms, React, Machine Learning",
        strictness: "medium"
    });
});
