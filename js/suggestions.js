/**
 * Suggestions Engine - Generates smart recommendations based on:
 * 1. Shopping history (frequent/low stock items)
 * 2. Seasonal availability (Spring/Summer/Autumn/Winter)
 * 3. Smart product substitutes (e.g. Almond Milk for Whole Milk)
 */

import { StorageManager } from './storage.js';

// Database of smart substitutes
const SUBSTITUTES_DB = {
    'whole milk': [
        { name: 'Almond Milk', reason: 'Plant-based alternative with lower calories', type: 'Dietary' },
        { name: 'Oat Milk', reason: 'Creamy texture, great for coffee', type: 'Dietary' },
        { name: 'Lactose-Free Milk', reason: 'Easier to digest option', type: 'Health' }
    ],
    'milk': [
        { name: 'Almond Milk', reason: 'Popular plant-based alternative', type: 'Dietary' },
        { name: 'Oat Milk', reason: 'Rich & creamy alternative', type: 'Dietary' }
    ],
    'white bread': [
        { name: 'Whole Wheat Bread', reason: 'Higher fiber and nutritional value', type: 'Health' },
        { name: 'Sourdough Bread', reason: 'Easier on digestion and natural gut health', type: 'Health' }
    ],
    'bread': [
        { name: 'Whole Grain Bread', reason: 'More fiber & essential nutrients', type: 'Health' }
    ],
    'sugar': [
        { name: 'Honey', reason: 'Natural sweetener with antioxidants', type: 'Health' },
        { name: 'Stevia', reason: 'Zero calorie natural sweetener', type: 'Dietary' }
    ],
    'soda': [
        { name: 'Sparkling Water with Lemon', reason: 'Zero sugar refreshing drink', type: 'Health' },
        { name: 'Kombucha', reason: 'Probiotic-rich gut health drink', type: 'Health' }
    ],
    'potato chips': [
        { name: 'Baked Kale Chips', reason: 'Lower calorie crunchy snack', type: 'Health' },
        { name: 'Air-popped Popcorn', reason: 'Whole grain low-fat snack', type: 'Dietary' }
    ],
    'butter': [
        { name: 'Olive Oil', reason: 'Heart-healthy unsaturated fats', type: 'Health' },
        { name: 'Avocado Oil', reason: 'High smoke point & healthy fats', type: 'Health' }
    ]
};

// Seasonal Database
const SEASONAL_ITEMS = {
    Spring: [
        { name: 'Fresh Strawberries', category: 'Produce', price: 3.49, reason: 'Peak Spring harvest & on sale' },
        { name: 'Organic Asparagus', category: 'Produce', price: 2.99, reason: 'Fresh Spring crop' },
        { name: 'Green Peas', category: 'Produce', price: 1.99, reason: 'In season now' }
    ],
    Summer: [
        { name: 'Fresh Watermelon', category: 'Produce', price: 4.99, reason: 'Summer favorite & hydrating' },
        { name: 'Sweet Corn', category: 'Produce', price: 0.50, reason: 'Fresh local Summer harvest' },
        { name: 'Peaches', category: 'Produce', price: 2.49, reason: 'Juicy summer pick' },
        { name: 'Ice Cream', category: 'Snacks', price: 3.99, reason: 'Summer beat-the-heat deal' }
    ],
    Autumn: [
        { name: 'Honeycrisp Apples', category: 'Produce', price: 2.99, reason: 'Autumn orchard fresh' },
        { name: 'Pumpkin Spice Latte Mix', category: 'Beverages', price: 4.99, reason: 'Fall seasonal favorite' },
        { name: 'Butternut Squash', category: 'Produce', price: 1.89, reason: 'Fresh Fall harvest' }
    ],
    Winter: [
        { name: 'Navel Oranges', category: 'Produce', price: 3.29, reason: 'Winter Vitamin C boost' },
        { name: 'Hot Cocoa Mix', category: 'Beverages', price: 2.79, reason: 'Warm winter treat' },
        { name: 'Clementines', category: 'Produce', price: 4.49, reason: 'Peak winter citrus season' }
    ]
};

export class SuggestionsEngine {
    /**
     * Determine current season
     */
    static getCurrentSeason() {
        const month = new Date().getMonth(); // 0-11
        if (month >= 2 && month <= 4) return 'Spring';
        if (month >= 5 && month <= 7) return 'Summer';
        if (month >= 8 && month <= 10) return 'Autumn';
        return 'Winter';
    }

    /**
     * Get low stock / frequent item recommendations based on user history
     */
    static getHistoryRecommendations() {
        const history = StorageManager.getHistory();
        const currentItems = StorageManager.getItems().map(i => i.name.toLowerCase());
        const recommendations = [];
        const now = Date.now();

        for (const item of history) {
            // If item is not currently in shopping list
            if (!currentItems.includes(item.name.toLowerCase())) {
                const daysSinceBought = (now - item.lastBought) / (1000 * 60 * 60 * 24);
                // If frequent item (>2 times) and bought more than 5 days ago
                if (item.count >= 2 && daysSinceBought > 5) {
                    recommendations.push({
                        name: item.name,
                        category: item.category,
                        reason: `You usually buy this every week. Running low? (${Math.round(daysSinceBought)} days ago)`,
                        type: 'Low Stock'
                    });
                }
            }
        }
        return recommendations;
    }

    /**
     * Get seasonal recommendations
     */
    static getSeasonalRecommendations() {
        const season = this.getCurrentSeason();
        const currentItems = StorageManager.getItems().map(i => i.name.toLowerCase());
        const list = SEASONAL_ITEMS[season] || SEASONAL_ITEMS.Summer;
        
        return list.filter(item => !currentItems.includes(item.name.toLowerCase())).map(item => ({
            ...item,
            season: season,
            type: 'Seasonal'
        }));
    }

    /**
     * Find smart substitute options for a given product or item list
     */
    static getSubstitutesForItem(itemName) {
        const lower = itemName.toLowerCase().trim();
        for (const [key, list] of Object.entries(SUBSTITUTES_DB)) {
            if (lower.includes(key)) {
                return list;
            }
        }
        return [];
    }

    /**
     * Generate all active smart suggestions combined
     */
    static getAllSuggestions() {
        const historyRecs = this.getHistoryRecommendations();
        const seasonalRecs = this.getSeasonalRecommendations();
        
        // Find substitutes for current items in the list
        const currentItems = StorageManager.getItems();
        const substituteRecs = [];

        for (const item of currentItems) {
            const subs = this.getSubstitutesForItem(item.name);
            if (subs.length > 0) {
                substituteRecs.push({
                    originalItem: item.name,
                    substitute: subs[0].name,
                    reason: subs[0].reason,
                    type: 'Substitute'
                });
            }
        }

        return {
            history: historyRecs,
            seasonal: seasonalRecs,
            substitutes: substituteRecs,
            seasonName: this.getCurrentSeason()
        };
    }
}
