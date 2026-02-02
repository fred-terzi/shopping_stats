import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shoppingService } from '@/services/shopping.service';
import { db } from '@/services/database.service';

describe('Integration: Database + Service Layer', () => {
  beforeEach(async () => {
    await db.items.clear();
  });

  afterEach(async () => {
    await db.items.clear();
  });

  it('should persist items across service calls', async () => {
    // Add item
    const id = await shoppingService.addItem({ name: 'Milk', quantity: 2 });
    
    // Retrieve item using different service call
    const item = await shoppingService.getItem(id);
    expect(item?.name).toBe('Milk');
    expect(item?.quantity).toBe(2);
    
    // Verify it appears in list
    const items = await shoppingService.getAllItems();
    expect(items).toHaveLength(1);
  });

  it('should maintain data integrity through complex operations', async () => {
    // Create multiple items
    const id1 = await shoppingService.addItem({ name: 'Milk', quantity: 1 });
    const id2 = await shoppingService.addItem({ name: 'Bread', quantity: 2 });
    const id3 = await shoppingService.addItem({ name: 'Eggs', quantity: 3 });
    
    // Toggle completion
    await shoppingService.toggleItemCompleted(id1);
    await shoppingService.toggleItemCompleted(id3);
    
    // Update an item
    await shoppingService.updateItem(id2, { quantity: 5 });
    
    // Delete an item
    await shoppingService.deleteItem(id3);
    
    // Verify final state
    const items = await shoppingService.getAllItems();
    expect(items).toHaveLength(2);
    
    const milk = await shoppingService.getItem(id1);
    expect(milk?.completed).toBe(true);
    
    const bread = await shoppingService.getItem(id2);
    expect(bread?.quantity).toBe(5);
    
    const eggs = await shoppingService.getItem(id3);
    expect(eggs).toBeUndefined();
  });

  it('should maintain correct statistics after operations', async () => {
    // Initial state
    let stats = await shoppingService.getStats();
    expect(stats.total).toBe(0);
    
    // Add items
    const id1 = await shoppingService.addItem({ name: 'Item1' });
    const id2 = await shoppingService.addItem({ name: 'Item2' });
    const id3 = await shoppingService.addItem({ name: 'Item3' });
    
    stats = await shoppingService.getStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(3);
    expect(stats.completed).toBe(0);
    
    // Complete some items
    await shoppingService.toggleItemCompleted(id1);
    await shoppingService.toggleItemCompleted(id2);
    
    stats = await shoppingService.getStats();
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(1);
    
    // Delete an item
    await shoppingService.deleteItem(id3);
    
    stats = await shoppingService.getStats();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(0);
  });

  it('should handle concurrent operations safely', async () => {
    // Add multiple items concurrently
    const promises = [
      shoppingService.addItem({ name: 'Item1' }),
      shoppingService.addItem({ name: 'Item2' }),
      shoppingService.addItem({ name: 'Item3' }),
      shoppingService.addItem({ name: 'Item4' }),
      shoppingService.addItem({ name: 'Item5' }),
    ];
    
    const ids = await Promise.all(promises);
    
    // Verify all items were added
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5); // All IDs should be unique
    
    const items = await shoppingService.getAllItems();
    expect(items).toHaveLength(5);
  });

  it('should handle edge case: toggle item multiple times', async () => {
    const id = await shoppingService.addItem({ name: 'Test Item' });
    
    // Toggle 10 times
    for (let i = 0; i < 10; i++) {
      await shoppingService.toggleItemCompleted(id);
    }
    
    // Should end up incomplete (started incomplete, toggled even number of times)
    const item = await shoppingService.getItem(id);
    expect(item?.completed).toBe(false);
    expect(item?.completedAt).toBeNull();
  });

  it('should handle edge case: update non-existent item', async () => {
    await expect(
      shoppingService.updateItem(99999, { name: 'Updated' })
    ).rejects.toThrow('Item not found');
  });

  it('should handle edge case: very long item names', async () => {
    const longName = 'A'.repeat(1000);
    const id = await shoppingService.addItem({ name: longName });
    
    const item = await shoppingService.getItem(id);
    expect(item?.name).toBe(longName);
  });

  it('should handle edge case: large quantities', async () => {
    const largeQuantity = 999999;
    const id = await shoppingService.addItem({ name: 'Bulk Item', quantity: largeQuantity });
    
    const item = await shoppingService.getItem(id);
    expect(item?.quantity).toBe(largeQuantity);
  });

  it('should handle edge case: special characters in item names', async () => {
    const specialName = '🛒 Milk & Cookies <test> "quotes" \'apostrophes\'';
    const id = await shoppingService.addItem({ name: specialName });
    
    const item = await shoppingService.getItem(id);
    expect(item?.name).toBe(specialName);
  });

  it('should handle edge case: clear empty database', async () => {
    await expect(shoppingService.clearAllItems()).resolves.toBeUndefined();
    const items = await shoppingService.getAllItems();
    expect(items).toHaveLength(0);
  });
});
