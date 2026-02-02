import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShoppingService } from '@/services/shopping.service';
import { db } from '@/services/database.service';

describe('ShoppingService', () => {
  let service: ShoppingService;

  beforeEach(async () => {
    service = new ShoppingService();
    await db.items.clear(); // Clear database before each test
  });

  afterEach(async () => {
    await db.items.clear(); // Clean up after each test
  });

  describe('addItem', () => {
    it('should add a valid item', async () => {
      const id = await service.addItem({ name: 'Milk', quantity: 2 });
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const item = await service.getItem(id);
      expect(item).toBeDefined();
      expect(item?.name).toBe('Milk');
      expect(item?.quantity).toBe(2);
      expect(item?.completed).toBe(false);
    });

    it('should trim whitespace from item name', async () => {
      const id = await service.addItem({ name: '  Bread  ', quantity: 1 });
      const item = await service.getItem(id);
      expect(item?.name).toBe('Bread');
    });

    it('should throw error for empty item name', async () => {
      await expect(service.addItem({ name: '', quantity: 1 })).rejects.toThrow(
        'Item name cannot be empty'
      );
    });

    it('should throw error for whitespace-only item name', async () => {
      await expect(service.addItem({ name: '   ', quantity: 1 })).rejects.toThrow(
        'Item name cannot be empty'
      );
    });

    it('should default quantity to 1 if not provided', async () => {
      const id = await service.addItem({ name: 'Eggs' });
      const item = await service.getItem(id);
      expect(item?.quantity).toBe(1);
    });

    it('should throw error for quantity less than 1', async () => {
      await expect(service.addItem({ name: 'Milk', quantity: 0 })).rejects.toThrow(
        'Quantity must be at least 1'
      );
    });

    it('should throw error for negative quantity', async () => {
      await expect(service.addItem({ name: 'Milk', quantity: -5 })).rejects.toThrow(
        'Quantity must be at least 1'
      );
    });

    it('should set createdAt timestamp', async () => {
      const id = await service.addItem({ name: 'Milk' });
      const item = await service.getItem(id);
      expect(item?.createdAt).toBeDefined();
      expect(new Date(item!.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should set completedAt to null for new items', async () => {
      const id = await service.addItem({ name: 'Milk' });
      const item = await service.getItem(id);
      expect(item?.completedAt).toBeNull();
    });
  });

  describe('getAllItems', () => {
    it('should return empty array when no items exist', async () => {
      const items = await service.getAllItems();
      expect(items).toEqual([]);
    });

    it('should return all items', async () => {
      await service.addItem({ name: 'Milk', quantity: 1 });
      await service.addItem({ name: 'Bread', quantity: 2 });
      await service.addItem({ name: 'Eggs', quantity: 3 });

      const items = await service.getAllItems();
      expect(items).toHaveLength(3);
    });

    it('should sort items with pending items first', async () => {
      const id1 = await service.addItem({ name: 'Milk' });
      await service.addItem({ name: 'Bread' });
      await service.toggleItemCompleted(id1);

      const items = await service.getAllItems();
      expect(items[0].name).toBe('Bread'); // Pending
      expect(items[1].name).toBe('Milk'); // Completed
    });

    it('should sort items by creation date within completion status', async () => {
      await service.addItem({ name: 'Item1' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await service.addItem({ name: 'Item2' });

      const items = await service.getAllItems();
      expect(items[0].name).toBe('Item2'); // Newer
      expect(items[1].name).toBe('Item1'); // Older
    });
  });

  describe('getItem', () => {
    it('should return undefined for non-existent item', async () => {
      const item = await service.getItem(99999);
      expect(item).toBeUndefined();
    });

    it('should return the correct item by ID', async () => {
      const id = await service.addItem({ name: 'Milk', quantity: 2 });
      const item = await service.getItem(id);
      
      expect(item).toBeDefined();
      expect(item?.id).toBe(id);
      expect(item?.name).toBe('Milk');
      expect(item?.quantity).toBe(2);
    });
  });

  describe('updateItem', () => {
    it('should update item name', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await service.updateItem(id, { name: 'Almond Milk' });
      
      const item = await service.getItem(id);
      expect(item?.name).toBe('Almond Milk');
    });

    it('should update item quantity', async () => {
      const id = await service.addItem({ name: 'Milk', quantity: 1 });
      await service.updateItem(id, { quantity: 3 });
      
      const item = await service.getItem(id);
      expect(item?.quantity).toBe(3);
    });

    it('should throw error for non-existent item', async () => {
      await expect(service.updateItem(99999, { name: 'Test' })).rejects.toThrow(
        'Item not found'
      );
    });

    it('should throw error for empty name', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await expect(service.updateItem(id, { name: '' })).rejects.toThrow(
        'Item name cannot be empty'
      );
    });

    it('should throw error for quantity less than 1', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await expect(service.updateItem(id, { quantity: 0 })).rejects.toThrow(
        'Quantity must be at least 1'
      );
    });

    it('should trim whitespace from updated name', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await service.updateItem(id, { name: '  Almond Milk  ' });
      
      const item = await service.getItem(id);
      expect(item?.name).toBe('Almond Milk');
    });
  });

  describe('toggleItemCompleted', () => {
    it('should toggle item from incomplete to complete', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await service.toggleItemCompleted(id);
      
      const item = await service.getItem(id);
      expect(item?.completed).toBe(true);
      expect(item?.completedAt).toBeDefined();
      expect(item?.completedAt).not.toBeNull();
    });

    it('should toggle item from complete to incomplete', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await service.toggleItemCompleted(id);
      await service.toggleItemCompleted(id);
      
      const item = await service.getItem(id);
      expect(item?.completed).toBe(false);
      expect(item?.completedAt).toBeNull();
    });

    it('should throw error for non-existent item', async () => {
      await expect(service.toggleItemCompleted(99999)).rejects.toThrow('Item not found');
    });

    it('should set completedAt timestamp when completing', async () => {
      const id = await service.addItem({ name: 'Milk' });
      const beforeTime = Date.now();
      await service.toggleItemCompleted(id);
      
      const item = await service.getItem(id);
      const completedTime = new Date(item!.completedAt!).getTime();
      expect(completedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(completedTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing item', async () => {
      const id = await service.addItem({ name: 'Milk' });
      await service.deleteItem(id);
      
      const item = await service.getItem(id);
      expect(item).toBeUndefined();
    });

    it('should not throw error when deleting non-existent item', async () => {
      await expect(service.deleteItem(99999)).resolves.toBeUndefined();
    });

    it('should decrease total item count after deletion', async () => {
      const id1 = await service.addItem({ name: 'Milk' });
      await service.addItem({ name: 'Bread' });
      
      await service.deleteItem(id1);
      
      const items = await service.getAllItems();
      expect(items).toHaveLength(1);
    });
  });

  describe('clearAllItems', () => {
    it('should clear all items', async () => {
      await service.addItem({ name: 'Milk' });
      await service.addItem({ name: 'Bread' });
      await service.addItem({ name: 'Eggs' });
      
      await service.clearAllItems();
      
      const items = await service.getAllItems();
      expect(items).toHaveLength(0);
    });

    it('should work when no items exist', async () => {
      await expect(service.clearAllItems()).resolves.toBeUndefined();
      const items = await service.getAllItems();
      expect(items).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when no items exist', async () => {
      const stats = await service.getStats();
      expect(stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
      });
    });

    it('should return correct stats for all pending items', async () => {
      await service.addItem({ name: 'Milk' });
      await service.addItem({ name: 'Bread' });
      
      const stats = await service.getStats();
      expect(stats).toEqual({
        total: 2,
        completed: 0,
        pending: 2,
      });
    });

    it('should return correct stats for mixed items', async () => {
      const id1 = await service.addItem({ name: 'Milk' });
      await service.addItem({ name: 'Bread' });
      await service.addItem({ name: 'Eggs' });
      
      await service.toggleItemCompleted(id1);
      
      const stats = await service.getStats();
      expect(stats).toEqual({
        total: 3,
        completed: 1,
        pending: 2,
      });
    });

    it('should return correct stats for all completed items', async () => {
      const id1 = await service.addItem({ name: 'Milk' });
      const id2 = await service.addItem({ name: 'Bread' });
      
      await service.toggleItemCompleted(id1);
      await service.toggleItemCompleted(id2);
      
      const stats = await service.getStats();
      expect(stats).toEqual({
        total: 2,
        completed: 2,
        pending: 0,
      });
    });
  });
});
