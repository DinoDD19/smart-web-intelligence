// content.js - Embedded Models Release

let currentMode = null;
let originalBody = null;

// --- Embedded Models (Fix for "Failed to fetch") ---
const NOISE_MODEL = {
    "selectors": [
        "aside", ".ad", ".ads", ".advertisement", ".social-share", ".popup",
        ".subscribe-widget", ".cookie-consent", "footer", ".sidebar", ".promoted"
    ],
    "keywords": ["subscribe", "sign up", "advertisement", "promoted", "sponsored", "buy now"]
};

const SKILL_MODEL = {
    "categories": {
        "Languages": ["Python", "JavaScript", "TypeScript", "Java", "C\\+\\+", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby"],
        "Frontend": ["React", "Vue", "Angular", "Svelte", "HTML", "CSS", "Tailwind", "Bootstrap", "Redux", "Webpack", "Vite"],
        "Backend": ["Node\\.js", "Django", "Flask", "FastAPI", "Spring", "Express", "NestJS", "GraphQL", "REST API"],
        "Database": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Firebase", "Supabase"],
        "DevOps": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "Git", "GitHub", "GitLab"],
        "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "NLP", "LLM", "Hugging Face"]
    }
};

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setMode") {
        applyMode(request.mode)
            .then(result => sendResponse(result))
            .catch(err => console.error(err));
        return true;
    }
});

async function applyMode(mode) {
    console.log(`Switching to mode: ${mode}`);

    if (!originalBody) {
        originalBody = document.body.innerHTML;
    }

    currentMode = mode;

    switch (mode) {
        case 'clean':
            return applyCleanReading();
        case 'study':
            return applyStudyMode();
        case 'career':
            return applyCareerMode();
        case null:
            if (originalBody) document.body.innerHTML = originalBody;
            return {};
    }
}

function applyCleanReading() {
    const selectors = NOISE_MODEL.selectors.join(',');
    const elements = document.querySelectorAll(selectors);

    let count = 0;
    elements.forEach(el => {
        el.style.opacity = '0.1'; // Fade out
        el.style.pointerEvents = 'none';
        count++;
    });

    console.log(`Clean Reading: Dimmed ${count} elements.`);
    return { status: "active", count: count };
}

async function applyStudyMode() {
    const data = await chrome.storage.local.get('syllabus');
    const syllabusText = data.syllabus || "Data Structures, Algorithms";
    const keywords = syllabusText.split(',').map(s => s.trim().toLowerCase()).filter(s => s);

    if (keywords.length === 0) return;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                const tag = node.parentElement.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
                    node.parentElement.isContentEditable) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodesToHighlight = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue.toLowerCase();

        if (keywords.some(k => text.includes(k))) {
            nodesToHighlight.push(node);
        }
    }

    let matchCount = 0;
    nodesToHighlight.forEach(node => {
        // Prevent double highlighting
        if (node.parentElement && node.parentElement.dataset.swia === "highlight") return;

        const span = document.createElement('span');
        span.style.backgroundColor = '#fef08a';
        span.style.color = '#000';
        span.style.borderRadius = '2px';
        span.dataset.swia = "highlight";

        const parent = node.parentNode;
        if (parent) {
            parent.insertBefore(span, node);
            span.appendChild(node);
            matchCount++;
        }
    });

    return { status: "active", matchCount: matchCount };
}

function applyCareerMode() {
    const text = document.body.innerText;
    const foundSkills = new Set();

    Object.values(SKILL_MODEL.categories).forEach(skillList => {
        skillList.forEach(skillPattern => {
            try {
                const regex = new RegExp(`\\b${skillPattern}\\b`, 'i');
                if (regex.test(text)) {
                    const displayName = skillPattern.replace(/\\/g, '');
                    foundSkills.add(displayName);
                }
            } catch (e) {
                console.warn(`Invalid regex`, e);
            }
        });
    });

    return { status: "active", skills: Array.from(foundSkills).sort() };
}
