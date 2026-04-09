import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthState } from './useAuthState';
import { getAuth } from 'firebase/auth';

vi.mock('firebase/auth');

describe('useAuthState', () => {
  let mockOnAuthStateChanged: ReturnType<typeof vi.fn>;
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockOnAuthStateChanged = vi.fn((callback) => {
      // Store callback for later invocation
      mockOnAuthStateChanged.callback = callback;
      return mockUnsubscribe;
    });

    vi.mocked(getAuth).mockReturnValue({
      onAuthStateChanged: mockOnAuthStateChanged,
    } as any);
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuthState());

    expect(result.current.loading).toBe(true);
    expect(result.current.signedIn).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('should set user state when user is signed in', async () => {
    const { result } = renderHook(() => useAuthState());

    const mockUser = { uid: 'user-123' };
    mockOnAuthStateChanged.callback(mockUser);

    await waitFor(() => {
      expect(result.current.signedIn).toBe(true);
      expect(result.current.userId).toBe('user-123');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set signed out state when user is null', async () => {
    const { result } = renderHook(() => useAuthState());

    mockOnAuthStateChanged.callback(null);

    await waitFor(() => {
      expect(result.current.signedIn).toBe(false);
      expect(result.current.userId).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('should update state when auth state changes', async () => {
    const { result } = renderHook(() => useAuthState());

    // Initially signed in
    const mockUser1 = { uid: 'user-123' };
    mockOnAuthStateChanged.callback(mockUser1);

    await waitFor(() => {
      expect(result.current.userId).toBe('user-123');
      expect(result.current.signedIn).toBe(true);
    });

    // Sign out
    mockOnAuthStateChanged.callback(null);

    await waitFor(() => {
      expect(result.current.userId).toBeNull();
      expect(result.current.signedIn).toBe(false);
    });

    // Sign in with different user
    const mockUser2 = { uid: 'user-456' };
    mockOnAuthStateChanged.callback(mockUser2);

    await waitFor(() => {
      expect(result.current.userId).toBe('user-456');
      expect(result.current.signedIn).toBe(true);
    });
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useAuthState());

    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
