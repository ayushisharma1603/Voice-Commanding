/**
 * NLP Engine - Natural Language Processing & Intent Parser
 * Supports:
 * - Smart client-side regex & fuzzy keyword pattern extraction
 * - Entity extraction: Item Name, Quantity, Unit, Category, Price Limit, Brand
 * - Optional Google Gemini API integration for advanced context understanding
 * - Multilingual keyword translation map (EN, ES, FR, DE, HI)
 */

import { StorageManager, CATEGORY_MAP } from './storage.js';

// Multilingual keyword dictionary for core verbs
const MULTILINGUAL_SYNONYMS = {
    add: ['add', 'need', 'buy', 'want', 'get', 'put', 'include', 'añadir', 'agregar', 'comprar', 'necesito', 'ajouter', 'acheter', 'hinzufügen', 'kaufen', 'jodo', 'chahiye', 'láo'],
    remove: ['remove', 'delete', 'take off', 'clear', 'drop', 'quitar', 'eliminar', 'borrar', 'supprimer', 'enlever', 'entfernen', 'löschen', 'hatao', 'ninkalo'],
    search: ['find', 'search', 'look for', 'show', 'where is', 'buscar', 'buscar', 'chercher', 'suchen', 'khojo', 'dhoondho'],
    suggest: ['suggest', 'recommend', 'what should i buy', 'suggestions', 'sugerir', 'sugerencias', 'suggérer', 'empfehlen', 'sujhav'],
    check: ['check', 'mark', 'done', 'complete', 'marcar', 'cocher', 'abhaken', 'karo']
};

export class NLPParser {
    /**
     * Parse raw voice text transcript into a structured action object
     */
    static async parse(transcript) {
        if (!transcript || typeof transcript !== 'string') {
            return { intent: 'UNKNOWN', originalText: transcript };
        }

        const text = transcript.trim().toLowerCase();

        // Check if Gemini API Key is configured in settings
        const settings = StorageManager.getSettings();
        if (settings.geminiApiKey && settings.geminiApiKey.trim() !== '') {
            try {
                const geminiResult = await this.parseWithGemini(text, settings.geminiApiKey);
                if (geminiResult && geminiResult.intent !== 'UNKNOWN') {
                    return geminiResult;
                }
            } catch (err) {
                console.warn('Gemini API parse failed, falling back to local NLP:', err);
            }
        }

        // Fallback to local high-performance regex & keyword parser
        return this.parseLocal(text);
    }

