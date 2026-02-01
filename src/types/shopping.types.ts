/**
 * Shopping item interface
 */
export interface ShoppingItem {
  /** Unique identifier for the item */
  id?: number;
  /** Name of the item */
  name: string;
  /** Quantity of the item */
  quantity: number;
  /** Whether the item has been completed */
  completed: boolean;
  /** Timestamp when the item was created */
  createdAt: string;
  /** Timestamp when the item was completed (null if not completed) */
  completedAt: string | null;
}

/**
 * Statistics about shopping items
 */
export interface ShoppingStats {
  /** Total number of items */
  total: number;
  /** Number of completed items */
  completed: number;
  /** Number of pending items */
  pending: number;
}

/**
 * Input for creating a new shopping item
 */
export interface CreateItemInput {
  /** Name of the item */
  name: string;
  /** Quantity of the item (default: 1) */
  quantity?: number;
}

/**
 * Input for updating an existing shopping item
 */
export interface UpdateItemInput {
  /** Name of the item */
  name?: string;
  /** Quantity of the item */
  quantity?: number;
  /** Whether the item has been completed */
  completed?: boolean;
}
