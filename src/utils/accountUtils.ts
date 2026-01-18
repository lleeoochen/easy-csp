import type { FinancialInstitution } from "@easy-csp/shared-types";

/**
 * Generates a consistent account option value for form selectors
 * @param institutionId - The financial institution ID
 * @param accountId - The account ID
 * @returns A string in the format "institutionId-accountId"
 */
export function generateAccountOptionValue(institutionId: string, accountId: string): string {
  return `${institutionId}-${accountId}`;
}

/**
 * Parses an account option value back into its components
 * @param optionValue - The option value in the format "institutionId-accountId"
 * @returns An object containing institutionId and accountId
 */
export function parseAccountOptionValue(optionValue: string): { institutionId: string; accountId: string } {
  const [institutionId, accountId] = optionValue.split('-');
  return { institutionId, accountId };
}

/**
 * Generates account options for form selectors from financial institutions
 * @param institutions - Array of financial institutions
 * @returns Array of account options with value, label, and metadata
 */
export function generateAccountOptions(institutions: FinancialInstitution[]) {
  return institutions.flatMap((institution) =>
    institution.accounts.map(account => ({
      value: generateAccountOptionValue(institution.institutionId, account.accountId),
      label: `${institution.institutionName} - ${account.accountName}`,
      institutionId: institution.institutionId,
      accountId: account.accountId,
    }))
  );
}

/**
 * Finds the account option value for a given saving target
 * @param savingTarget - The saving target with institutionId and accountId
 * @returns The account option value string
 */
export function getAccountOptionValueForSavingTarget(
  savingTarget: { financialInstitutionId: string; accountId: string }
): string {
  return generateAccountOptionValue(savingTarget.financialInstitutionId, savingTarget.accountId);
}
