import { shoppingService } from '@/services/shopping.service';
import type { ShoppingItem } from '@/types/shopping.types';
import { escapeHtml, isOnline } from '@/utils/helpers';

/**
 * Shopping App - Main application class
 * Manages UI interactions and coordinates with the core API
 */
export class ShoppingApp {
  private elements: {
    addBtn: HTMLElement | null;
    itemName: HTMLInputElement | null;
    itemQuantity: HTMLInputElement | null;
    shoppingList: HTMLElement | null;
    emptyState: HTMLElement | null;
    totalItems: HTMLElement | null;
    completedItems: HTMLElement | null;
    pendingItems: HTMLElement | null;
    onlineStatus: HTMLElement | null;
  };

  constructor() {
    this.elements = {
      addBtn: null,
      itemName: null,
      itemQuantity: null,
      shoppingList: null,
      emptyState: null,
      totalItems: null,
      completedItems: null,
      pendingItems: null,
      onlineStatus: null,
    };
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    try {
      console.log('Initializing Shopping Stats app...');

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

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Cache DOM elements for performance
   */
  private cacheElements(): void {
    this.elements = {
      addBtn: document.getElementById('add-item-btn'),
      itemName: document.getElementById('item-name') as HTMLInputElement,
      itemQuantity: document.getElementById('item-quantity') as HTMLInputElement,
      shoppingList: document.getElementById('shopping-list'),
      emptyState: document.getElementById('empty-state'),
      totalItems: document.getElementById('total-items'),
      completedItems: document.getElementById('completed-items'),
      pendingItems: document.getElementById('pending-items'),
      onlineStatus: document.getElementById('online-status'),
    };
  }

  /**
   * Set up event listeners for user interactions
   */
  private setupEventListeners(): void {
    // Add button click
    this.elements.addBtn?.addEventListener('click', () => {
      void this.handleAddItem();
    });

    // Enter key in item name field
    this.elements.itemName?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        void this.handleAddItem();
      }
    });

    // Enter key in quantity field
    this.elements.itemQuantity?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        void this.handleAddItem();
      }
    });

    // Event delegation for shopping list items
    this.elements.shoppingList?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const itemElement = target.closest('.shopping-item') as HTMLElement;
        if (itemElement?.dataset.itemId) {
          const itemId = parseInt(itemElement.dataset.itemId);
          void this.handleToggleItem(itemId);
        }
      }
    });

    this.elements.shoppingList?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.delete-btn')) {
        const itemElement = target.closest('.shopping-item') as HTMLElement;
        if (itemElement?.dataset.itemId) {
          const itemId = parseInt(itemElement.dataset.itemId);
          void this.handleDeleteItem(itemId);
        }
      }
    });
  }

  /**
   * Handle adding a new item
   */
  private async handleAddItem(): Promise<void> {
    const name = this.elements.itemName?.value.trim() ?? '';
    const quantity = parseInt(this.elements.itemQuantity?.value ?? '1') || 1;

    if (!name) {
      alert('Please enter an item name');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    try {
      await shoppingService.addItem({ name, quantity });

      // Clear form
      if (this.elements.itemName) this.elements.itemName.value = '';
      if (this.elements.itemQuantity) this.elements.itemQuantity.value = '1';
      this.elements.itemName?.focus();

      // Re-render list
      await this.renderItems();
      await this.updateStats();
    } catch (error) {
      console.error('Failed to add item:', error);
      this.showError('Failed to add item');
    }
  }

  /**
   * Render all items in the shopping list
   */
  private async renderItems(): Promise<void> {
    try {
      const items = await shoppingService.getAllItems();

      // Show/hide empty state
      if (items.length === 0) {
        if (this.elements.emptyState) {
          this.elements.emptyState.style.display = 'block';
        }
        if (this.elements.shoppingList) {
          this.elements.shoppingList.innerHTML = '';
        }
        return;
      }

      if (this.elements.emptyState) {
        this.elements.emptyState.style.display = 'none';
      }

      // Render items
      if (this.elements.shoppingList) {
        this.elements.shoppingList.innerHTML = items.map((item) => this.createItemElement(item)).join('');
      }
    } catch (error) {
      console.error('Failed to render items:', error);
      this.showError('Failed to load items');
    }
  }

  /**
   * Create HTML for a single item
   */
  private createItemElement(item: ShoppingItem): string {
    const itemName = escapeHtml(item.name);
    const itemId = item.id ?? 0;
    
    return `
      <li class="shopping-item" data-item-id="${itemId}">
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
  private async handleToggleItem(id: number): Promise<void> {
    try {
      await shoppingService.toggleItemCompleted(id);
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
  private async handleDeleteItem(id: number): Promise<void> {
    try {
      await shoppingService.deleteItem(id);
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
  private async updateStats(): Promise<void> {
    try {
      const stats = await shoppingService.getStats();

      if (this.elements.totalItems) {
        this.elements.totalItems.textContent = stats.total.toString();
      }
      if (this.elements.completedItems) {
        this.elements.completedItems.textContent = stats.completed.toString();
      }
      if (this.elements.pendingItems) {
        this.elements.pendingItems.textContent = stats.pending.toString();
      }
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    const updateStatus = (): void => {
      const online = isOnline();
      if (this.elements.onlineStatus) {
        if (online) {
          this.elements.onlineStatus.className = 'status-badge online';
          this.elements.onlineStatus.textContent = 'Online';
        } else {
          this.elements.onlineStatus.className = 'status-badge offline';
          this.elements.onlineStatus.textContent = 'Offline';
        }
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }

  /**
   * Show error message to user
   */
  private showError(message: string): void {
    console.error(message);
    alert(message);
  }
}
