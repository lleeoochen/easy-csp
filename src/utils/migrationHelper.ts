/**
 * Migration Helper - Run this once to migrate your data
 *
 * This is a one-time utility to migrate from nested accounts to normalized accounts.
 * After migration is complete, this file can be deleted.
 */

import { httpsCallable, getFunctions } from 'firebase/functions';

interface MigrationResult {
  accountsMigrated: number;
  transactionsUpdated: number;
  fundsDeleted: number;
  institutionsCleaned: number;
  errors: string[];
}

interface RenameResult {
  accountsCopied: number;
  accountsDeleted: number;
  errors: string[];
}

/**
 * Run the simple migration (no backward compatibility)
 *
 * WARNING: This will DELETE the entire funds collection!
 * Only use on test data.
 */
export async function runSimpleMigration(): Promise<MigrationResult> {
  console.log('🚀 Starting migration...');

  const functions = getFunctions();
  const migrate = httpsCallable<Record<string, never>, MigrationResult>(
    functions,
    'migrateUserAccountsSimple'
  );

  try {
    const result = await migrate({});

    console.log('✅ Migration completed!');
    console.log('📊 Results:', result.data);

    if (result.data.errors.length > 0) {
      console.warn('⚠️ Errors encountered:', result.data.errors);
    }

    return result.data;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Helper to display migration results in a user-friendly format
 */
export function displayMigrationResults(result: MigrationResult): string {
  const lines = [
    '✅ Migration Completed!',
    '',
    '📊 Summary:',
    `   • Accounts migrated: ${result.accountsMigrated}`,
    `   • Transactions updated: ${result.transactionsUpdated}`,
    `   • Funds deleted: ${result.fundsDeleted}`,
    `   • Institutions cleaned: ${result.institutionsCleaned}`,
  ];

  if (result.errors.length > 0) {
    lines.push('');
    lines.push(`⚠️ Errors (${result.errors.length}):`);
    result.errors.forEach((error, index) => {
      lines.push(`   ${index + 1}. ${error}`);
    });
  } else {
    lines.push('');
    lines.push('🎉 No errors!');
  }

  return lines.join('\n');
}

/**
 * Rename 'accounts' collection to 'financialAccounts'
 *
 * This is a one-time operation to update the collection name.
 */
export async function renameAccountsCollection(): Promise<RenameResult> {
  console.log('🚀 Starting collection rename...');

  const functions = getFunctions();
  const rename = httpsCallable<Record<string, never>, RenameResult>(
    functions,
    'renameAccountsCollection'
  );

  try {
    const result = await rename({});

    console.log('✅ Rename completed!');
    console.log('📊 Results:', result.data);

    if (result.data.errors.length > 0) {
      console.warn('⚠️ Errors encountered:', result.data.errors);
    }

    return result.data;
  } catch (error) {
    console.error('❌ Rename failed:', error);
    throw error;
  }
}

/**
 * Helper to display rename results in a user-friendly format
 */
export function displayRenameResults(result: RenameResult): string {
  const lines = [
    '✅ Collection Rename Completed!',
    '',
    '📊 Summary:',
    `   • Accounts copied: ${result.accountsCopied}`,
    `   • Old accounts deleted: ${result.accountsDeleted}`,
  ];

  if (result.errors.length > 0) {
    lines.push('');
    lines.push(`⚠️ Errors (${result.errors.length}):`);
    result.errors.forEach((error, index) => {
      lines.push(`   ${index + 1}. ${error}`);
    });
  } else {
    lines.push('');
    lines.push('🎉 No errors!');
  }

  return lines.join('\n');
}

/**
 * Quick test to run migration from browser console
 *
 * Usage:
 *   1. Open browser console (F12)
 *   2. Run: window.runMigration()
 *   3. Run: window.renameAccountsCollection()
 */
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).runMigration = async () => {
    try {
      const result = await runSimpleMigration();
      console.log(displayMigrationResults(result));
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).renameAccountsCollection = async () => {
    try {
      const result = await renameAccountsCollection();
      console.log(displayRenameResults(result));
      return result;
    } catch (error) {
      console.error('Rename failed:', error);
      throw error;
    }
  };

  console.log('💡 Migration helper loaded!');
  console.log('   • Run window.runMigration() to migrate accounts');
  console.log('   • Run window.renameAccountsCollection() to rename collection');
}
