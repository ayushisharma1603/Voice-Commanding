/**
 * App Controller - Main application orchestration module
 * Connects VoiceManager, NLPParser, SuggestionsEngine, SoundFX, and StorageManager with DOM UI.
 */

import { StorageManager } from './storage.js';
import { SuggestionsEngine } from './suggestions.js';
import { NLPParser, RECIPE_BUNDLES } from './nlp.js';
import { VoiceManager } from './voice.js';
import { SoundFX } from './sound.js';

class App {
    constructor() {
        this.items = StorageManager.getItems();
        this.activeCategory = 'ALL';
        this.searchQuery = '';
        this.maxPriceFilter = null;
        this.soundEnabled = true;
        this.voiceManager = null;

        this.initDOM();
        this.initVoice();
        this.initEventListeners();
        this.render();
    }

    /**
     * Cache DOM Elements
     */
    initDOM() {
        this.micBtn = document.getElementById('micBtn');
        this.micIcon = document.getElementById('micIcon');
        this.micSubtext = document.getElementById('micSubtext');
        this.voiceStatusDot = document.getElementById('voiceStatusDot');
        this.voiceStatusText = document.getElementById('voiceStatusText');
        this.audioWaveform = document.getElementById('audioWaveform');
        this.transcriptBox = document.getElementById('transcriptBox');
        this.transcriptText = document.getElementById('transcriptText');

        this.languageSelect = document.getElementById('languageSelect');
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.themeIcon = document.getElementById('themeIcon');
        this.toggleVoiceHudBtn = document.getElementById('toggleVoiceHudBtn');
        this.voiceHudOverlay = document.getElementById('voiceHudOverlay');
        this.exitVoiceHudBtn = document.getElementById('exitVoiceHudBtn');
        this.hudMicBtn = document.getElementById('hudMicBtn');
        this.hudTranscriptBox = document.getElementById('hudTranscriptBox');
        this.hudLangText = document.getElementById('hudLangText');

        // Export Menu
        this.exportDropdownBtn = document.getElementById('exportDropdownBtn');
        this.exportMenu = document.getElementById('exportMenu');
        this.copyListBtn = document.getElementById('copyListBtn');
        this.downloadCsvBtn = document.getElementById('downloadCsvBtn');

        // Dashboard Stats
        this.dashTotalItems = document.getElementById('dashTotalItems');
        this.dashCompletedPercent = document.getElementById('dashCompletedPercent');
        this.dashProgressBar = document.getElementById('dashProgressBar');
        this.dashEstTotal = document.getElementById('dashEstTotal');

        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.seasonBadge = document.getElementById('seasonBadge');
        this.refreshSuggestionsBtn = document.getElementById('refreshSuggestionsBtn');

        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.activeFilterBanner = document.getElementById('activeFilterBanner');
        this.activeFilterText = document.getElementById('activeFilterText');
        this.resetFilterBtn = document.getElementById('resetFilterBtn');
        this.categoryFilterTabs = document.getElementById('categoryFilterTabs');

        this.shoppingListContainer = document.getElementById('shoppingListContainer');
        this.emptyListState = document.getElementById('emptyListState');
        this.itemCountBadge = document.getElementById('itemCountBadge');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        this.summaryTotalCount = document.getElementById('summaryTotalCount');
        this.summaryPendingCount = document.getElementById('summaryPendingCount');
        this.summaryTotalPrice = document.getElementById('summaryTotalPrice');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.checkoutModal = document.getElementById('checkoutModal');
        this.closeCheckoutModalBtn = document.getElementById('closeCheckoutModalBtn');
        this.checkoutFormView = document.getElementById('checkoutFormView');
        this.checkoutSuccessView = document.getElementById('checkoutSuccessView');
        this.checkoutItems = document.getElementById('checkoutItems');
        this.checkoutTotal = document.getElementById('checkoutTotal');
        this.placeOrderBtn = document.getElementById('placeOrderBtn');
        this.doneCheckoutBtn = document.getElementById('doneCheckoutBtn');
        this.orderConfirmationText = document.getElementById('orderConfirmationText');

        // Modals
        this.addItemModal = document.getElementById('addItemModal');
        this.openAddItemModalBtn = document.getElementById('openAddItemModalBtn');
        this.closeAddItemModalBtn = document.getElementById('closeAddItemModalBtn');
        this.cancelAddItemModalBtn = document.getElementById('cancelAddItemModalBtn');
        this.manualAddForm = document.getElementById('manualAddForm');

        this.settingsModal = document.getElementById('settingsModal');
        this.openSettingsBtn = document.getElementById('openSettingsBtn');
        this.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.voiceFeedbackToggle = document.getElementById('voiceFeedbackToggle');
        this.soundFxToggle = document.getElementById('soundFxToggle');
        this.voiceSpeedRange = document.getElementById('voiceSpeedRange');
        this.speedValueText = document.getElementById('speedValueText');
        // Gemini API key removed from settings UI
        this.geminiApiKeyInput = null;
        this.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * Initialize Voice Recognition engine
     */
    initVoice() {
        this.voiceManager = new VoiceManager(
            (result) => this.handleSpeechResult(result),
            (stateInfo) => this.handleVoiceStateChange(stateInfo)
        );

        const settings = StorageManager.getSettings();
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
            this.themeIcon.setAttribute('data-lucide', 'sun');
        }
        if (settings.language) {
            this.languageSelect.value = settings.language;
            this.updateHudLangText(settings.language);
        }
    }

