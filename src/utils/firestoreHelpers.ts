import { deleteField } from "firebase/firestore";

/**
 * Firestore Helper Utilities
 *
 * Common utilities for working with Firestore operations
 */

/**
 * Prepares an object for Firestore write operations by converting undefined values to deleteField().
 * This allows you to remove fields from Firestore documents by passing undefined values.
 *
 * Firestore rejects undefined values but accepts null and deleteField().
 * - undefined → deleteField() (removes the field from Firestore)
 * - null → kept as null (sets the field to null in Firestore)
 * - other values → kept as-is
 *
 * @param obj - Object to prepare for Firestore
 * @returns New object with undefined values converted to deleteField()
 *
 * @example
 * const data = { name: "John", age: undefined, city: "NYC" };
 * await updateDoc(docRef, prepareFirestoreData(data));
 * // Result: { name: "John", age: deleteField(), city: "NYC" }
 * // The 'age' field will be removed from the Firestore document
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prepareFirestoreData = <T extends object>(obj: T): Record<string, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === undefined ? deleteField() : value;
  }

  return result;
};

/**
 * Filters out undefined values from an object before Firestore writes.
 * Firestore rejects undefined values but accepts null.
 *
 * @param obj - Object to filter
 * @returns New object with undefined values removed
 */
export const withoutUndefinedValue = <T extends object>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as T;
};
