/**
 * Main application logic for Shopping Stats
 */

class ShoppingApp {
    constructor() {
        this.db = new ShoppingDB();
        this.elements = {};
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize database
            await this.db.init();
            console.log('Database initialized');

            // Cache DOM elements
            this.cacheElements();

            // Set up event listeners
            this.setupEventListeners();

            // Load and render items
            await this.renderItems();

            // Update statistics
            await this.updateStats();

            // Setup online/offline detection
            this.setupOnlineDetection();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            addBtn: document.getElementById('add-item-btn'),
            itemName: document.getElementById('item-name'),
            itemQuantity: document.getElementById('item-quantity'),
            shoppingList: document.getElementById('shopping-list'),
            emptyState: document.getElementById('empty-state'),
            totalItems: document.getElementById('total-items'),
            completedItems: document.getElementById('completed-items'),
            pendingItems: document.getElementById('pending-items'),
            onlineStatus: document.getElementById('online-status')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add button click
        this.elements.addBtn.addEventListener('click', () => {
            this.handleAddItem();
        });

        // Enter key in item name field
        this.elements.itemName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddItem();
            }
        });

        // Enter key in quantity field
        this.elements.itemQuantity.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddItem();
            }
        });

        // Event delegation for shopping list items
        this.elements.shoppingList.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const itemElement = e.target.closest('.shopping-item');
                if (itemElement && itemElement.dataset.itemId) {
                    const itemId = parseInt(itemElement.dataset.itemId);
                    this.handleToggleItem(itemId);
                }
            }
        });

        this.elements.shoppingList.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const itemElement = e.target.closest('.shopping-item');
                if (itemElement && itemElement.dataset.itemId) {
                    const itemId = parseInt(itemElement.dataset.itemId);
                    this.handleDeleteItem(itemId);
                }
            }
        });
    }

    /**
     * Handle adding a new item
     */
    async handleAddItem() {
        const name = this.elements.itemName.value.trim();
        const quantity = parseInt(this.elements.itemQuantity.value) || 1;

        if (!name) {
            alert('Please enter an item name');
            return;
        }

        if (quantity < 1) {
            alert('Quantity must be at least 1');
            return;
        }

        try {
            await this.db.addItem(name, quantity);
            
            // Clear form
            this.elements.itemName.value = '';
            this.elements.itemQuantity.value = '1';
            this.elements.itemName.focus();

            // Re-render list
            await this.renderItems();
            await this.updateStats();

        } catch (error) {
            console.error('Failed to add item:', error);
            this.showError('Failed to add item');
        }
    }

    /**
     * Render all items
     */
    async renderItems() {
        try {
            const items = await this.db.getAllItems();
            
            // Show/hide empty state
            if (items.length === 0) {
                this.elements.emptyState.style.display = 'block';
                this.elements.shoppingList.innerHTML = '';
                return;
            }

            this.elements.emptyState.style.display = 'none';

            // Sort items: pending first, then completed
            items.sort((a, b) => {
                if (a.completed === b.completed) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return a.completed ? 1 : -1;
            });

            // Render items
            this.elements.shoppingList.innerHTML = items.map(item => 
                this.createItemElement(item)
            ).join('');

        } catch (error) {
            console.error('Failed to render items:', error);
            this.showError('Failed to load items');
        }
    }

    /**
     * Create HTML for a single item
     */
    createItemElement(item) {
        const itemName = this.escapeHtml(item.name);
        return `
            <li class="shopping-item" data-item-id="${item.id}">
                <input 
                    type="checkbox" 
                    ${item.completed ? 'checked' : ''}
                    aria-label="Mark ${itemName} as ${item.completed ? 'incomplete' : 'complete'}"
                >
                <div class="item-content">
                    <span class="item-name ${item.completed ? 'completed' : ''}">${itemName}</span>
                    <span class="item-quantity">×${item.quantity}</span>
                </div>
                <button class="delete-btn" title="Delete ${itemName}" aria-label="Delete ${itemName}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </li>
        `;
    }

    /**
     * Handle toggling item completion
     */
    async handleToggleItem(id) {
        try {
            await this.db.toggleItemCompleted(id);
            await this.renderItems();
            await this.updateStats();
        } catch (error) {
            console.error('Failed to toggle item:', error);
            this.showError('Failed to update item');
        }
    }

    /**
     * Handle deleting an item
     */
    async handleDeleteItem(id) {
        try {
            await this.db.deleteItem(id);
            await this.renderItems();
            await this.updateStats();
        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showError('Failed to delete item');
        }
    }

    /**
     * Update statistics display
     */
    async updateStats() {
        try {
            const stats = await this.db.getStats();
            
            this.elements.totalItems.textContent = stats.total;
            this.elements.completedItems.textContent = stats.completed;
            this.elements.pendingItems.textContent = stats.pending;

        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    /**
     * Setup online/offline detection
     */
    setupOnlineDetection() {
        const updateStatus = () => {
            const isOnline = navigator.onLine;
            if (isOnline) {
                this.elements.onlineStatus.className = 'status-badge online';
                this.elements.onlineStatus.textContent = 'Online';
            } else {
                this.elements.onlineStatus.className = 'status-badge offline';
                this.elements.onlineStatus.textContent = 'Offline';
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        alert(message);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShoppingApp();
});
