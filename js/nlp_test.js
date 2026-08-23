import { NLPParser } from './nlp.js';

const utteranceEl = document.getElementById('utterance');
const parseBtn = document.getElementById('parseBtn');
const clearBtn = document.getElementById('clearBtn');
const resultEl = document.getElementById('result');
const copyBtn = document.getElementById('copyResultBtn');

function setResult(obj) {
    resultEl.textContent = JSON.stringify(obj, null, 2);
}

document.querySelectorAll('.samples button').forEach(b => {
    b.addEventListener('click', async () => {
        utteranceEl.value = b.getAttribute('data-txt');
        // auto-parse for quicker feedback
        await doParse();
    });
});

async function doParse() {
    const text = utteranceEl.value.trim();
    if (!text) return;
    setResult({ status: 'parsing' });
    try {
        const parsed = await NLPParser.parse(text);
        setResult(parsed);
    } catch (err) {
        setResult({ error: err.message });
    }
}

parseBtn.addEventListener('click', doParse);

clearBtn.addEventListener('click', () => {
    utteranceEl.value = '';
    setResult({ info: 'no parse yet' });
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultEl.textContent);
});

// keyboard support: Enter to parse (while focused in textarea)
utteranceEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doParse();
    }
});
