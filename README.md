# VoiceCart AI - Voice Command Shopping Assistant

> A modern, voice-activated shopping list manager with natural language intent understanding, smart recommendations, seasonal insights, product substitutes, and multilingual voice recognition.

---

## 🌐 Live Application & Submission Links
- **GitHub Repository**: [https://github.com/ayushisharma1603/Voice-Commanding](https://github.com/ayushisharma1603/Voice-Commanding)
- **Working Application Live URL**: [https://ayushisharma1603.github.io/Voice-Commanding/](https://ayushisharma1603.github.io/Voice-Commanding/)

---

## 📝 Approach Write-Up (Technical Summary - 142 Words)

VoiceCart AI is built as a zero-dependency, high-performance web application designed for fast, accessible, and intuitive voice-based shopping list management. It leverages the browser's native Web Speech API for real-time speech recognition and text-to-speech feedback, providing zero latency and no server overhead. Commands are parsed using a smart hybrid Natural Language Processing (NLP) pipeline combining a client-side regex/entity extractor with an optional Google Gemini AI API integration. The system automatically extracts product names, quantities, units, brands, categories, and price thresholds, handling varied natural phrasing across 6 languages. To enhance user utility, VoiceCart features a Smart Suggestions Engine providing low-stock alerts based on shopping history, seasonal product highlights, and dietary substitute recommendations. The minimalist responsive UI includes a dedicated Hands-Free Voice HUD, dark mode, live waveform visualizer, and LocalStorage persistence for an optimal voice-first shopping experience.

---

## ✨ Features Overview

### 1. Voice Input & Speech Synthesis
- **Voice Command Recognition**: Real-time microphone listening via Web Speech API (`SpeechRecognition`).
- **Text-to-Speech Feedback**: Speaks audio confirmations after executing actions (`speechSynthesis`).
- **Multilingual Support**: Supports English, Spanish, French, German, Hindi, and Chinese voice commands.
- **Audio Waveform & HUD**: Interactive mic visualizer and full-screen **Hands-Free Voice HUD Mode**.

### 2. Natural Language Processing (NLP)
- Parses natural utterances without requiring strict command syntax:
  - *"Add 2 bottles of organic milk for $4"*
  - *"Put 6 bananas on my list"*
  - *"Remove bread"*
  - *"Find items under $5"*
  - *"What should I buy?"*
- Auto-extracts: **Product Name**, **Quantity**, **Measurement Unit**, **Category**, **Price Limit**, and **Brand**.
- **Gemini AI Integration**: Optional setting to supply a Gemini API key for advanced conversational intent parsing.

### 3. Smart Suggestions Engine
- **Product Recommendations**: Low-stock alerts based on purchase history and frequency.
- **Seasonal Recommendations**: Contextual seasonal items (Spring, Summer, Autumn, Winter).
- **Dietary & Product Substitutes**: Healthier alternatives (e.g. Almond Milk for Milk, Whole Wheat for White Bread).

### 4. Shopping List Management
- Automatic item categorization (*Produce, Dairy, Bakery, Meat, Pantry, Beverages, Snacks, Personal Care, Household*).
- Quantity modification (+/-) and status toggling (completion state).
- Total estimated price calculation & item counters.
- Search bar with live keyword and price filter cap (*"items under $5"*).

---

## 🛠️ Architecture & Project Structure

```
voice-commanding/
├── index.html        # Main Application Interface & Modals
├── styles.css        # Visualizer Animations, Theme Styles & HUD Overlay
├── README.md         # Documentation & Approach Write-Up
├── .gitignore        # Submission Cleanup Rules
└── js/
    ├── app.js        # Main Controller & UI Dispatcher
    ├── voice.js      # SpeechRecognition & SpeechSynthesis Wrapper
    ├── nlp.js        # Hybrid Intent & Entity Extraction Engine
    ├── suggestions.js# Smart History, Seasonal & Substitutes Engine
    ├── sound.js      # Web Audio API SoundFX Synthesizer
    └── storage.js    # LocalStorage Persistence & Category DB
```

---

## 🚀 How to Run Locally

Because VoiceCart AI is built with modern ES Modules and native web standards, it requires **zero installation** or build steps!

1. **Option A: Python HTTP Server (Recommended)**
   ```bash
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your web browser (**Google Chrome**, **Microsoft Edge**, or **Safari** recommended for speech recognition).

2. **Option B: VS Code Live Server**
   Right-click `index.html` and select **"Open with Live Server"**.

---

## 📌 Checklist Compliance & Best Practices
- ✅ **No extra dependencies or `node_modules`** (native browser APIs & minimal Tailwind CDN).
- ✅ **Clean code structure** separated into modular ES classes (`VoiceManager`, `NLPParser`, `SuggestionsEngine`, `StorageManager`, `SoundFX`).
- ✅ **Clean git state** with `.gitignore` for build files and `.env`.
- ✅ **Main branch ready** for public GitHub repository submission.
