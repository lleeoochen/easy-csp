import { AccountType, PlaidErrorCode, RETRY_SYNC_ERRORS, RECONNECT_REQUIRED_ERRORS, REMOVE_INSTITUTION_ERRORS, FinancialInstitutionStatus } from "@easy-csp/shared-types";
import type { FinancialInstitution } from "@easy-csp/shared-types";
import { useFinancialInstitutions, useRefreshFinancialInstitutions, useRetrySyncInstitution, useRemoveInstitution } from "../../hooks/api/useFinancialInstitutions";
import { getFinancialInstitutionStatusDisplay, getPlaidErrorMessage } from "../../utils/statusUtils";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { Button } from "../../components/common/button";
import { BackButton } from "../../components/common/BackButton";
import { Page } from "../../components/Page";
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react";
import moment from "moment";
import LinkFinancialInstitutionButton from "../../components/LinkFinancialInstitutionButton";

const getAccountTypeDisplay = (accountType: AccountType): string => {
  switch (accountType) {
    case AccountType.Checking: return 'Checking';
    case AccountType.Savings: return 'Savings';
    case AccountType.Credit: return 'Credit Card';
    case AccountType.Investment: return 'Investment';
    case AccountType.Loan: return 'Loan';
    case AccountType.Other: return 'Other';
    default: return 'Unknown';
  }
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const InstitutionErrorBanner = ({ institution }: { institution: FinancialInstitution }) => {
  const { mutate: retrySync, isPending: isRetrying } = useRetrySyncInstitution();
  const { mutate: removeInstitution, isPending: isRemoving } = useRemoveInstitution();

  if (institution.status !== FinancialInstitutionStatus.InstitutionError || !institution.plaidErrorCode) {
    return null;
  }

  const errorCode = institution.plaidErrorCode as PlaidErrorCode;
  const message = getPlaidErrorMessage(errorCode);
  const docId = institution.docId!;

  return (
    <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 pb-2">
      <AlertTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        <div className="flex gap-2 mt-2">
          {RETRY_SYNC_ERRORS.has(errorCode) && (
            <Button variant="primary" onClick={() => retrySync(docId)} disabled={isRetrying}>
              {isRetrying ? "Retrying..." : "Retry Sync"}
            </Button>
          )}
          {RECONNECT_REQUIRED_ERRORS.has(errorCode) && (
            <LinkFinancialInstitutionButton
              buttonText="Reconnect"
              institutionDocId={docId}
              institutionId={institution.institutionId}
            />
          )}
          {REMOVE_INSTITUTION_ERRORS.has(errorCode) && (
            <Button variant="primary" onClick={() => removeInstitution(docId)} disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const FinancialInstitutionsPage = () => {
  const { data: institutions = [], isLoading, error } = useFinancialInstitutions();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshFinancialInstitutions();

  if (isLoading) {
    return (
      <Page title="Financial Institutions">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading institutions...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Financial Institutions">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading institutions: {error.message}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Financial Institutions" maxWidth="full">
      {institutions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No financial institutions connected yet.</p>
          <p className="text-gray-500">Connect your bank accounts to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 justify-center">
          <div className="flex justify-between">
            <BackButton to="/settings" />
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="bg-white hover:bg-white/70 active:bg-gray-300 ml-auto"
                onClick={() => refresh()}
                disabled={isRefreshing}
              >
                <RefreshCwIcon />
              </Button>
              <LinkFinancialInstitutionButton />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {institutions.map((institution, index) => {
              const statusDisplay = getFinancialInstitutionStatusDisplay(institution.status);
              return (
                <Card key={`${institution.institutionId}-${index}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg">{institution.institutionName}</h2>
                        <p className="text-sm text-gray-300">
                          Last synced: {moment(new Date(institution.lastSyncTimestamp)).fromNow()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <InstitutionErrorBanner institution={institution} />
                    {institution.accounts.length === 0 ? (
                      <p className="text-gray-500 text-md">No accounts found for this institution.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {institution.accounts.map((account, accountIndex) => (
                          <div
                            key={`${account.accountId}-${accountIndex}`}
                            className="flex justify-between items-center rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                              <p className="text-gray-600">{getAccountTypeDisplay(account.accountType)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(account.balance)}
                              </p>
                              <p className="text-xs text-gray-500">Current Balance</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
};

export default FinancialInstitutionsPage;
