import { db } from './database.service';
import type {
  ShoppingItem,
  ShoppingStats,
  CreateItemInput,
  UpdateItemInput,
} from '@/types/shopping.types';

/**
 * Shopping Service - Core API for managing shopping items
 * Provides business logic layer on top of database operations
 */
export class ShoppingService {
  /**
   * Add a new item to the shopping list
   * @param input - Item data
   * @returns The ID of the newly created item
   * @throws Error if item name is empty
   */
  async addItem(input: CreateItemInput): Promise<number> {
    const name = input.name.trim();
    
    if (!name) {
      throw new Error('Item name cannot be empty');
    }

    const quantity = input.quantity ?? 1;
    
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const item: ShoppingItem = {
      name,
      quantity,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    return await db.items.add(item);
  }

  /**
   * Get all items from the shopping list
   * @returns Array of all shopping items, sorted by completion status and creation date
   */
  async getAllItems(): Promise<ShoppingItem[]> {
    const items = await db.items.toArray();
    
    // Sort: pending items first, then completed items
    // Within each group, sort by creation date (newest first)
    return items.sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    });
  }

  /**
   * Get a single item by ID
   * @param id - Item ID
   * @returns The item or undefined if not found
   */
  async getItem(id: number): Promise<ShoppingItem | undefined> {
    return await db.items.get(id);
  }

  /**
   * Update an existing item
   * @param id - Item ID
   * @param updates - Fields to update
   * @throws Error if item not found or validation fails
   */
  async updateItem(id: number, updates: UpdateItemInput): Promise<void> {
    const item = await this.getItem(id);
    
    if (!item) {
      throw new Error('Item not found');
    }

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name) {
        throw new Error('Item name cannot be empty');
      }
      updates.name = name;
    }

    if (updates.quantity !== undefined && updates.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    await db.items.update(id, updates);
  }

  /**
   * Toggle the completion status of an item
   * @param id - Item ID
   * @throws Error if item not found
   */
  async toggleItemCompleted(id: number): Promise<void> {
    const item = await this.getItem(id);
    
    if (!item) {
      throw new Error('Item not found');
    }

    const completed = !item.completed;
    const completedAt = completed ? new Date().toISOString() : null;

    await db.items.update(id, { completed, completedAt });
  }

  /**
   * Delete an item from the shopping list
   * @param id - Item ID
   */
  async deleteItem(id: number): Promise<void> {
    await db.items.delete(id);
  }

  /**
   * Clear all items from the shopping list
   */
  async clearAllItems(): Promise<void> {
    await db.items.clear();
  }

  /**
   * Get statistics about shopping items
   * @returns Statistics object with total, completed, and pending counts
   */
  async getStats(): Promise<ShoppingStats> {
    const items = await db.items.toArray();
    const completed = items.filter((item) => item.completed).length;
    const pending = items.filter((item) => !item.completed).length;

    return {
      total: items.length,
      completed,
      pending,
    };
  }
}

// Singleton instance
export const shoppingService = new ShoppingService();
