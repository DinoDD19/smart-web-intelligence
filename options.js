// options.js
document.addEventListener('DOMContentLoaded', () => {
    const syllabusInput = document.getElementById('syllabus-input');
    const saveBtn = document.getElementById('save-syllabus');
    const statusMsg = document.getElementById('save-status');
    const closeBtn = document.getElementById('close-btn');

    // Load current settings
    chrome.storage.local.get(['syllabus'], (result) => {
        if (result.syllabus) {
            syllabusInput.value = result.syllabus;
        } else {
            syllabusInput.value = "Data Structures, Algorithms, System Design";
        }
    });

    // Save Syllabus
    saveBtn.addEventListener('click', () => {
        const value = syllabusInput.value;
        chrome.storage.local.set({
            syllabus: value
        }, () => {
            statusMsg.textContent = "Saved!";
            statusMsg.style.opacity = '1';
            setTimeout(() => {
                statusMsg.style.opacity = '0';
            }, 2000);
        });
    });

    // Close Button (Close tab)
    closeBtn.addEventListener('click', () => {
        window.close();
    });
});
