# VoiceCart AI - Voice Command Shopping Assistant

> A modern, voice-activated shopping list manager with natural language intent understanding, smart recommendations, seasonal insights, product substitutes, and multilingual voice recognition.

---

## 📝 Approach Write-Up (Technical Summary - 142 Words)

VoiceCart AI is built as a zero-dependency, high-performance web application designed for fast, accessible, and intuitive voice-based shopping list management. It leverages the browser's native Web Speech API for real-time speech recognition and text-to-speech feedback, providing zero latency and no server overhead. Commands are parsed using a client-side regex and entity extractor. The system automatically extracts product names, quantities, units, brands, categories, and price thresholds. To enhance user utility, VoiceCart features a Smart Suggestions Engine providing low-stock alerts based on shopping history, seasonal product highlights, and dietary substitute recommendations. The minimalist responsive UI includes a dedicated Hands-Free Voice HUD, dark mode, live waveform visualizer, checkout demo, and LocalStorage persistence for an optimal voice-first shopping experience.

---

## ✨ Features Overview

### 1. Voice Input & Speech Synthesis
- **Voice Command Recognition**: Real-time microphone listening via Web Speech API (`SpeechRecognition`).
- **Text-to-Speech Feedback**: Speaks audio confirmations after executing actions (`speechSynthesis`).
- **Multilingual Support**: Supports English and Hindi voice recognition.
- **Audio Waveform & HUD**: Interactive mic visualizer and full-screen **Hands-Free Voice HUD Mode**.

### 2. Natural Language Processing (NLP)
- Parses natural utterances without requiring strict command syntax:
   - *"Add 2 bottles of organic milk for ₹4"*
  - *"Put 6 bananas on my list"*
  - *"Remove bread"*
   - *"Find items under ₹5"*
  - *"What should I buy?"*
- Auto-extracts: **Product Name**, **Quantity**, **Measurement Unit**, **Category**, **Price Limit**, and **Brand**.

### 3. Smart Suggestions Engine
- **Product Recommendations**: Low-stock alerts based on purchase history and frequency.
- **Seasonal Recommendations**: Contextual seasonal items (Spring, Summer, Autumn, Winter).
- **Dietary & Product Substitutes**: Healthier alternatives (e.g. Almond Milk for Milk, Whole Wheat for White Bread).

### 4. Shopping List Management
- Automatic item categorization (*Produce, Dairy, Bakery, Meat, Pantry, Beverages, Snacks, Personal Care, Household*).
- Quantity modification (+/-) and status toggling (completion state).
- Total estimated price calculation & item counters.
- Search bar with live keyword and price filter cap (*"items under ₹5"*).

---

## 🛠️ Architecture & Project Structure

```
voice-commanding/
├── index.html        # Main Application Interface & Modals
├── styles.css        # Visualizer Animations, Theme Styles & HUD Overlay
├── README.md         # Documentation & Approach Write-Up
├── .gitignore        # Submission Cleanup Rules
└── js/
    ├── app.js        # Main Controller & UI Event Dispatcher
    ├── voice.js      # SpeechRecognition & SpeechSynthesis Wrapper
    ├── nlp.js        # Hybrid Intent & Entity Extraction Engine
    ├── suggestions.js# Smart History, Seasonal & Substitutes Engine
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

## 🌐 Publish a Permanent Public Link

`localhost` is only a temporary server on your own computer. It stops when the terminal closes and cannot be opened by other people. To publish VoiceCart AI permanently:

1. Create a new public repository on [GitHub](https://github.com/new).
2. Upload all project files, including `index.html`, `styles.css`, and the `js` folder.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and the `/ (root)` folder, then click **Save**.
6. Wait for GitHub's deployment, then share the URL shown in **Settings → Pages**. It will look like:
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

Use Chrome or Edge for microphone recognition. The browser will ask each visitor for microphone permission. GitHub Pages hosts the app permanently, while each visitor's shopping list remains private in their own browser LocalStorage.

---

## 📌 Checklist Compliance & Best Practices
- ✅ **No extra dependencies or `node_modules`** (native browser APIs & minimal Tailwind CDN).
- ✅ **Clean code structure** separated into modular ES classes (`VoiceManager`, `NLPParser`, `SuggestionsEngine`, `StorageManager`).
- ✅ **Clean git state** with `.gitignore` for build files and `.env`.
- ✅ **Main branch ready** for public GitHub repository submission.
