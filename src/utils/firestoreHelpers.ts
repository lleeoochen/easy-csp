/**
 * Firestore Helper Utilities
 *
 * Common utilities for working with Firestore operations
 */

/**
 * Filters out undefined values from an object before Firestore writes.
 * Firestore rejects undefined values but accepts null.
 *
 * @param obj - Object to filter
 * @returns New object with undefined values removed
 *
 * @example
 * const data = { name: "John", age: undefined, city: "NYC" };
 * await updateDoc(docRef, withoutUndefinedValue(data));
 * // Result: { name: "John", city: "NYC" }
 */
export const withoutUndefinedValue = <T extends object>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T;
};
