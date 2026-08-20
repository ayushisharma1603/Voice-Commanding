/**
 * NLP Engine - Natural Language Processing & Intent Parser
 * Supports:
 * - Smart client-side regex & fuzzy keyword pattern extraction
 * - Entity extraction: Item Name, Quantity, Unit, Category, Price Limit, Brand
 * - Recipe Bundle shortcuts (Pancakes, Guacamole, Salad, Tacos)
 * - Optional Google Gemini API integration for advanced context understanding
 * - Multilingual keyword translation map (EN, ES, FR, DE, HI, ZH)
 */

import { StorageManager } from './storage.js';

// Pre-configured recipe bundle ingredient packages
export const RECIPE_BUNDLES = {
    'pancake': [
        { name: 'All-Purpose Flour', quantity: 1, unit: 'bag', category: 'Pantry', price: 2.99 },
        { name: 'Organic Eggs', quantity: 12, unit: 'pcs', category: 'Meat & Seafood', price: 3.99 },
        { name: 'Whole Milk', quantity: 1, unit: 'gallon', category: 'Dairy', price: 4.29 },
        { name: 'Unsalted Butter', quantity: 1, unit: 'pack', category: 'Dairy', price: 3.49 },
        { name: 'Maple Syrup', quantity: 1, unit: 'bottle', category: 'Pantry', price: 5.99 }
    ],
    'guacamole': [
        { name: 'Ripe Avocados', quantity: 4, unit: 'pcs', category: 'Produce', price: 4.99 },
        { name: 'Fresh Limes', quantity: 3, unit: 'pcs', category: 'Produce', price: 1.49 },
        { name: 'Red Onion', quantity: 1, unit: 'pcs', category: 'Produce', price: 0.99 },
        { name: 'Fresh Cilantro', quantity: 1, unit: 'bunch', category: 'Produce', price: 1.29 },
        { name: 'Tortilla Chips', quantity: 1, unit: 'bag', category: 'Snacks', price: 3.29 }
    ],
    'salad': [
        { name: 'Romaine Lettuce', quantity: 1, unit: 'head', category: 'Produce', price: 2.49 },
        { name: 'Cherry Tomatoes', quantity: 1, unit: 'pack', category: 'Produce', price: 2.99 },
        { name: 'Cucumber', quantity: 2, unit: 'pcs', category: 'Produce', price: 1.49 },
        { name: 'Extra Virgin Olive Oil', quantity: 1, unit: 'bottle', category: 'Pantry', price: 7.99 }
    ],
    'taco': [
        { name: 'Ground Beef', quantity: 1, unit: 'lbs', category: 'Meat & Seafood', price: 5.99 },
        { name: 'Taco Shells', quantity: 1, unit: 'box', category: 'Pantry', price: 2.79 },
        { name: 'Shredded Cheese', quantity: 1, unit: 'pack', category: 'Dairy', price: 3.29 },
        { name: 'Salsa', quantity: 1, unit: 'jar', category: 'Pantry', price: 2.99 },
        { name: 'Sour Cream', quantity: 1, unit: 'tub', category: 'Dairy', price: 1.99 }
    ]
};

