import { useCallback, useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { FinancialInstitution } from "@easy-csp/shared-types";
import { AccountType, FinancialInstitutionStatus } from "@easy-csp/shared-types";

// Helper function to get account type display name
const getAccountTypeDisplay = (accountType: AccountType): string => {
  switch (accountType) {
    case AccountType.Checking:
      return 'Checking';
    case AccountType.Savings:
      return 'Savings';
    case AccountType.Credit:
      return 'Credit Card';
    case AccountType.Investment:
      return 'Investment';
    case AccountType.Loan:
      return 'Loan';
    case AccountType.Other:
      return 'Other';
    default:
      return 'Unknown';
  }
};

// Helper function to get status display name and color
const getStatusDisplay = (status: FinancialInstitutionStatus) => {
  switch (status) {
    case FinancialInstitutionStatus.Active:
      return { text: 'Active', color: 'text-green-600 bg-green-50' };
    case FinancialInstitutionStatus.Inactive:
      return { text: 'Inactive', color: 'text-gray-600 bg-gray-50' };
    case FinancialInstitutionStatus.AwaitSync:
      return { text: 'Awaiting Sync', color: 'text-yellow-600 bg-yellow-50' };
    case FinancialInstitutionStatus.SyncFailed:
      return { text: 'Sync Failed', color: 'text-red-600 bg-red-50' };
    default:
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-50' };
  }
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format date
const formatDate = (date: Date): string => {
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
};

const FinancialInstitutionsPage = () => {
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const functions = getFunctions();

  const fetchFinancialInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listFinancialInstitutionsFunction = httpsCallable<unknown, FinancialInstitution[]>(
        functions,
        "listFinancialInstitutions"
      );
      const result = await listFinancialInstitutionsFunction();
      console.log(result.data);
      setInstitutions(result.data);
    } catch (error) {
      console.error("Error fetching financial institutions:", error);
      setError(error instanceof Error ? error : new Error("Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [functions]);

  useEffect(() => {
    fetchFinancialInstitutions();
  }, [fetchFinancialInstitutions]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Financial Institutions</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading institutions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Financial Institutions</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading institutions: {error.message}</p>
          <button
            onClick={fetchFinancialInstitutions}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Institutions</h1>
        <button
          onClick={fetchFinancialInstitutions}
          className="px-4 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 text-sm"
        >
          Refresh
        </button>
      </div>

      {institutions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No financial institutions connected yet.</p>
          <p className="text-sm text-gray-500">Connect your bank accounts to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {institutions.map((institution, index) => {
            const statusDisplay = getStatusDisplay(institution.status);
            return (
              <div key={`${institution.institutionId}-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Institution Header */}
                <div className="bg-amber-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {institution.institutionName}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Last synced: {formatDate(institution.lastSyncTimestamp)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>

                {/* Accounts List */}
                <div className="p-2">
                  {institution.accounts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No accounts found for this institution.</p>
                  ) : (
                    <div className="space-y-3">
                      {institution.accounts.map((account, accountIndex) => (
                        <div
                          key={`${account.accountId}-${accountIndex}`}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                            <p className="text-sm text-gray-600">
                              {getAccountTypeDisplay(account.accountType)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(account.balance)}
                            </p>
                            <p className="text-xs text-gray-500">Current Balance</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinancialInstitutionsPage;
