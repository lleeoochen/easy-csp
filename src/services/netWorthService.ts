import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ACCOUNTS_COLLECTION, type Account, AccountType } from '@easy-csp/shared-types';
import { calculateNetWorth } from '../utils/netWorthUtils';

export interface NetWorthBreakdown {
  checking: number;
  savings: number;
  credit: number;
  investment: number;
  loan: number;
  other: number;
  total: number;
}

/**
 * Calculate current net worth from all accounts (normalized model)
 */
export const NetWorthService = {
  /**
   * Calculate current net worth breakdown by account type
   * Uses the new normalized accounts collection
   */
  async getCurrentNetWorth(): Promise<NetWorthBreakdown> {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');

    const firestore = getFirestore();

    // Fetch all accounts from top-level collection
    const accountsQuery = query(
      collection(firestore, ACCOUNTS_COLLECTION),
      where('uid', '==', uid)
    );
    const accountsSnapshot = await getDocs(accountsQuery);
    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Account));

    // Use the utility function to calculate net worth
    const netWorthSummary = calculateNetWorth(accounts);

    // Convert to the existing NetWorthBreakdown format for backward compatibility
    return {
      checking: netWorthSummary.assets.checking,
      savings: netWorthSummary.assets.savings,
      credit: netWorthSummary.liabilities.credit,
      investment: netWorthSummary.assets.investment,
      loan: netWorthSummary.liabilities.loan,
      other: netWorthSummary.assets.other,
      total: netWorthSummary.netWorth,
    };
  },
};
