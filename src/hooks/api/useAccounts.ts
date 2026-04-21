import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountService } from '@/services/accountService';
import type { AccountType } from '@easy-csp/shared-types';
import type { UI_FinancialAccount } from '@/types/uiTypes';

/**
 * Query key for accounts data
 * Used for cache management and invalidation
 */
export const ACCOUNTS_QUERY_KEY = ['accounts'];

/**
 * Query key for accounts with institution info
 * Used for cache management and invalidation
 */
export const ACCOUNTS_WITH_INFO_QUERY_KEY = ['accounts', 'withInfo'];

/**
 * React Query hook for fetching all user accounts
 *
 * Returns all accounts (both manual and Plaid-linked) owned by the authenticated user.
 * Accounts are returned as-is from Firestore without additional denormalization.
 *
 * @returns UseQueryResult containing array of Account objects
 *
 * @example
 * const { data: accounts, isLoading, error } = useAccounts();
 *
 * if (isLoading) return <div>Loading accounts...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {accounts?.map(account => (
 *       <div key={account.id}>{account.accountName}: ${account.balance}</div>
 *     ))}
 *   </div>
 * );
 */
export const useAccounts = () => {
  return useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      return await AccountService.listAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - accounts don't change frequently
  });
};

/**
 * React Query hook for fetching accounts with denormalized institution information
 *
 * Returns all accounts (both manual and Plaid-linked) with additional denormalized data:
 * - Institution name and sync status (for linked accounts)
 * - Display name (nickname || accountName)
 *
 * This hook is ideal for UI components that need to display comprehensive account information,
 * such as the Net Worth page, account lists, and account cards.
 *
 * @returns UseQueryResult containing array of UI_FinancialAccount objects
 *
 * @example
 * const { data: accounts, isLoading, error } = useAccountsWithInfo();
 *
 * if (isLoading) return <div>Loading accounts...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {accounts?.map(account => (
 *       <div key={account.id}>
 *         <h3>{account.displayName}</h3>
 *         <p>Balance: ${account.balance}</p>
 *         {account.institutionName && <p>Institution: {account.institutionName}</p>}
 *         {account.syncStatus && <p>Status: {account.syncStatus}</p>}
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export const useAccountsWithInfo = () => {
  return useQuery({
    queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY,
    queryFn: async () => {
      return await AccountService.getAccountsWithInstitutionInfo();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - accounts don't change frequently
  });
};

/**
 * React Query mutation hook for creating a manual account
 *
 * Creates a new manual account (not linked to Plaid) with the specified details.
 * On success, invalidates the accounts cache to trigger a refetch of all account queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: createAccount, isPending, error } = useCreateManualAccount();
 *
 * const handleCreateAccount = () => {
 *   createAccount(
 *     {
 *       accountName: 'Emergency Account',
 *       accountType: AccountType.Savings,
 *       initialBalance: 5000,
 *       nickname: 'Rainy Day Account'
 *     },
 *     {
 *       onSuccess: (accountId) => {
 *         console.log('Created account:', accountId);
 *         // Account list will automatically refresh
 *       },
 *       onError: (error) => {
 *         console.error('Failed to create account:', error);
 *       }
 *     }
 *   );
 * };
 */
export const useCreateManualAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountName,
      accountType,
      initialBalance,
      nickname,
    }: {
      accountName: string;
      accountType: AccountType;
      initialBalance: number;
      nickname?: string;
    }) =>
      AccountService.createManualAccount(
        accountName,
        accountType,
        initialBalance,
        nickname
      ),
    onSuccess: () => {
      // Invalidate both accounts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating an account's nickname
 *
 * Updates the nickname (display name) for any account (manual or linked).
 * Pass null or undefined to clear the nickname and revert to the original account name.
 * On success, invalidates the accounts cache to trigger a refetch of all account queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateNickname, isPending, error } = useUpdateAccountNickname();
 *
 * // Set a nickname
 * const handleSetNickname = () => {
 *   updateNickname(
 *     {
 *       accountId: 'account123',
 *       nickname: 'My Savings'
 *     },
 *     {
 *       onSuccess: () => {
 *         console.log('Nickname updated');
 *         // Account list will automatically refresh
 *       },
 *       onError: (error) => {
 *         console.error('Failed to update nickname:', error);
 *       }
 *     }
 *   );
 * };
 *
 * // Clear a nickname
 * const handleClearNickname = () => {
 *   updateNickname({
 *     accountId: 'account123',
 *     nickname: null
 *   });
 * };
 */
export const useUpdateAccountNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      nickname,
    }: {
      accountId: string;
      nickname: string | null | undefined;
    }) => AccountService.updateAccountNickname(accountId, nickname),
    onSuccess: () => {
      // Invalidate both accounts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating a manual account's balance
 *
 * Updates the balance for a manual account (not linked to Plaid).
 * This operation is only allowed for manual accounts (isManual=true).
 * Linked accounts sync automatically from Plaid and cannot be manually updated.
 * On success, invalidates accounts caches to trigger refetch.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateBalance, isPending, error } = useUpdateManualAccountBalance();
 *
 * const handleUpdateBalance = () => {
 *   updateBalance(
 *     {
 *       accountId: 'account123',
 *       newBalance: 5500.00
 *     },
 *     {
 *       onSuccess: () => {
 *         console.log('Balance updated');
 *         // Account list will automatically refresh
 *       },
 *       onError: (error) => {
 *         console.error('Failed to update balance:', error);
 *         // Error might be: "Cannot manually update balance for Plaid-linked accounts"
 *       }
 *     }
 *   );
 * };
 */
