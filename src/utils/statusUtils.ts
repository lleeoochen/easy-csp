import { FinancialInstitutionStatus, PlaidErrorCode } from "@easy-csp/shared-types";

export const getFinancialInstitutionStatusDisplay = (status: FinancialInstitutionStatus) => {
  switch (status) {
    case FinancialInstitutionStatus.Active:
      return { text: 'Active', color: 'text-green-600 bg-green-50' };
    case FinancialInstitutionStatus.Inactive:
      return { text: 'Inactive', color: 'text-gray-600 bg-gray-50' };
    case FinancialInstitutionStatus.AwaitSync:
      return { text: 'Awaiting Sync', color: 'text-yellow-600 bg-yellow-50' };
    case FinancialInstitutionStatus.SyncFailed:
      return { text: 'Sync Failed', color: 'text-red-600 bg-red-50' };
    case FinancialInstitutionStatus.InstitutionError:
      return { text: 'Sync Failed', color: 'text-red-600 bg-red-50' };
    default:
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-50' };
  }
};

export const getPlaidErrorMessage = (code: PlaidErrorCode): string => {
  switch (code) {
    // Retryable
    case PlaidErrorCode.InstitutionDown:
    case PlaidErrorCode.InstitutionNotResponding:
    case PlaidErrorCode.InstitutionNotAvailable:
      return "This bank is temporarily unavailable. Try again later.";
    case PlaidErrorCode.ProductNotReady:
      return "Data isn't ready yet. Try syncing again in a moment.";

    // Reconnect required
    case PlaidErrorCode.ItemLoginRequired:
      return "Your login credentials have changed or expired. Please reconnect.";
    case PlaidErrorCode.NoAccounts:
      return "No accessible accounts were found. Please reconnect.";
    case PlaidErrorCode.AccessNotGranted:
      return "Access to your accounts was not granted. Please reconnect.";

    // Remove institution
    case PlaidErrorCode.ItemNotFound:
      return "This connection no longer exists. Please remove it and reconnect.";

    // Informational only
    case PlaidErrorCode.ItemLocked:
      return "Your account is locked. Visit your bank's website to unlock it, then reconnect.";
    case PlaidErrorCode.PasswordResetRequired:
      return "Your bank requires a password reset. Visit your bank's website, then reconnect.";
    case PlaidErrorCode.UserSetupRequired:
      return "Your bank requires you to complete account setup. Visit your bank's website, then reconnect.";
    case PlaidErrorCode.InstitutionNoLongerSupported:
      return "This bank is no longer supported by Plaid.";
    case PlaidErrorCode.UnsupportedResponse:
      return "Your bank returned unexpected data. This requires Plaid support to resolve.";
    case PlaidErrorCode.UnauthorizedInstitution:
    case PlaidErrorCode.InstitutionRegistrationRequired:
    case PlaidErrorCode.InstitutionNotEnabledInEnvironment:
      return "This bank connection is not available at this time.";
    case PlaidErrorCode.ProductsNotSupported:
    case PlaidErrorCode.ItemNotSupported:
      return "This account type is not supported.";

    default:
      return "An unexpected error occurred with this connection.";
  }
};

export const getBudgetStatusDisplay = (underBudget: boolean) => {
  return underBudget ? 'text-green-600' : 'text-red-600';
};
