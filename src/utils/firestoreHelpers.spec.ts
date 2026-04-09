import { describe, it, expect, vi } from 'vitest';
import { prepareFirestoreData, withoutUndefinedValue } from './firestoreHelpers';

// Mock deleteField from firebase/firestore
vi.mock('firebase/firestore', () => ({
  deleteField: () => ({ _type: 'deleteField' }),
}));

describe('firestoreHelpers', () => {
  describe('prepareFirestoreData', () => {
    it('should convert undefined values to deleteField()', () => {
      const input = {
        name: 'John',
        age: undefined,
        city: 'NYC',
      };

      const result = prepareFirestoreData(input);

      expect(result.name).toBe('John');
      expect(result.age).toEqual({ _type: 'deleteField' });
      expect(result.city).toBe('NYC');
    });

    it('should keep null values as null', () => {
      const input = {
        name: 'John',
        age: null,
        city: 'NYC',
      };

      const result = prepareFirestoreData(input);

      expect(result.name).toBe('John');
      expect(result.age).toBeNull();
      expect(result.city).toBe('NYC');
    });

    it('should handle empty objects', () => {
      const result = prepareFirestoreData({});
      expect(result).toEqual({});
    });

    it('should handle objects with all undefined values', () => {
      const input = {
        field1: undefined,
        field2: undefined,
      };

      const result = prepareFirestoreData(input);

      expect(result.field1).toEqual({ _type: 'deleteField' });
      expect(result.field2).toEqual({ _type: 'deleteField' });
    });

    it('should preserve other data types', () => {
      const input = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };

      const result = prepareFirestoreData(input);

      expect(result.string).toBe('text');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.array).toEqual([1, 2, 3]);
      expect(result.object).toEqual({ nested: 'value' });
    });
  });

  describe('withoutUndefinedValue', () => {
    it('should remove undefined values', () => {
      const input = {
        name: 'John',
        age: undefined,
        city: 'NYC',
      };

      const result = withoutUndefinedValue(input);

      expect(result).toEqual({
        name: 'John',
        city: 'NYC',
      });
      expect('age' in result).toBe(false);
    });

    it('should keep null values', () => {
      const input = {
        name: 'John',
        age: null,
        city: 'NYC',
      };

      const result = withoutUndefinedValue(input);

      expect(result).toEqual({
        name: 'John',
        age: null,
        city: 'NYC',
      });
    });

    it('should handle empty objects', () => {
      const result = withoutUndefinedValue({});
      expect(result).toEqual({});
    });

    it('should return empty object when all values are undefined', () => {
      const input = {
        field1: undefined,
        field2: undefined,
      };

      const result = withoutUndefinedValue(input);
      expect(result).toEqual({});
    });

    it('should preserve other data types', () => {
      const input = {
        string: 'text',
        number: 0,
        boolean: false,
        array: [],
        object: {},
      };

      const result = withoutUndefinedValue(input);

      expect(result).toEqual(input);
    });
  });
});
