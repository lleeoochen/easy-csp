"use strict";
/**
 * Migration Helper - Run this once to migrate your data
 *
 * This is a one-time utility to migrate from nested accounts to normalized accounts.
 * After migration is complete, this file can be deleted.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.displayRenameResults = exports.renameAccountsCollection = exports.displayMigrationResults = exports.runSimpleMigration = void 0;
var functions_1 = require("firebase/functions");
/**
 * Run the simple migration (no backward compatibility)
 *
 * WARNING: This will DELETE the entire funds collection!
 * Only use on test data.
 */
function runSimpleMigration() {
    return __awaiter(this, void 0, void 0, function () {
        var functions, migrate, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting migration...');
                    functions = (0, functions_1.getFunctions)();
                    migrate = (0, functions_1.httpsCallable)(functions, 'migrateUserAccountsSimple');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, migrate({})];
                case 2:
                    result = _a.sent();
                    console.log('✅ Migration completed!');
                    console.log('📊 Results:', result.data);
                    if (result.data.errors.length > 0) {
                        console.warn('⚠️ Errors encountered:', result.data.errors);
                    }
                    return [2 /*return*/, result.data];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Migration failed:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.runSimpleMigration = runSimpleMigration;
/**
 * Helper to display migration results in a user-friendly format
 */
function displayMigrationResults(result) {
    var lines = [
        '✅ Migration Completed!',
        '',
        '📊 Summary:',
        "   \u2022 Accounts migrated: ".concat(result.accountsMigrated),
        "   \u2022 Transactions updated: ".concat(result.transactionsUpdated),
        "   \u2022 Funds deleted: ".concat(result.fundsDeleted),
        "   \u2022 Institutions cleaned: ".concat(result.institutionsCleaned),
    ];
    if (result.errors.length > 0) {
        lines.push('');
        lines.push("\u26A0\uFE0F Errors (".concat(result.errors.length, "):"));
        result.errors.forEach(function (error, index) {
            lines.push("   ".concat(index + 1, ". ").concat(error));
        });
    }
    else {
        lines.push('');
        lines.push('🎉 No errors!');
    }
    return lines.join('\n');
}
exports.displayMigrationResults = displayMigrationResults;
/**
 * Rename 'accounts' collection to 'financialAccounts'
 *
 * This is a one-time operation to update the collection name.
 */
function renameAccountsCollection() {
    return __awaiter(this, void 0, void 0, function () {
        var functions, rename, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting collection rename...');
                    functions = (0, functions_1.getFunctions)();
                    rename = (0, functions_1.httpsCallable)(functions, 'renameAccountsCollection');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, rename({})];
                case 2:
                    result = _a.sent();
                    console.log('✅ Rename completed!');
                    console.log('📊 Results:', result.data);
                    if (result.data.errors.length > 0) {
                        console.warn('⚠️ Errors encountered:', result.data.errors);
                    }
                    return [2 /*return*/, result.data];
                case 3:
                    error_2 = _a.sent();
                    console.error('❌ Rename failed:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.renameAccountsCollection = renameAccountsCollection;
/**
 * Helper to display rename results in a user-friendly format
 */
function displayRenameResults(result) {
    var lines = [
        '✅ Collection Rename Completed!',
        '',
        '📊 Summary:',
        "   \u2022 Accounts copied: ".concat(result.accountsCopied),
        "   \u2022 Old accounts deleted: ".concat(result.accountsDeleted),
    ];
    if (result.errors.length > 0) {
        lines.push('');
        lines.push("\u26A0\uFE0F Errors (".concat(result.errors.length, "):"));
        result.errors.forEach(function (error, index) {
            lines.push("   ".concat(index + 1, ". ").concat(error));
        });
    }
    else {
        lines.push('');
        lines.push('🎉 No errors!');
    }
    return lines.join('\n');
}
exports.displayRenameResults = displayRenameResults;
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
    window.runMigration = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, runSimpleMigration()];
                case 1:
                    result = _a.sent();
                    console.log(displayMigrationResults(result));
                    return [2 /*return*/, result];
                case 2:
                    error_3 = _a.sent();
                    console.error('Migration failed:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.renameAccountsCollection = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, renameAccountsCollection()];
                case 1:
                    result = _a.sent();
                    console.log(displayRenameResults(result));
                    return [2 /*return*/, result];
                case 2:
                    error_4 = _a.sent();
                    console.error('Rename failed:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    console.log('💡 Migration helper loaded!');
    console.log('   • Run window.runMigration() to migrate accounts');
    console.log('   • Run window.renameAccountsCollection() to rename collection');
}
