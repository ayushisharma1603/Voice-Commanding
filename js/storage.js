/**
 * Storage Manager - Handles persistence using LocalStorage
 * Stores shopping list items, purchase history, preferences, and default seed data.
 */

const STORAGE_KEYS = {
    ITEMS: 'vcs_shopping_list_items',
    HISTORY: 'vcs_purchase_history',
    SETTINGS: 'vcs_user_settings'
};

// Initial seed categories and product database
export const CATEGORY_MAP = {
    // Produce
    'apple': 'Produce', 'apples': 'Produce', 'banana': 'Produce', 'bananas': 'Produce',
    'orange': 'Produce', 'oranges': 'Produce', 'berry': 'Produce', 'berries': 'Produce',
    'strawberry': 'Produce', 'strawberries': 'Produce', 'lemon': 'Produce', 'lemons': 'Produce',
    'tomato': 'Produce', 'tomatoes': 'Produce', 'potato': 'Produce', 'potatoes': 'Produce',
    'onion': 'Produce', 'onions': 'Produce', 'garlic': 'Produce', 'lettuce': 'Produce',
    'spinach': 'Produce', 'carrot': 'Produce', 'carrots': 'Produce', 'avocado': 'Produce',
    'avocados': 'Produce', 'cucumber': 'Produce', 'cucumbers': 'Produce', 'mango': 'Produce',
    'watermelon': 'Produce', 'grape': 'Produce', 'grapes': 'Produce',

    // Dairy & Alternatives
    'milk': 'Dairy', 'cheese': 'Dairy', 'butter': 'Dairy', 'yogurt': 'Dairy',
    'cream': 'Dairy', 'almond milk': 'Dairy', 'oat milk': 'Dairy', 'soy milk': 'Dairy',
    'cottage cheese': 'Dairy', 'curd': 'Dairy', 'ghee': 'Dairy',

    // Bakery
    'bread': 'Bakery', 'bagel': 'Bakery', 'bagels': 'Bakery', 'croissant': 'Bakery',
    'muffin': 'Bakery', 'muffins': 'Bakery', 'bun': 'Bakery', 'buns': 'Bakery',
    'tortilla': 'Bakery', 'tortillas': 'Bakery', 'pita': 'Bakery',

    // Meat & Seafood
    'chicken': 'Meat & Seafood', 'beef': 'Meat & Seafood', 'pork': 'Meat & Seafood',
    'fish': 'Meat & Seafood', 'salmon': 'Meat & Seafood', 'shrimp': 'Meat & Seafood',
    'turkey': 'Meat & Seafood', 'bacon': 'Meat & Seafood', 'steak': 'Meat & Seafood',
    'eggs': 'Meat & Seafood', 'egg': 'Meat & Seafood',

    // Pantry & Grains
    'rice': 'Pantry', 'pasta': 'Pantry', 'flour': 'Pantry', 'sugar': 'Pantry',
    'salt': 'Pantry', 'pepper': 'Pantry', 'oil': 'Pantry', 'olive oil': 'Pantry',
    'cereal': 'Pantry', 'oats': 'Pantry', 'oatmeal': 'Pantry', 'beans': 'Pantry',
    'soup': 'Pantry', 'sauce': 'Pantry', 'ketchup': 'Pantry', 'mustard': 'Pantry',
    'honey': 'Pantry', 'peanut butter': 'Pantry', 'jam': 'Pantry',

    // Beverages
    'water': 'Beverages', 'juice': 'Beverages', 'coffee': 'Beverages', 'tea': 'Beverages',
    'soda': 'Beverages', 'coke': 'Beverages', 'wine': 'Beverages', 'beer': 'Beverages',
    'sparkling water': 'Beverages', 'lemonade': 'Beverages',

    // Snacks & Sweets
    'chips': 'Snacks', 'chocolate': 'Snacks', 'cookies': 'Snacks', 'nuts': 'Snacks',
    'almonds': 'Snacks', 'popcorn': 'Snacks', 'candy': 'Snacks', 'crackers': 'Snacks',
    'pretzels': 'Snacks',

    // Household & Personal Care
    'toothpaste': 'Personal Care', 'soap': 'Personal Care', 'shampoo': 'Personal Care',
    'paper towel': 'Household', 'paper towels': 'Household', 'toilet paper': 'Household',
    'detergent': 'Household', 'dish soap': 'Household', 'sponge': 'Household',
    'trash bags': 'Household', 'tissues': 'Household'
};

const DEFAULT_ITEMS = [
    { id: '1', name: 'Organic Milk', quantity: 1, unit: 'gallon', category: 'Dairy', price: 4.49, brand: 'Horizon', completed: false, createdAt: Date.now() - 3600000 },
    { id: '2', name: 'Fresh Apples', quantity: 6, unit: 'pcs', category: 'Produce', price: 3.99, brand: 'Honeycrisp', completed: false, createdAt: Date.now() - 7200000 },
    { id: '3', name: 'Whole Wheat Bread', quantity: 1, unit: 'loaf', category: 'Bakery', price: 2.99, brand: 'Dave\'s Killer', completed: true, createdAt: Date.now() - 10800000 },
    { id: '4', name: 'Colgate Toothpaste', quantity: 2, unit: 'tubes', category: 'Personal Care', price: 4.29, brand: 'Colgate', completed: false, createdAt: Date.now() - 14400000 }
];

const DEFAULT_HISTORY = [
    { name: 'Organic Milk', category: 'Dairy', count: 5, lastBought: Date.now() - 864000000 }, // 10 days ago
    { name: 'Whole Wheat Bread', category: 'Bakery', count: 4, lastBought: Date.now() - 604800000 }, // 7 days ago
    { name: 'Fresh Apples', category: 'Produce', count: 3, lastBought: Date.now() - 432000000 }, // 5 days ago
    { name: 'Eggs', category: 'Meat & Seafood', count: 6, lastBought: Date.now() - 1209600000 }, // 14 days ago (Low stock warning!)
    { name: 'Bananas', category: 'Produce', count: 4, lastBought: Date.now() - 950400000 }
];

export class StorageManager {
    static getItems() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
            if (!data) {
                this.saveItems(DEFAULT_ITEMS);
                return DEFAULT_ITEMS;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error('Error loading items from localStorage:', e);
            return DEFAULT_ITEMS;
        }
    }

    static saveItems(items) {
        try {
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving items to localStorage:', e);
        }
    }

    static getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            if (!data) {
                this.saveHistory(DEFAULT_HISTORY);
                return DEFAULT_HISTORY;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error('Error loading history:', e);
            return DEFAULT_HISTORY;
        }
    }

    static saveHistory(history) {
        try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }

    static recordPurchase(itemName, category) {
        const history = this.getHistory();
        const existing = history.find(h => h.name.toLowerCase() === itemName.toLowerCase());
        if (existing) {
            existing.count += 1;
            existing.lastBought = Date.now();
        } else {
            history.push({
                name: itemName,
                category: category || this.detectCategory(itemName),
                count: 1,
                lastBought: Date.now()
            });
        }
        this.saveHistory(history);
    }

    static getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : { language: 'en-US', voiceFeedback: true, voiceSpeed: 1, theme: 'light', geminiApiKey: '' };
        } catch (e) {
            return { language: 'en-US', voiceFeedback: true, voiceSpeed: 1, theme: 'light', geminiApiKey: '' };
        }
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    static detectCategory(itemName) {
        const lower = itemName.toLowerCase();
        for (const [key, category] of Object.entries(CATEGORY_MAP)) {
            if (lower.includes(key)) {
                return category;
            }
        }
        return 'Pantry'; // Default fallback
    }
}
