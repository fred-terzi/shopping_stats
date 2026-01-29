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
            form: document.getElementById('add-item-form'),
            itemName: document.getElementById('item-name'),
            itemQuantity: document.getElementById('item-quantity'),
            shoppingList: document.getElementById('shopping-list'),
            emptyState: document.getElementById('empty-state'),
            totalItems: document.getElementById('total-items'),
            completedItems: document.getElementById('completed-items'),
            pendingItems: document.getElementById('pending-items'),
            onlineStatus: document.getElementById('online-status'),
            statusText: document.getElementById('status-text')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddItem();
        });

        // Event delegation for shopping list items
        this.elements.shoppingList.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                const itemElement = e.target.closest('[id^="item-"]');
                if (itemElement) {
                    const itemId = parseInt(itemElement.id.replace('item-', ''));
                    this.handleToggleItem(itemId);
                }
            }
        });

        this.elements.shoppingList.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                const itemElement = e.target.closest('[id^="item-"]');
                if (itemElement) {
                    const itemId = parseInt(itemElement.id.replace('item-', ''));
                    this.handleDeleteItem(itemId);
                }
            }
        });
    }

    /**
     * Handle adding a new item
     */
    async handleAddItem() {
        const name = this.elements.itemName.value;
        const quantity = this.elements.itemQuantity.value;

        if (!name.trim()) {
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
        return `
            <div id="item-${item.id}" class="shopping-item ${item.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="item-checkbox" 
                    ${item.completed ? 'checked' : ''}
                >
                <div class="item-details">
                    <span class="item-name">${this.escapeHtml(item.name)}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                </div>
                <button class="delete-btn" title="Delete item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
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
            this.elements.onlineStatus.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
            this.elements.statusText.textContent = isOnline ? 'Online' : 'Offline';
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple error display - could be enhanced with a toast/notification system
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