    /**
     * Local rule-based & Regex NLP parser
     */
    static parseLocal(text) {
        // 1. Search / Price Filter Intent
        // Examples: "find toothpaste under $5", "search for organic apples under 10 dollars", "find snacks"
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.search) || text.includes('under $') || text.includes('under ') || text.includes('below ')) {
            const priceMatch = text.match(/(?:under|below|less than|\$)\s*(\d+(?:\.\d+)?)\s*(?:dollars|\$)?/i);
            const priceCap = priceMatch ? parseFloat(priceMatch[1]) : null;

            // Clean query text
            let query = text
                .replace(/(?:find|search|look for|show me|under|below|less than|\$|\d+(?:\.\d+)?|dollars)/gi, '')
                .replace(/\s+/g, ' ')
                .trim();

            return {
                intent: 'SEARCH',
                query: query || '',
                maxPrice: priceCap,
                originalText: text
            };
        }

        // 2. Suggestions Intent
        // Examples: "what should I buy?", "give me suggestions", "recommend items"
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.suggest) || text.includes('running low') || text.includes('what to buy')) {
            return {
                intent: 'SUGGESTIONS',
                originalText: text
            };
        }

        // 3. Remove Intent
        // Examples: "remove milk from my list", "delete 2 apples", "take off bread"
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.remove)) {
            const itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.remove);
            return {
                intent: 'REMOVE_ITEM',
                item: itemName,
                originalText: text
            };
        }

        // 4. Check / Complete Intent
        // Examples: "check off milk", "mark apples done"
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.check)) {
            const itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.check);
            return {
                intent: 'TOGGLE_ITEM',
                item: itemName,
                originalText: text
            };
        }

        // 5. Add / Modify Item Intent (Default action if text contains product words or add verbs)
        // Examples: "Add 2 bottles of water for $3", "I need 5 oranges", "Buy organic milk"
        const quantity = this.extractQuantity(text);
        const unit = this.extractUnit(text);
        const price = this.extractPrice(text);
        const brand = this.extractBrand(text);
        let itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.add);

        // If item name is empty after removing action words, fallback to the text itself
        if (!itemName || itemName.length < 2) {
            itemName = text.replace(/^(?:add|buy|need|want|get|put)\s+/i, '').trim();
        }

        // Capitalize product name neatly
        itemName = this.capitalizeWords(itemName);
        const category = StorageManager.detectCategory(itemName);

        return {
            intent: 'ADD_ITEM',
            item: {
                name: itemName,
                quantity: quantity || 1,
                unit: unit || 'pcs',
                category: category,
                price: price || null,
                brand: brand || null
            },
            originalText: text
        };
    }

    /**
     * Helper to check if text contains any keywords from a given list
     */
    static hasKeyword(text, keywordList) {
        return keywordList.some(kw => text.includes(kw));
    }

    /**
     * Extract quantity numbers (e.g., "2 bottles", "five oranges", "1.5 kg")
     */
    static extractQuantity(text) {
        const numberWords = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };
        
        // Check numeric digits
        const match = text.match(/\b(\d+(?:\.\d+)?)\b/);
        if (match) return parseFloat(match[1]);

        // Check word numbers
        for (const [word, num] of Object.entries(numberWords)) {
            if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
                return num;
            }
        }
        return 1;
    }

    /**
     * Extract measurement units (e.g. bottles, lbs, kg, gallon, pack, box, loaf, tubes)
     */
    static extractUnit(text) {
        const units = ['bottle', 'bottles', 'gallon', 'gallons', 'pack', 'packs', 'box', 'boxes', 'loaf', 'loaves', 'kg', 'lbs', 'lb', 'liter', 'liters', 'bag', 'bags', 'tube', 'tubes', 'can', 'cans', 'carton', 'cartons'];
        for (const u of units) {
            if (new RegExp(`\\b${u}\\b`, 'i').test(text)) {
                return u;
            }
        }
        return 'pcs';
    }

    /**
     * Extract price values (e.g. "$4.99", "for 5 dollars", "at $3")
     */
    static extractPrice(text) {
        const match = text.match(/(?:\$|for|at)\s*(\d+(?:\.\d+)?)\s*(?:dollars|\$)?/i);
        return match ? parseFloat(match[1]) : null;
    }

    /**
     * Extract brand hints (e.g., organic, colgate, horizon, daves)
     */
    static extractBrand(text) {
        const brands = ['organic', 'horizon', 'dave\'s', 'colgate', 'nestle', 'heinz', 'kellogg\'s', 'tropicana', 'chobani', 'fairlife'];
        for (const b of brands) {
            if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
                return this.capitalizeWords(b);
            }
        }
        return null;
    }

    /**
     * Clean and extract product name from utterance
     */
    static extractItemName(text, verbList) {
        let cleaned = text;

        // Remove verb synonyms
        verbList.forEach(verb => {
            cleaned = cleaned.replace(new RegExp(`\\b${verb}\\b`, 'gi'), '');
        });

        // Remove filler words & phrases
        cleaned = cleaned
            .replace(/\b(?:i|my|the|a|an|some|to|on|list|from|please|for|me|shopping|under|dollars|\$|\d+(?:\.\d+)?|pcs|bottles?|gallons?|packs?|boxes?|loaf|loaves|kg|lbs|liters?|bags?|tubes?|cans?|cartons?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    /**
     * Capitalize product names
     */
    static capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    /**
     * Call Google Gemini API for intelligent structured NLP intent extraction
     */
    static async parseWithGemini(text, apiKey) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `You are a voice command shopping list assistant NLP parser.
Analyze the user utterance: "${text}".
Return ONLY a valid JSON object matching this schema:
{
  "intent": "ADD_ITEM" | "REMOVE_ITEM" | "SEARCH" | "SUGGESTIONS" | "TOGGLE_ITEM",
  "item": {
     "name": "Product Name",
     "quantity": 1,
     "unit": "pcs/bottle/gallon/etc",
     "category": "Produce/Dairy/Bakery/Pantry/Beverages/Snacks/Personal Care/Household/Meat & Seafood",
     "price": 0.00 or null,
     "brand": "Brand Name" or null
  },
  "query": "search query string or null",
  "maxPrice": 0.00 or null
}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        return null;
    }
}
