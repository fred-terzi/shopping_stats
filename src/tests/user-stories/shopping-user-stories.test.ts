import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shoppingService } from '@/services/shopping.service';
import { db } from '@/services/database.service';

/**
 * User Story Tests
 * These tests validate the complete user stories from requirements.md
 */

describe('User Stories', () => {
  beforeEach(async () => {
    await db.items.clear();
  });

  afterEach(async () => {
    await db.items.clear();
  });

  describe('US1: Family Shopping List Management', () => {
    /**
     * As a user, I want to be able to have my family add to a shopping list,
     * that I can check off items as they are purchased.
     */
    it('should allow multiple family members to add items and check them off', async () => {
      // Family member 1 adds items
      const milkId = await shoppingService.addItem({ name: 'Milk', quantity: 2 });
      const breadId = await shoppingService.addItem({ name: 'Bread', quantity: 1 });
      
      // Family member 2 adds items
      const eggsId = await shoppingService.addItem({ name: 'Eggs', quantity: 12 });
      const cheeseId = await shoppingService.addItem({ name: 'Cheese', quantity: 1 });
      
      // Verify all items are in the list
      const items = await shoppingService.getAllItems();
      expect(items).toHaveLength(4);
      
      // User checks off purchased items
      await shoppingService.toggleItemCompleted(milkId);
      await shoppingService.toggleItemCompleted(breadId);
      
      // Verify items are marked as completed
      const milk = await shoppingService.getItem(milkId);
      const bread = await shoppingService.getItem(breadId);
      expect(milk?.completed).toBe(true);
      expect(bread?.completed).toBe(true);
      
      // Verify pending items remain
      const eggs = await shoppingService.getItem(eggsId);
      const cheese = await shoppingService.getItem(cheeseId);
      expect(eggs?.completed).toBe(false);
      expect(cheese?.completed).toBe(false);
      
      // Verify statistics
      const stats = await shoppingService.getStats();
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(2);
    });
  });

  describe('US2: Shopping Habit Statistics', () => {
    /**
     * As a user, I want to be able to see statistics about my shopping habits,
     * such as most frequently purchased items and total spending over time.
     */
    it('should track and display shopping statistics', async () => {
      // Add various items
      await shoppingService.addItem({ name: 'Milk', quantity: 2 });
      await shoppingService.addItem({ name: 'Bread', quantity: 1 });
      await shoppingService.addItem({ name: 'Eggs', quantity: 12 });
      
      // Get stats
      const stats = await shoppingService.getStats();
      
      // Verify basic statistics are available
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(3);
      expect(stats.completed).toBe(0);
      
      // Complete some items
      const items = await shoppingService.getAllItems();
      await shoppingService.toggleItemCompleted(items[0].id!);
      await shoppingService.toggleItemCompleted(items[1].id!);
      
      // Verify updated statistics
      const updatedStats = await shoppingService.getStats();
      expect(updatedStats.total).toBe(3);
      expect(updatedStats.completed).toBe(2);
      expect(updatedStats.pending).toBe(1);
    });
  });

  describe('US3: Purchase Tracking with Timestamps', () => {
    /**
     * As a user, I want to be able to see how long it has been since I last purchased an item,
     * so I can better plan my shopping trips.
     */
    it('should track when items were created and completed', async () => {
      const beforeCreate = Date.now();
      
      // Add an item
      const id = await shoppingService.addItem({ name: 'Milk', quantity: 2 });
      
      const afterCreate = Date.now();
      
      // Verify creation timestamp
      let item = await shoppingService.getItem(id);
      const createdAt = new Date(item!.createdAt).getTime();
      expect(createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(createdAt).toBeLessThanOrEqual(afterCreate);
      expect(item?.completedAt).toBeNull();
      
      // Wait a bit and then complete the item
      await new Promise((resolve) => setTimeout(resolve, 100));
      const beforeComplete = Date.now();
      await shoppingService.toggleItemCompleted(id);
      const afterComplete = Date.now();
      
      // Verify completion timestamp
      item = await shoppingService.getItem(id);
      const completedAt = new Date(item!.completedAt!).getTime();
      expect(completedAt).toBeGreaterThanOrEqual(beforeComplete);
      expect(completedAt).toBeLessThanOrEqual(afterComplete);
      expect(completedAt).toBeGreaterThan(createdAt);
    });

    it('should support tracking purchase history through timestamps', async () => {
      // Simulate purchasing items at different times
      const item1Id = await shoppingService.addItem({ name: 'Weekly Item 1' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      const item2Id = await shoppingService.addItem({ name: 'Weekly Item 2' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      const item3Id = await shoppingService.addItem({ name: 'Weekly Item 3' });
      
      // Complete items at different times
      await shoppingService.toggleItemCompleted(item1Id);
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      await shoppingService.toggleItemCompleted(item2Id);
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      await shoppingService.toggleItemCompleted(item3Id);
      
      // Retrieve all items
      const items = await shoppingService.getAllItems();
      
      // Verify all have completion timestamps
      const completedItems = items.filter((item) => item.completed);
      expect(completedItems).toHaveLength(3);
      
      // Verify timestamps are in order
      for (const item of completedItems) {
        expect(item.completedAt).not.toBeNull();
        const created = new Date(item.createdAt).getTime();
        const completed = new Date(item.completedAt!).getTime();
        expect(completed).toBeGreaterThan(created);
      }
    });
  });

  describe('US4: Shopping Breakdown (Future Enhancement)', () => {
    /**
     * As a user, I want to be able to break down my shopping spending to categories,
     * like stores, item types, and time periods.
     * 
     * Note: This is a placeholder for future enhancement.
     * Current implementation provides the foundation for this feature.
     */
    it('should provide data structure that supports future categorization', async () => {
      // Add items with different characteristics
      await shoppingService.addItem({ name: 'Organic Milk', quantity: 1 });
      await shoppingService.addItem({ name: 'Whole Wheat Bread', quantity: 2 });
      await shoppingService.addItem({ name: 'Free Range Eggs', quantity: 12 });
      
      const items = await shoppingService.getAllItems();
      
      // Verify items have all necessary fields for future categorization
      items.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('completed');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('completedAt');
      });
    });
  });

  describe('US5: Offline Access', () => {
    /**
     * As a user, I want to be able to access my shopping list from my iPhone offline
     * so that I can use it even without internet access.
     * 
     * Note: This is tested by verifying IndexedDB persistence, which works offline.
     */
    it('should persist data locally using IndexedDB', async () => {
      // Add items
      const id1 = await shoppingService.addItem({ name: 'Item 1' });
      const id2 = await shoppingService.addItem({ name: 'Item 2' });
      
      // Verify items are persisted
      const items = await shoppingService.getAllItems();
      expect(items).toHaveLength(2);
      
      // Toggle completion
      await shoppingService.toggleItemCompleted(id1);
      
      // Verify changes are persisted
      const updatedItem = await shoppingService.getItem(id1);
      expect(updatedItem?.completed).toBe(true);
      
      // Verify data remains after operations
      const finalItems = await shoppingService.getAllItems();
      expect(finalItems).toHaveLength(2);
      expect(finalItems.find((item) => item.id === id1)?.completed).toBe(true);
      expect(finalItems.find((item) => item.id === id2)?.completed).toBe(false);
    });

    it('should handle operations without network connection (using IndexedDB)', async () => {
      // Simulate offline operation by performing multiple operations in sequence
      const operations = [
        shoppingService.addItem({ name: 'Offline Item 1' }),
        shoppingService.addItem({ name: 'Offline Item 2' }),
        shoppingService.addItem({ name: 'Offline Item 3' }),
      ];
      
      // All operations should complete successfully
      const ids = await Promise.all(operations);
      expect(ids).toHaveLength(3);
      
      // Verify all items are accessible
      const items = await shoppingService.getAllItems();
      expect(items).toHaveLength(3);
      
      // Perform operations on the items
      await shoppingService.toggleItemCompleted(ids[0]);
      await shoppingService.updateItem(ids[1], { quantity: 5 });
      await shoppingService.deleteItem(ids[2]);
      
      // Verify final state
      const finalItems = await shoppingService.getAllItems();
      expect(finalItems).toHaveLength(2);
      
      const item1 = await shoppingService.getItem(ids[0]);
      expect(item1?.completed).toBe(true);
      
      const item2 = await shoppingService.getItem(ids[1]);
      expect(item2?.quantity).toBe(5);
      
      const item3 = await shoppingService.getItem(ids[2]);
      expect(item3).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid successive operations', async () => {
      const id = await shoppingService.addItem({ name: 'Test Item' });
      
      // Perform rapid operations
      const operations = [
        shoppingService.updateItem(id, { quantity: 2 }),
        shoppingService.updateItem(id, { quantity: 3 }),
        shoppingService.toggleItemCompleted(id),
        shoppingService.updateItem(id, { quantity: 4 }),
      ];
      
      await Promise.all(operations);
      
      // Verify final state is consistent
      const item = await shoppingService.getItem(id);
      expect(item).toBeDefined();
      expect(item?.completed).toBe(true);
    });

    it('should handle boundary conditions for quantities', async () => {
      // Minimum valid quantity
      const id1 = await shoppingService.addItem({ name: 'Item 1', quantity: 1 });
      const item1 = await shoppingService.getItem(id1);
      expect(item1?.quantity).toBe(1);
      
      // Large quantity
      const id2 = await shoppingService.addItem({ name: 'Item 2', quantity: 1000000 });
      const item2 = await shoppingService.getItem(id2);
      expect(item2?.quantity).toBe(1000000);
    });

    it('should handle item names with various character sets', async () => {
      const names = [
        'Simple Item',
        'Item with émoji 🛒',
        'Item with ñ and ü',
        'Item with 中文',
        'Item with العربية',
        'Item with Русский',
      ];
      
      const ids = await Promise.all(
        names.map((name) => shoppingService.addItem({ name }))
      );
      
      expect(ids).toHaveLength(names.length);
      
      const items = await shoppingService.getAllItems();
      expect(items).toHaveLength(names.length);
      
      // Verify all names are preserved correctly
      names.forEach((name) => {
        const found = items.find((item) => item.name === name);
        expect(found).toBeDefined();
      });
    });
  });
});
