/**
 * IndexedDB wrapper for Shopping Stats
 * Provides a simple API for storing shopping list data
 */

class ShoppingDB {
    constructor() {
        this.dbName = 'ShoppingStatsDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for shopping items
                if (!db.objectStoreNames.contains('items')) {
                    const itemStore = db.createObjectStore('items', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    itemStore.createIndex('name', 'name', { unique: false });
                    itemStore.createIndex('completed', 'completed', { unique: false });
                    itemStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    /**
     * Add a new item to the shopping list
     * @param {string} name - Item name
     * @param {number} quantity - Item quantity
     * @returns {Promise<number>} Item ID
     */
    async addItem(name, quantity = 1) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            
            const item = {
                name: name.trim(),
                quantity: parseInt(quantity),
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };

            const request = store.add(item);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Failed to add item'));
            };
        });
    }

    /**
     * Get all items from the shopping list
     * @returns {Promise<Array>}
     */
    async getAllItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Failed to get items'));
            };
        });
    }

    /**
     * Get a single item by ID
     * @param {number} id - Item ID
     * @returns {Promise<Object>}
     */
    async getItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('Failed to get item'));
            };
        });
    }

    /**
     * Update an item
     * @param {number} id - Item ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateItem(id, updates) {
        const item = await this.getItem(id);
        if (!item) {
            throw new Error('Item not found');
        }

        const updatedItem = { ...item, ...updates, id };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.put(updatedItem);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Failed to update item'));
            };
        });
    }

    /**
     * Toggle item completion status
     * @param {number} id - Item ID
     * @returns {Promise<void>}
     */
    async toggleItemCompleted(id) {
        const item = await this.getItem(id);
        if (!item) {
            throw new Error('Item not found');
        }

        const updates = {
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : null
        };

        return this.updateItem(id, updates);
    }

    /**
     * Delete an item
     * @param {number} id - Item ID
     * @returns {Promise<void>}
     */
    async deleteItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Failed to delete item'));
            };
        });
    }

    /**
     * Clear all items
     * @returns {Promise<void>}
     */
    async clearAllItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('Failed to clear items'));
            };
        });
    }

    /**
     * Get statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        const items = await this.getAllItems();
        const completed = items.filter(item => item.completed).length;
        const pending = items.filter(item => !item.completed).length;

        return {
            total: items.length,
            completed,
            pending
        };
    }
}