    /**
     * Attach UI Event Listeners
     */
    initEventListeners() {
        // Mic Button Click
        const triggerMic = () => {
            if (this.soundEnabled) SoundFX.playMicStart();
            this.voiceManager.startListening();
        };
        this.micBtn.addEventListener('click', triggerMic);
        this.hudMicBtn.addEventListener('click', triggerMic);

        // Language Select
        this.languageSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            this.voiceManager.setLanguage(lang);
            const settings = StorageManager.getSettings();
            settings.language = lang;
            StorageManager.saveSettings(settings);
            this.updateHudLangText(lang);
            this.showToast(`Language set to ${e.target.options[e.target.selectedIndex].text}`);
        });

        // Export Dropdown
        this.exportDropdownBtn.addEventListener('click', () => {
            this.exportMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!this.exportDropdownBtn.contains(e.target) && !this.exportMenu.contains(e.target)) {
                this.exportMenu.classList.add('hidden');
            }
        });

        this.copyListBtn.addEventListener('click', () => {
            this.exportAsText();
            this.exportMenu.classList.add('hidden');
        });

        this.downloadCsvBtn.addEventListener('click', () => {
            this.exportAsCSV();
            this.exportMenu.classList.add('hidden');
        });

        // Debounced Search Input & Reset
        const handleSearchInput = (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.clearSearchBtn.classList.toggle('hidden', !this.searchQuery);
            this.renderShoppingList();
        };
        this.searchInput.addEventListener('input', this.debounce(handleSearchInput, 220));

        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.maxPriceFilter = null;
            this.clearSearchBtn.classList.add('hidden');
            this.activeFilterBanner.classList.add('hidden');
            this.renderShoppingList();
        });

        this.resetFilterBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.maxPriceFilter = null;
            this.clearSearchBtn.classList.add('hidden');
            this.activeFilterBanner.classList.add('hidden');
            this.renderShoppingList();
        });

        // Category Filter Tabs
        this.categoryFilterTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.cat-tab');
            if (!btn) return;
            this.activeCategory = btn.getAttribute('data-category');
            this.updateCategoryTabStyles();
            this.renderShoppingList();
        });

        // Quick Hint Chips
        document.querySelectorAll('.hint-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.textContent.replace(/"/g, '');
                this.processUtterance(text);
            });
        });

        // Recipe Bundle Buttons
        document.querySelectorAll('.recipe-bundle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const recipeKey = btn.getAttribute('data-recipe');
                const items = RECIPE_BUNDLES[recipeKey];
                if (items) {
                    items.forEach(item => this.addItem(item, false));
                    if (this.soundEnabled) SoundFX.playItemAdd();
                    const recipeName = recipeKey.charAt(0).toUpperCase() + recipeKey.slice(1);
                    this.showToast(`Added ${recipeName} recipe ingredients to list!`);
                    this.voiceManager.speak(`Added ingredients for ${recipeName} to your list.`);
                }
            });
        });

        // Clear buttons
        this.clearCompletedBtn.addEventListener('click', () => {
            this.items = this.items.filter(i => !i.completed);
            StorageManager.saveItems(this.items);
            this.render();
            if (this.soundEnabled) SoundFX.playDelete();
            this.showToast('Cleared completed items');
        });

        this.clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all items from your shopping list?')) {
                this.items = [];
                StorageManager.saveItems(this.items);
                this.render();
                if (this.soundEnabled) SoundFX.playDelete();
                this.showToast('Shopping list cleared');
            }
        });

        // Theme Toggle
        this.themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            const settings = StorageManager.getSettings();
            settings.theme = isDark ? 'dark' : 'light';
            StorageManager.saveSettings(settings);
            this.themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            if (window.lucide) lucide.createIcons();
        });

        // Voice-Only HUD Mode
        this.toggleVoiceHudBtn.addEventListener('click', () => {
            this.voiceHudOverlay.classList.remove('hidden');
        });
        this.exitVoiceHudBtn.addEventListener('click', () => {
            this.voiceHudOverlay.classList.add('hidden');
        });

        // Add Item Modal
        this.openAddItemModalBtn.addEventListener('click', () => this.addItemModal.classList.remove('hidden'));
        this.closeAddItemModalBtn.addEventListener('click', () => this.addItemModal.classList.add('hidden'));
        this.cancelAddItemModalBtn.addEventListener('click', () => this.addItemModal.classList.add('hidden'));

        this.manualAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('manualNameInput').value.trim();
            const quantity = parseFloat(document.getElementById('manualQtyInput').value) || 1;
            const unit = document.getElementById('manualUnitSelect').value;
            const category = document.getElementById('manualCategorySelect').value;
            const price = parseFloat(document.getElementById('manualPriceInput').value) || null;
            const brand = document.getElementById('manualBrandInput').value.trim() || null;

            if (name) {
                this.addItem({ name, quantity, unit, category, price, brand });
                this.manualAddForm.reset();
                this.addItemModal.classList.add('hidden');
                if (this.soundEnabled) SoundFX.playItemAdd();
                this.showToast(`Added ${name} to list`);
                this.voiceManager.speak(`Added ${quantity} ${unit} of ${name} to your shopping list.`);
            }
        });

        // Settings Modal
        this.openSettingsBtn.addEventListener('click', () => {
            const settings = StorageManager.getSettings();
            this.voiceFeedbackToggle.checked = settings.voiceFeedback;
            this.soundFxToggle.checked = this.soundEnabled;
            this.voiceSpeedRange.value = settings.voiceSpeed || 1.0;
            this.speedValueText.textContent = `${settings.voiceSpeed || 1.0}x`;
            // no-op: geminiApiKeyInput removed from UI
            this.settingsModal.classList.remove('hidden');
        });

        this.closeSettingsModalBtn.addEventListener('click', () => this.settingsModal.classList.add('hidden'));

        this.voiceSpeedRange.addEventListener('input', (e) => {
            this.speedValueText.textContent = `${e.target.value}x`;
        });

        this.saveSettingsBtn.addEventListener('click', () => {
            const settings = StorageManager.getSettings();
            settings.voiceFeedback = this.voiceFeedbackToggle.checked;
            this.soundEnabled = this.soundFxToggle.checked;
            settings.voiceSpeed = parseFloat(this.voiceSpeedRange.value);
            // geminiApiKey removed; ensure not stored
            StorageManager.saveSettings(settings);
            this.settingsModal.classList.add('hidden');
            this.showToast('Settings saved successfully');
        });

        // Refresh Suggestions
        this.refreshSuggestionsBtn.addEventListener('click', () => {
            this.renderSuggestions();
            this.showToast('Refreshed smart recommendations');
        });

        this.checkoutBtn.addEventListener('click', () => this.openCheckout());
        this.closeCheckoutModalBtn.addEventListener('click', () => this.closeCheckout());
        this.doneCheckoutBtn.addEventListener('click', () => this.closeCheckout());
        this.placeOrderBtn.addEventListener('click', () => this.placeOrder());
    }

    /**
     * Handle incoming raw speech recognition transcript
     */
    async handleSpeechResult(result) {
        if (result.interim) {
            this.transcriptText.textContent = `"${result.interim}"`;
            this.hudTranscriptBox.textContent = `"${result.interim}"`;
        }

        if (result.final) {
            const utterance = result.final;
            this.transcriptText.textContent = `"${utterance}"`;
            this.hudTranscriptBox.textContent = `"${utterance}"`;
            await this.processUtterance(utterance);
        }
    }

    /**
     * Process speech utterance through NLP Parser
     */
    async processUtterance(utteranceText) {
        this.setVoiceStatus('thinking', 'Processing command...');
        
        try {
            const action = await NLPParser.parse(utteranceText);

            if (!action || action.intent === 'UNKNOWN') {
                this.voiceManager.speak("I didn't quite catch that. Try saying add milk or find items under 5 dollars.");
                this.showToast('Command not recognized', 'error');
                return;
            }

            switch (action.intent) {
                case 'ADD_ITEM':
                    if (action.item && action.item.name) {
                        this.addItem(action.item);
                        if (this.soundEnabled) SoundFX.playItemAdd();
                        const msg = `Added ${action.item.quantity} ${action.item.name} to your list.`;
                        this.voiceManager.speak(msg);
                        this.showToast(msg);
                    }
                    break;

                case 'ADD_RECIPE_BUNDLE':
                    if (action.items) {
                        action.items.forEach(i => this.addItem(i, false));
                        if (this.soundEnabled) SoundFX.playItemAdd();
                        const msg = `Added ${action.recipeName} ingredients to your shopping list.`;
                        this.voiceManager.speak(msg);
                        this.showToast(msg);
                    }
                    break;

                case 'REMOVE_ITEM':
                    if (action.item) {
                        const removed = this.removeItemByName(action.item);
                        if (removed) {
                            if (this.soundEnabled) SoundFX.playDelete();
                            const msg = `Removed ${action.item} from your shopping list.`;
                            this.voiceManager.speak(msg);
                            this.showToast(msg);
                        } else {
                            const msg = `Could not find ${action.item} on your list.`;
                            this.voiceManager.speak(msg);
                            this.showToast(msg, 'warning');
                        }
                    }
                    break;

                case 'TOGGLE_ITEM':
                    if (action.item) {
                        const toggled = this.toggleItemByName(action.item);
                        if (toggled) {
                            if (this.soundEnabled) SoundFX.playCheckPop();
                            const msg = `Marked ${action.item} as completed.`;
                            this.voiceManager.speak(msg);
                            this.showToast(msg);
                        }
                    }
                    break;

                case 'SEARCH':
                    this.searchQuery = (action.query || '').toLowerCase();
                    this.maxPriceFilter = action.maxPrice || null;
                    this.searchInput.value = this.searchQuery;
                    this.clearSearchBtn.classList.toggle('hidden', !this.searchQuery);

                    if (this.maxPriceFilter !== null) {
                        this.activeFilterText.textContent = `Filter: "${this.searchQuery || 'Items'}" under ₹${this.maxPriceFilter.toFixed(2)}`;
                        this.activeFilterBanner.classList.remove('hidden');
                        this.voiceManager.speak(`Filtered shopping list for items under ${this.maxPriceFilter} rupees.`);
                    } else {
                        this.voiceManager.speak(`Searching for ${this.searchQuery}`);
                    }
                    this.renderShoppingList();
                    break;

                case 'SUGGESTIONS':
                    this.renderSuggestions();
                    this.voiceManager.speak(`Here are smart recommendations based on your history and seasonal favorites.`);
                    this.showToast('Generated smart recommendations');
                    break;
            }
        } catch (err) {
            console.error('Error executing voice command:', err);
            this.showToast('Error processing voice command', 'error');
        } finally {
            this.setVoiceStatus('idle', 'Tap mic or say command');
        }
    }

    /**
     * Add item to list & update storage
     */
    addItem(itemData, updateRender = true) {
        const existingIndex = this.items.findIndex(i => i.name.toLowerCase() === itemData.name.toLowerCase());

        if (existingIndex !== -1) {
            this.items[existingIndex].quantity += itemData.quantity;
            if (itemData.price) this.items[existingIndex].price = itemData.price;
        } else {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                name: itemData.name,
                quantity: itemData.quantity || 1,
                unit: itemData.unit || 'pcs',
                category: itemData.category || StorageManager.detectCategory(itemData.name),
                price: itemData.price || null,
                brand: itemData.brand || null,
                completed: false,
                createdAt: Date.now()
            };
            this.items.unshift(newItem);
        }

        StorageManager.saveItems(this.items);
        StorageManager.recordPurchase(itemData.name, itemData.category);
        if (updateRender) this.render();
    }

    /**
     * Remove item by name
     */
    removeItemByName(name) {
        const initialLength = this.items.length;
        this.items = this.items.filter(i => !i.name.toLowerCase().includes(name.toLowerCase()));
        if (this.items.length !== initialLength) {
            StorageManager.saveItems(this.items);
            this.render();
            return true;
        }
        return false;
    }

    /**
     * Toggle completion status by item name
     */
    toggleItemByName(name) {
        const item = this.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        if (item) {
            item.completed = !item.completed;
            StorageManager.saveItems(this.items);
            this.render();
            return true;
        }
        return false;
    }

    /**
     * Export Shopping List as Text
     */
    exportAsText() {
        if (this.items.length === 0) {
            this.showToast('Shopping list is empty', 'warning');
            return;
        }
        let text = `🛒 VoiceCart AI - Shopping List (${new Date().toLocaleDateString()})\n\n`;
        this.items.forEach((item, idx) => {
            const check = item.completed ? '[x]' : '[ ]';
            const priceStr = item.price ? ` (₹${item.price.toFixed(2)})` : '';
            text += `${idx + 1}. ${check} ${item.name} - ${item.quantity} ${item.unit} [${item.category}]${priceStr}\n`;
        });
        navigator.clipboard.writeText(text);
        this.showToast('Shopping list copied to clipboard!');
    }

    /**
     * Export Shopping List as CSV
     */
    exportAsCSV() {
        if (this.items.length === 0) {
            this.showToast('Shopping list is empty', 'warning');
            return;
        }
        let csv = 'Status,Name,Quantity,Unit,Category,Price,Brand\n';
        this.items.forEach(i => {
            const status = i.completed ? 'Completed' : 'Pending';
            csv += `"${status}","${i.name}",${i.quantity},"${i.unit}","${i.category}",${i.price || 0},"${i.brand || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Shopping_List_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Downloaded Shopping_List.csv');
    }

    getCartTotal() {
        return this.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    }

    openCheckout() {
        this.checkoutItems.innerHTML = this.items.length > 0 ? this.items.map(item => `
            <div class="flex items-center justify-between gap-3">
                <span class="truncate">${item.quantity} ${item.unit} ${item.name}</span>
                <span class="font-semibold">${item.price ? `₹${(item.price * item.quantity).toFixed(2)}` : 'Price N/A'}</span>
            </div>
        `).join('') : '<p class="text-center text-slate-500 py-4">Your shopping list is empty. Add items before placing an order.</p>';
        this.checkoutTotal.textContent = `₹${this.getCartTotal().toFixed(2)}`;
        this.checkoutFormView.classList.remove('hidden');
        this.checkoutSuccessView.classList.add('hidden');
        this.placeOrderBtn.disabled = this.items.length === 0;
        this.placeOrderBtn.classList.toggle('opacity-50', this.items.length === 0);
        this.placeOrderBtn.classList.toggle('cursor-not-allowed', this.items.length === 0);
        this.checkoutModal.classList.remove('hidden');
    }

    placeOrder() {
        if (this.items.length === 0) {
            this.showToast('Add items before placing the order', 'warning');
            return;
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
        const orderId = `VC-${Date.now().toString().slice(-6)}`;
        const total = this.getCartTotal();

        this.checkoutFormView.classList.add('hidden');
        this.checkoutSuccessView.classList.remove('hidden');
        this.orderConfirmationText.textContent = `Order ${orderId} confirmed via ${paymentMethod}. Total: ₹${total.toFixed(2)}.`;
        this.items = [];
        StorageManager.saveItems(this.items);
        this.render();
        this.showToast('Order placed successfully');
    }

    closeCheckout() {
        this.checkoutModal.classList.add('hidden');
    }

    handleVoiceStateChange({ state, message }) {
        this.setVoiceStatus(state, message);
    }

    setVoiceStatus(state, text) {
        this.voiceStatusText.textContent = text;

        if (state === 'listening') {
            this.micBtn.classList.add('mic-active');
            this.voiceStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';
            this.audioWaveform.classList.remove('hidden');
            this.audioWaveform.classList.add('flex');
            this.micSubtext.textContent = 'LISTENING...';
        } else if (state === 'speaking') {
            this.micBtn.classList.remove('mic-active');
            this.voiceStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
            this.audioWaveform.classList.remove('hidden');
            this.audioWaveform.classList.add('flex');
            this.micSubtext.textContent = 'SPEAKING';
        } else if (state === 'thinking') {
            this.micBtn.classList.remove('mic-active');
            this.voiceStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-spin';
            this.audioWaveform.classList.add('hidden');
            this.audioWaveform.classList.remove('flex');
            this.micSubtext.textContent = 'PARSING...';
        } else {
            this.micBtn.classList.remove('mic-active');
            this.voiceStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse';
            this.audioWaveform.classList.add('hidden');
            this.audioWaveform.classList.remove('flex');
            this.micSubtext.textContent = 'TAP TO SPEAK';
        }
    }

    updateHudLangText(langCode) {
        const langMap = {
            'en-US': 'English (US)',
            'es-ES': 'Español (ES)',
            'fr-FR': 'Français (FR)',
            'de-DE': 'Deutsch (DE)',
            'hi-IN': 'हिन्दी (IN)',
            'zh-CN': '中文 (CN)'
        };
        this.hudLangText.textContent = langMap[langCode] || langCode;
    }

    debounce(fn, wait) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }
    updateCategoryTabStyles() {
        document.querySelectorAll('.cat-tab').forEach(btn => {
            const cat = btn.getAttribute('data-category');
            if (cat === this.activeCategory) {
                btn.className = 'cat-tab bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap shadow-sm';
            } else {
                btn.className = 'cat-tab bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-lg font-medium hover:bg-slate-200 whitespace-nowrap';
            }
        });
    }

    renderShoppingList() {
        let filtered = [...this.items];

        if (this.activeCategory !== 'ALL') {
            filtered = filtered.filter(i => i.category === this.activeCategory);
        }

        if (this.searchQuery) {
            filtered = filtered.filter(i =>
                i.name.toLowerCase().includes(this.searchQuery) ||
                (i.brand && i.brand.toLowerCase().includes(this.searchQuery))
            );
        }

        if (this.maxPriceFilter !== null) {
            filtered = filtered.filter(i => i.price !== null && i.price <= this.maxPriceFilter);
        }

        this.itemCountBadge.textContent = `${filtered.length} items`;
        this.emptyListState.classList.toggle('hidden', filtered.length > 0);

        this.shoppingListContainer.innerHTML = filtered.map(item => this.createItemCardHTML(item)).join('');

        this.shoppingListContainer.querySelectorAll('.item-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const targetItem = this.items.find(i => i.id === id);
                if (targetItem) {
                    targetItem.completed = e.target.checked;
                    if (this.soundEnabled && targetItem.completed) SoundFX.playCheckPop();
                    StorageManager.saveItems(this.items);
                    this.render();
                }
            });
        });

        this.shoppingListContainer.querySelectorAll('.qty-minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const targetItem = this.items.find(i => i.id === id);
                if (targetItem && targetItem.quantity > 1) {
                    targetItem.quantity -= 1;
                    StorageManager.saveItems(this.items);
                    this.render();
                }
            });
        });

        this.shoppingListContainer.querySelectorAll('.qty-plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const targetItem = this.items.find(i => i.id === id);
                if (targetItem) {
                    targetItem.quantity += 1;
                    StorageManager.saveItems(this.items);
                    this.render();
                }
            });
        });

        this.shoppingListContainer.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.items = this.items.filter(i => i.id !== id);
                if (this.soundEnabled) SoundFX.playDelete();
                StorageManager.saveItems(this.items);
                this.render();
                this.showToast('Item deleted');
            });
        });

        // Summary Calculations & Dashboard Update
        const totalItemsCount = this.items.length;
        const completedCount = this.items.filter(i => i.completed).length;
        const pendingCount = totalItemsCount - completedCount;
        const totalEstPrice = this.getCartTotal();
        const completedPercent = totalItemsCount > 0 ? Math.round((completedCount / totalItemsCount) * 100) : 0;

        this.dashTotalItems.textContent = `${totalItemsCount} Items`;
        this.dashCompletedPercent.textContent = `${completedPercent}%`;
        this.dashProgressBar.style.width = `${completedPercent}%`;
        this.dashEstTotal.textContent = `₹${totalEstPrice.toFixed(2)}`;

        this.summaryTotalCount.textContent = totalItemsCount;
        this.summaryPendingCount.textContent = pendingCount;
        this.summaryTotalPrice.textContent = `₹${totalEstPrice.toFixed(2)}`;

        if (window.lucide) lucide.createIcons();
    }

    createItemCardHTML(item) {
        const categoryBadgeClass = this.getBadgeClass(item.category);
        const isDoneClass = item.completed ? 'item-completed' : '';

        return `
            <div class="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 ${isDoneClass} hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs">
                <div class="flex items-center space-x-3.5 min-w-0">
                    <input type="checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''} class="item-checkbox w-5 h-5 text-indigo-600 rounded cursor-pointer accent-indigo-600">
                    <div class="min-w-0">
                        <div class="flex items-center space-x-2">
                            <span class="item-title font-semibold text-sm truncate">${item.name}</span>
                            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryBadgeClass}">${item.category}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                            ${item.brand ? `<span class="font-medium text-slate-500">Brand: ${item.brand}</span><span>•</span>` : ''}
                            <span class="font-medium text-slate-500">Price: ${item.price ? `₹${item.price.toFixed(2)}` : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-200/60 dark:border-slate-700/60">
                        <button data-id="${item.id}" class="qty-minus-btn text-slate-500 hover:text-slate-900 dark:hover:text-white p-0.5">
                            <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                        </button>
                        <span class="text-xs font-bold w-6 text-center">${item.quantity} ${item.unit || ''}</span>
                        <button data-id="${item.id}" class="qty-plus-btn text-slate-500 hover:text-slate-900 dark:hover:text-white p-0.5">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <button data-id="${item.id}" class="delete-item-btn p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderSuggestions() {
        const data = SuggestionsEngine.getAllSuggestions();
        this.seasonBadge.textContent = data.seasonName;

        let cardsHTML = '';

        data.history.forEach(item => {
            cardsHTML += `
                <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-amber-700 dark:text-amber-300">📦 Low Stock Warning</span>
                            <span class="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-[10px] text-amber-900 dark:text-amber-200 font-semibold">${item.category}</span>
                        </div>
                        <p class="font-semibold text-slate-800 dark:text-slate-100">${item.name}</p>
                        <p class="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">${item.reason}</p>
                    </div>
                    <button data-name="${item.name}" data-category="${item.category}" class="add-suggestion-btn w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium flex items-center justify-center space-x-1 shadow-xs">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                        <span>Add to List</span>
                    </button>
                </div>
            `;
        });

        data.seasonal.slice(0, 2).forEach(item => {
            cardsHTML += `
                <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-emerald-700 dark:text-emerald-300">🌿 In Season (${item.season})</span>
                            <span class="px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/60 text-[10px] text-emerald-900 dark:text-emerald-200 font-semibold">₹${item.price.toFixed(2)}</span>
                        </div>
                        <p class="font-semibold text-slate-800 dark:text-slate-100">${item.name}</p>
                        <p class="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">${item.reason}</p>
                    </div>
                    <button data-name="${item.name}" data-category="${item.category}" data-price="${item.price}" class="add-suggestion-btn w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center space-x-1 shadow-xs">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                        <span>Add to List</span>
                    </button>
                </div>
            `;
        });

        data.substitutes.forEach(item => {
            cardsHTML += `
                <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-purple-700 dark:text-purple-300">💡 Healthy Swap</span>
                            <span class="text-[10px] text-purple-500">For ${item.originalItem}</span>
                        </div>
                        <p class="font-semibold text-slate-800 dark:text-slate-100">${item.substitute}</p>
                        <p class="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">${item.reason}</p>
                    </div>
                    <button data-name="${item.substitute}" class="add-suggestion-btn w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center justify-center space-x-1 shadow-xs">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                        <span>Try Substitute</span>
                    </button>
                </div>
            `;
        });

        this.suggestionsContainer.innerHTML = cardsHTML;

        this.suggestionsContainer.querySelectorAll('.add-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.getAttribute('data-name');
                const category = e.currentTarget.getAttribute('data-category');
                const price = parseFloat(e.currentTarget.getAttribute('data-price')) || null;

                this.addItem({ name, quantity: 1, category, price });
                if (this.soundEnabled) SoundFX.playItemAdd();
                this.showToast(`Added ${name} from suggestions`);
                this.voiceManager.speak(`Added ${name} to your list.`);
            });
        });

        if (window.lucide) lucide.createIcons();
    }

    getBadgeClass(category) {
        const map = {
            'Produce': 'badge-produce',
            'Dairy': 'badge-dairy',
            'Bakery': 'badge-bakery',
            'Meat & Seafood': 'badge-meat',
            'Pantry': 'badge-pantry',
            'Beverages': 'badge-beverages',
            'Snacks': 'badge-snacks',
            'Household': 'badge-household',
            'Personal Care': 'badge-personal'
        };
        return map[category] || 'badge-pantry';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bg = type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-600' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900';
        toast.className = `vc-toast pointer-events-auto px-4 py-2.5 rounded-xl shadow-xl ${bg} text-xs font-semibold flex items-center space-x-2`;
        toast.innerHTML = `<span>${message}</span>`;

        this.toastContainer.appendChild(toast);
        // trigger show animation
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    render() {
        this.renderShoppingList();
        this.renderSuggestions();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
