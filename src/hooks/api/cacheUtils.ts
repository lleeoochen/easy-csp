import type { QueryClient } from '@tanstack/react-query';

/**
 * Updates a single item in an array-based query cache
 */
export function updateItemInCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: unknown[],
  itemId: string,
  updates: Partial<T>
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
  });
}

/**
 * Adds a new item to an array-based query cache
 */
export function addItemToCache<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  newItem: T
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [newItem];
    return [...old, newItem];
  });
}

/**
 * Removes an item from an array-based query cache
 */
export function removeItemFromCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: unknown[],
  itemId: string
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.filter((item) => item.id !== itemId);
  });
}

/**
 * Updates an item in an array by index
 */
export function updateItemByIndexInCache<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  index: number,
  updates: Partial<T> | T
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.map((item, i) => (i === index ? { ...item, ...updates } : item));
  });
}

/**
 * Removes an item from an array by index
 */
export function removeItemByIndexFromCache<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  index: number
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    return old.filter((_, i) => i !== index);
  });
}

/**
 * Reorders items in an array-based query cache
 */
export function reorderItemsInCache<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  fromIndex: number,
  toIndex: number
) {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return old;
    const newArray = [...old];
    const [removed] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, removed);
    return newArray;
  });
}
