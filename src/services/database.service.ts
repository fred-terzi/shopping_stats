import Dexie, { Table } from 'dexie';
import type { ShoppingItem } from '@/types/shopping.types';

/**
 * Shopping Stats Database
 * Manages IndexedDB using Dexie for better TypeScript support and reliability
 */
export class ShoppingDatabase extends Dexie {
  /** Items table */
  items!: Table<ShoppingItem, number>;

  constructor() {
    super('ShoppingStatsDB');

    this.version(1).stores({
      items: '++id, name, completed, createdAt',
    });
  }
}

// Singleton instance
export const db = new ShoppingDatabase();
