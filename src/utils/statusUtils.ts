import { FinancialInstitutionStatus } from "@easy-csp/shared-types";

// Helper function to get status display name and color
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
    default:
      return { text: 'Unknown', color: 'text-gray-600 bg-gray-50' };
  }
};

// Helper function to get status display name and color
export const getBudgetStatusDisplay = (underBudget: boolean) => {
  return underBudget ? 'text-green-600' : 'text-red-600';
};
