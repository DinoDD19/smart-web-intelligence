document.addEventListener('DOMContentLoaded', async () => {
    const modeCards = document.querySelectorAll('.mode-card');
    const applyBtn = document.getElementById('apply-btn');
    const disableBtn = document.getElementById('disable-btn');
    const settingsBtn = document.getElementById('open-settings');
    const feedbackArea = document.getElementById('results-feedback');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Load saved state
    const data = await chrome.storage.local.get(['activeMode', 'extractedSkills']);

    // Initial UI Setup
    if (data.activeMode) {
        selectModeVisuals(data.activeMode);
        if (data.activeMode === 'career' && data.extractedSkills) {
            showResults(data.extractedSkills);
        }
    }

    // Input/Card Click Handlers
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Visual selection
            const mode = card.dataset.mode;
            selectModeVisuals(mode);
            // We do NOT apply immediately on click (unlike previous version), 
            // we wait for "Apply" button as per new UI button existence.
            // But user might expect immediate apply. Let's support both:
            // The UI has an "Apply" button, suggesting explicit action.
        });
    });

    // Apply Button
    applyBtn.addEventListener('click', async () => {
        const selected = document.querySelector('.mode-card.selected');
        if (selected) {
            const mode = selected.dataset.mode;
            await activateMode(mode);
        }
    });

    // Disable/Reset
    disableBtn.addEventListener('click', async () => {
        selectModeVisuals(null); // Clear selection
        await activateMode(null);
        feedbackArea.classList.add('hidden');
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    function selectModeVisuals(mode) {
        modeCards.forEach(c => {
            c.classList.remove('selected');
            const radio = c.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });

        if (mode) {
            const card = document.querySelector(`.mode-card[data-mode="${mode}"]`);
            if (card) {
                card.classList.add('selected');
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            }
        }
    }

    async function activateMode(mode) {
        // 1. Update Storage
        await chrome.storage.local.set({ activeMode: mode });

        // 2. Pre-check URL
        if (tab && tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || !tab.url.startsWith('http'))) {
            feedbackArea.textContent = "Extension cannot run on this internal page.";
            feedbackArea.classList.remove('hidden');
            return;
        }

        // 3. Send Message
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "setMode", mode: mode }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Content script error: ", chrome.runtime.lastError.message);
                    feedbackArea.textContent = "Cannot reach page. Try reloading the tab.";
                    feedbackArea.classList.remove('hidden');
                    return;
                }

                // Handle results
                if (response && response.skills) {
                    chrome.storage.local.set({ extractedSkills: response.skills });
                    showResults(response.skills);
                } else if (response && response.matchCount !== undefined) {
                    feedbackArea.textContent = `Study Mode: Highlighted ${response.matchCount} key terms.`;
                    feedbackArea.classList.remove('hidden');
                } else {
                    feedbackArea.textContent = "Mode Applied.";
                    feedbackArea.classList.remove('hidden');
                    setTimeout(() => feedbackArea.classList.add('hidden'), 2000);
                }
            });
        }
    }

    function showResults(skills) {
        feedbackArea.innerHTML = '';
        if (!skills || skills.length === 0) {
            feedbackArea.textContent = "No skills found.";
        } else {
            feedbackArea.textContent = "";
            skills.forEach(s => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = s;
                feedbackArea.appendChild(tag);
            });
        }
        feedbackArea.classList.remove('hidden');
    }
});
