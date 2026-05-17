import type { FinancialInstitution } from '@easy-csp/shared-types';
import { PlaidErrorCode, RETRY_SYNC_ERRORS, RECONNECT_REQUIRED_ERRORS, REMOVE_INSTITUTION_ERRORS, FinancialInstitutionStatus } from '@easy-csp/shared-types';
import { Button } from '@/components/common/button';
import { AccountListCard } from './AccountListCard';
import { getFinancialInstitutionStatusDisplay, getPlaidErrorMessage } from '@/utils/statusUtils';
import { useRetrySyncInstitution, useRemoveInstitution } from '@/hooks/api/useFinancialInstitutions';
import LinkFinancialInstitutionButton from '@/components/LinkFinancialInstitutionButton';
import { AlertTriangleIcon, Trash2 } from 'lucide-react';
import type { UI_FinancialAccount } from '@/types/uiTypes';

interface AccountListByInstitutionCardsProps {
  institutions: FinancialInstitution[];
  accountsByInstitution: Record<string, UI_FinancialAccount[]>;
  archivedAccountsByInstitution?: Record<string, UI_FinancialAccount[]>;
  onDelete: (account: UI_FinancialAccount) => void;
  onDeleteInstitution?: (institution: FinancialInstitution, accounts: UI_FinancialAccount[]) => void;
}

const InstitutionErrorBanner = ({ institution }: { institution: FinancialInstitution }) => {
  const { mutate: retrySync, isPending: isRetrying } = useRetrySyncInstitution();
  const { mutate: removeInstitution, isPending: isRemoving } = useRemoveInstitution();

  // Show banner for both InstitutionError and SyncFailed statuses
  if (
    institution.status !== FinancialInstitutionStatus.InstitutionError &&
    institution.status !== FinancialInstitutionStatus.SyncFailed
  ) {
    return null;
  }

  const docId = institution.docId!;
  let message: string;
  let showRetryButton = false;
  let showReconnectButton = false;
  let showRemoveButton = false;

  // Handle InstitutionError with Plaid error code
  if (institution.status === FinancialInstitutionStatus.InstitutionError && institution.plaidErrorCode) {
    const errorCode = institution.plaidErrorCode as PlaidErrorCode;
    message = getPlaidErrorMessage(errorCode);
    showRetryButton = RETRY_SYNC_ERRORS.has(errorCode);
    showReconnectButton = RECONNECT_REQUIRED_ERRORS.has(errorCode);
    showRemoveButton = REMOVE_INSTITUTION_ERRORS.has(errorCode);
  } else {
    // Handle SyncFailed or InstitutionError without error code
    message = institution.errorMessage || "Sync failed. Please try again.";
    showRetryButton = true; // Always offer retry for generic sync failures
  }

  return (
    <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <AlertTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {institution.errorMessage && institution.plaidErrorCode && (
          <p className="mt-1 text-xs text-red-600">Technical details: {institution.errorMessage}</p>
        )}
        <div className="flex gap-2 mt-2">
          {showRetryButton && (
            <Button variant="primary" onClick={() => retrySync(docId)} disabled={isRetrying}>
              {isRetrying ? "Retrying..." : "Retry Sync"}
            </Button>
          )}
          {showReconnectButton && (
            <LinkFinancialInstitutionButton
              buttonText="Reconnect"
              institutionDocId={docId}
              institutionId={institution.institutionId}
            />
          )}
          {showRemoveButton && (
            <Button variant="primary" onClick={() => removeInstitution(docId)} disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AccountListByInstitutionCards = ({
  institutions,
  accountsByInstitution,
  archivedAccountsByInstitution,
  onDelete,
  onDeleteInstitution,
}: AccountListByInstitutionCardsProps) => {
  if (institutions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No financial institutions connected yet.</p>
        <p className="text-gray-500">Connect your bank accounts to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {institutions.map((institution, index) => {
          const statusDisplay = getFinancialInstitutionStatusDisplay(institution.status);
          const institutionAccounts = accountsByInstitution[institution.institutionId] || [];
          const archivedAccounts = archivedAccountsByInstitution?.[institution.institutionId] || [];

          return (
            <AccountListCard
              key={`${institution.institutionId}-${index}`}
              title={institution.institutionName}
              accounts={institutionAccounts}
              archivedAccounts={archivedAccounts}
              onDelete={onDelete}
              headerContent={
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </span>
                  {onDeleteInstitution && (
                    <Button
                      variant='icon'
                      onClick={() => onDeleteInstitution(institution, institutionAccounts)}
                      className="p-1 text-muted-foreground hover:text-red-600 transition-colors flex items-center"
                      title="Remove institution"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              }
              subtitle={<InstitutionErrorBanner institution={institution} />}
              emptyMessage="No accounts found for this institution."
            />
          );
        })}
      </div>
    </div>
  );
};
