import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FINANCIAL_INSTITUTIONS_COLLECTION, FUNDS_COLLECTION, type FinancialInstitution, type Fund, AccountType, FundType } from '@easy-csp/shared-types';

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
 * Calculate current net worth from all financial institution accounts
 */
export const NetWorthService = {
  /**
   * Calculate current net worth breakdown by account type
   */
  async getCurrentNetWorth(): Promise<NetWorthBreakdown> {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');

    const firestore = getFirestore();

    // Fetch financial institutions
    const institutionsQuery = query(
      collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION),
      where('uid', '==', uid)
    );
    const institutionsSnapshot = await getDocs(institutionsQuery);
    const institutions = institutionsSnapshot.docs.map(doc => doc.data() as FinancialInstitution);

    // Fetch all funds
    const fundsQuery = query(
      collection(firestore, FUNDS_COLLECTION),
      where('uid', '==', uid)
    );
    const fundsSnapshot = await getDocs(fundsQuery);
    const funds = fundsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Fund
    }));

    // Create a set of account IDs that are tracked by funds
    const trackedAccountIds = new Set(
      funds
        .filter(fund => fund.accountId !== undefined)
        .map(fund => `${fund.financialInstitutionId}:${fund.accountId}`)
    );

    let checking = 0;
    let savings = 0;
    let credit = 0;
    let investment = 0;
    let loan = 0;
    let other = 0;

    // Process accounts - only include accounts NOT tracked by funds
    institutions.forEach(institution => {
      institution.accounts.forEach(account => {
        const accountKey = `${institution.institutionId}:${account.accountId}`;

        // Skip accounts that are tracked by funds
        if (trackedAccountIds.has(accountKey)) {
          return;
        }

        const balance = account.balance;

        switch (account.accountType) {
          case AccountType.Checking:
            checking += balance;
            break;
          case AccountType.Savings:
            // Savings accounts not tracked by funds
            savings += balance;
            break;
          case AccountType.Credit:
            credit -= balance; // Credit is a liability (negative)
            break;
          case AccountType.Investment:
            // Investment accounts not tracked by funds
            investment += balance;
            break;
          case AccountType.Loan:
            loan -= balance; // Loan is a liability (negative)
            break;
          case AccountType.Other:
            other += balance;
            break;
        }
      });
    });

    // Process all funds (manual and account-based)
    funds.forEach(fund => {
      let fundBalance = 0;

      if (fund.accountId === undefined) {
        // Manual fund - use currentBalance
        fundBalance = fund.currentBalance ?? 0;
      } else {
        // Account-based fund - get balance from the tracked account
        const institution = institutions.find(inst => inst.institutionId === fund.financialInstitutionId);
        if (institution) {
          const account = institution.accounts.find(acc => acc.accountId === fund.accountId);
          if (account) {
            fundBalance = account.balance;
          }
        }
      }

      // Add fund balance to appropriate category
      if (fund.type === FundType.Saving) {
        savings += fundBalance;
      } else if (fund.type === FundType.Investment) {
        investment += fundBalance;
      }
    });

    const total = checking + savings + investment + other + loan + credit;

    return {
      checking,
      savings,
      credit,
      investment,
      loan,
      other,
      total,
    };
  },
};