// Multilingual keyword dictionary for core verbs
const MULTILINGUAL_SYNONYMS = {
    add: ['add', 'need', 'buy', 'want', 'get', 'put', 'include', 'añadir', 'agregar', 'comprar', 'necesito', 'ajouter', 'acheter', 'hinzufügen', 'kaufen', 'jodo', 'chahiye', 'láo'],
    remove: ['remove', 'delete', 'take off', 'clear', 'drop', 'quitar', 'eliminar', 'borrar', 'supprimer', 'enlever', 'entfernen', 'löschen', 'hatao', 'ninkalo'],
    search: ['find', 'search', 'look for', 'show', 'where is', 'buscar', 'chercher', 'suchen', 'khojo', 'dhoondho'],
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

        // 0. Recipe Bundle Detection (e.g., "Add pancake ingredients", "Guacamole recipe")
        for (const [recipeKey, items] of Object.entries(RECIPE_BUNDLES)) {
            if (text.includes(recipeKey) && (text.includes('ingredient') || text.includes('recipe') || text.includes('bundle') || text.includes('kit') || text.includes('make') || text.includes('add'))) {
                return {
                    intent: 'ADD_RECIPE_BUNDLE',
                    recipeName: recipeKey.charAt(0).toUpperCase() + recipeKey.slice(1),
                    items: items,
                    originalText: text
                };
            }
        }

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
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.search) || text.includes('under $') || text.includes('under ') || text.includes('below ')) {
            const priceMatch = text.match(/(?:under|below|less than|\$)\s*(\d+(?:\.\d+)?)\s*(?:dollars|\$)?/i);
            const priceCap = priceMatch ? parseFloat(priceMatch[1]) : null;

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
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.suggest) || text.includes('running low') || text.includes('what to buy')) {
            return {
                intent: 'SUGGESTIONS',
                originalText: text
            };
        }

        // 3. Remove Intent
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.remove)) {
            const itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.remove);
            return {
                intent: 'REMOVE_ITEM',
                item: itemName,
                originalText: text
            };
        }

        // 4. Check / Complete Intent
        if (this.hasKeyword(text, MULTILINGUAL_SYNONYMS.check)) {
            const itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.check);
            return {
                intent: 'TOGGLE_ITEM',
                item: itemName,
                originalText: text
            };
        }

        // 5. Add / Modify Item Intent
        const quantity = this.extractQuantity(text);
        const unit = this.extractUnit(text);
        const price = this.extractPrice(text);
        const brand = this.extractBrand(text);
        let itemName = this.extractItemName(text, MULTILINGUAL_SYNONYMS.add);

        if (!itemName || itemName.length < 2) {
            itemName = text.replace(/^(?:add|buy|need|want|get|put)\s+/i, '').trim();
        }

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

    static hasKeyword(text, keywordList) {
        return keywordList.some(kw => text.includes(kw));
    }

    static extractQuantity(text) {
        const numberWords = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };
        const match = text.match(/\b(\d+(?:\.\d+)?)\b/);
        if (match) return parseFloat(match[1]);

        for (const [word, num] of Object.entries(numberWords)) {
            if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
                return num;
            }
        }
        return 1;
    }

    static extractUnit(text) {
        const units = ['bottle', 'bottles', 'gallon', 'gallons', 'pack', 'packs', 'box', 'boxes', 'loaf', 'loaves', 'kg', 'lbs', 'lb', 'liter', 'liters', 'bag', 'bags', 'tube', 'tubes', 'can', 'cans', 'carton', 'cartons', 'bunch', 'head', 'tub'];
        for (const u of units) {
            if (new RegExp(`\\b${u}\\b`, 'i').test(text)) {
                return u;
            }
        }
        return 'pcs';
    }

    static extractPrice(text) {
        const match = text.match(/(?:\$|for|at)\s*(\d+(?:\.\d+)?)\s*(?:dollars|\$)?/i);
        return match ? parseFloat(match[1]) : null;
    }

    static extractBrand(text) {
        const brands = ['organic', 'horizon', 'dave\'s', 'colgate', 'nestle', 'heinz', 'kellogg\'s', 'tropicana', 'chobani', 'fairlife', 'silk'];
        for (const b of brands) {
            if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
                return this.capitalizeWords(b);
            }
        }
        return null;
    }

    static extractItemName(text, verbList) {
        let cleaned = text;

        verbList.forEach(verb => {
            cleaned = cleaned.replace(new RegExp(`\\b${verb}\\b`, 'gi'), '');
        });

        cleaned = cleaned
            .replace(/\b(?:i|my|the|a|an|some|to|on|list|from|please|for|me|shopping|under|dollars|\$|\d+(?:\.\d+)?|pcs|bottles?|gallons?|packs?|boxes?|loaf|loaves|kg|lbs|liters?|bags?|tubes?|cans?|cartons?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    static capitalizeWords(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }

    static async parseWithGemini(text, apiKey) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `You are a voice command shopping list assistant NLP parser.
Analyze utterance: "${text}".
Return ONLY valid JSON matching this schema:
{
  "intent": "ADD_ITEM" | "REMOVE_ITEM" | "SEARCH" | "SUGGESTIONS" | "TOGGLE_ITEM",
  "item": {
     "name": "Product Name",
     "quantity": 1,
     "unit": "pcs",
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
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        }
        return null;
    }
}