export const useUpdateManualAccountBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      newBalance,
    }: {
      accountId: string;
      newBalance: number;
    }) => AccountService.updateManualAccountBalance(accountId, newBalance),
    onSuccess: () => {
      // Invalidate accounts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating a manual account (balance and/or nickname)
 *
 * Updates balance and/or nickname for a manual account in a single operation.
 * This is more efficient than separate updates and ensures atomic changes.
 * Automatically updates lastSyncTimestamp to track when the account was last modified.
 * On success, invalidates accounts caches to trigger refetch.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateAccount, isPending, error } = useUpdateManualAccount();
 *
 * // Update both balance and nickname
 * const handleUpdate = () => {
 *   updateAccount(
 *     {
 *       accountId: 'account123',
 *       balance: 5500.00,
 *       nickname: 'Emergency Fund'
 *     },
 *     {
 *       onSuccess: () => {
 *         console.log('Account updated');
 *       },
 *       onError: (error) => {
 *         console.error('Failed to update account:', error);
 *       }
 *     }
 *   );
 * };
 */
export const useUpdateManualAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      balance,
      nickname,
    }: {
      accountId: string;
      balance?: number;
      nickname?: string | null;
    }) => AccountService.updateManualAccount(accountId, { balance, nickname }),
    onSuccess: () => {
      // Invalidate accounts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating an account's target amount
 *
 * Updates the target amount for any account (manual or linked) for goal tracking.
 * The target amount is used to track progress toward savings or investment goals
 * directly on the account. Pass null or undefined to clear the target amount.
 *
 * On success, invalidates the accounts cache to trigger a refetch of all account queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateTargetAmount, isPending, error } = useUpdateAccountTargetAmount();
 *
 * // Set a target amount
 * const handleSetTarget = () => {
 *   updateTargetAmount(
 *     {
 *       accountId: 'account123',
 *       targetAmount: 10000.00
 *     },
 *     {
 *       onSuccess: () => {
 *         console.log('Target amount set');
 *         // Account list will automatically refresh with progress indicator
 *       },
 *       onError: (error) => {
 *         console.error('Failed to set target amount:', error);
 *         // Error might be: "Target amount must be a positive number"
 *       }
 *     }
 *   );
 * };
 *
 * // Clear a target amount
 * const handleClearTarget = () => {
 *   updateTargetAmount({
 *     accountId: 'account123',
 *     targetAmount: null
 *   });
 * };
 */
export const useUpdateAccountTargetAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      targetAmount,
    }: {
      accountId: string;
      targetAmount: number | null | undefined;
    }) => AccountService.updateAccountTargetAmount(accountId, targetAmount),
    onSuccess: () => {
      // Invalidate accounts queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for deleting a manual account
 *
 * Permanently deletes a manual account from Firestore.
 * This operation is only allowed for manual accounts (isManual=true).
 * Plaid-linked accounts cannot be deleted directly - users must remove
 * the institution connection instead.
 *
 * Before deletion, the method verifies:
 * - Account exists and belongs to the authenticated user
 * - Account is manual (isManual=true)
 * - No transactions reference this account
 *
 * On success, removes the account from the cache using optimistic updates for
 * immediate UI feedback, then invalidates queries to ensure consistency.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: deleteAccount, isPending, error } = useDeleteManualAccount();
 *
 * const handleDeleteAccount = () => {
 *   if (confirm('Are you sure you want to delete this account?')) {
 *     deleteAccount(
 *       { accountId: 'account123' },
 *       {
 *         onSuccess: () => {
 *           console.log('Account deleted');
 *           // Account removed from UI immediately
 *         },
 *         onError: (error) => {
 *           console.error('Failed to delete account:', error);
 *           // Error might be: "Cannot delete Plaid-linked accounts"
 *           // or "Cannot delete account: 5 transaction(s) reference this account"
 *         }
 *       }
 *     );
 *   }
 * };
 */
export const useDeleteManualAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId }: { accountId: string }) =>
      AccountService.deleteManualAccount(accountId),
    onSuccess: (_data, variables) => {
      // Remove from cache immediately for optimistic UI update
      queryClient.setQueryData(ACCOUNTS_QUERY_KEY, (oldData: UI_FinancialAccount[]) => {
        if (!oldData) return oldData;
        return oldData.filter((account: UI_FinancialAccount) => account.id !== variables.accountId);
      });

      queryClient.setQueryData(ACCOUNTS_WITH_INFO_QUERY_KEY, (oldData: UI_FinancialAccount[]) => {
        if (!oldData) return oldData;
        return oldData.filter((account: UI_FinancialAccount) => account.id !== variables.accountId);
      });

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });
    },
  });
};


