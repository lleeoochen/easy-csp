import { useCallback, useEffect } from "react";
import { AccountType } from "@easy-csp/shared-types";
import { fetchFinancialInstitutions, refreshFinancialInstitutions } from "../../redux/thunks/financialInstitutionThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { getFinancialInstitutionStatusDisplay } from "../../utils/statusUtils";
import { Card, CardHeader } from "../../components/common/card";
import { Button } from "../../components/common/button";

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
  const dispatch = useAppDispatch();
  const financialInstitutionState = useAppSelector(state => state.financialInstitution);
  const { institutions, isLoading, errorMessage } = financialInstitutionState.fetchFinancialInstitutions;

  const dispatchFetchFinancialInstitutions = useCallback(async () => {
    dispatch(fetchFinancialInstitutions());
  }, [dispatch]);

  useEffect(() => {
    // Load financial institutions when the component mounts
    dispatchFetchFinancialInstitutions();
  }, [dispatchFetchFinancialInstitutions]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-lg text-center font-bold mb-4">Financial Institutions</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading institutions...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-lg text-center font-bold mb-4">Financial Institutions</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading institutions: {errorMessage}</p>
          <button
            onClick={dispatchFetchFinancialInstitutions}
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
      <h1 className="text-lg text-center font-bold mb-6">Financial Institutions</h1>

      {institutions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No financial institutions connected yet.</p>
          <p className="text-md text-gray-500">Connect your bank accounts to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 justify-center">
          <Button onClick={() => dispatch(refreshFinancialInstitutions())} variant="default" className="bg-white hover:bg-white/70 active:bg-gray-300">Sync Accounts</Button>
          {institutions.map((institution, index) => {
            const statusDisplay = getFinancialInstitutionStatusDisplay(institution.status);
            return (
              <Card key={`${institution.institutionId}-${index}`}>
                {/* Institution Header */}
                <CardHeader className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {institution.institutionName}
                      </h2>
                      <p className="text-md text-gray-600 mt-1">
                        Last synced: {formatDate(institution.lastSyncTimestamp)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </CardHeader>

                {/* Accounts List */}
                <div className="p-2">
                  {institution.accounts.length === 0 ? (
                    <p className="text-gray-500 text-md">No accounts found for this institution.</p>
                  ) : (
                    <div className="space-y-3">
                      {institution.accounts.map((account, accountIndex) => (
                        <div
                          key={`${account.accountId}-${accountIndex}`}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                            <p className="text-md text-gray-600">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinancialInstitutionsPage;
