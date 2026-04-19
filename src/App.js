"use strict";
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
var ConsciousSpendingPlanPage_1 = require("./pages/consciousSpendingPlan/ConsciousSpendingPlanPage");
var TransactionsPage_1 = require("./pages/transactions/TransactionsPage");
var TransactionEditPage_1 = require("./pages/transactions/TransactionEditPage");
var RulesPage_1 = require("./pages/rules/RulesPage");
var RuleEditPage_1 = require("./pages/rules/RuleEditPage");
var SettingsPage_1 = require("./pages/SettingsPage");
var TravelModeEditPage_1 = require("./pages/travelMode/TravelModeEditPage");
var NetWorthPage_1 = require("./pages/netWorth/NetWorthPage");
var AddAccountPage_1 = require("./pages/netWorth/AddAccountPage");
var AccountEditPage_1 = require("./pages/netWorth/AccountEditPage");
var lucide_react_1 = require("lucide-react");
var app_1 = require("firebase/app");
var functions_1 = require("firebase/functions");
var firestore_1 = require("firebase/firestore");
var auth_1 = require("firebase/auth");
var SignInPage_1 = require("./pages/SignInPage");
var useAuthState_1 = require("./hooks/useAuthState");
var Tabs_1 = require("./components/Tabs");
var envUtils_1 = require("./utils/envUtils");
var RequireMfaEnrollment_1 = require("./components/RequireMfaEnrollment");
var EmailVerification_1 = require("./components/auth/EmailVerification");
var shared_types_1 = require("@easy-csp/shared-types");
var react_1 = require("react");
// Import migration helper for easy access in console
require("./utils/migrationHelper");
var firebaseConfig = {
    apiKey: "AIzaSyBERcnPQeqTU4VrJryfWAiqaFe4BPxDRXQ",
    authDomain: "easycsp.firebaseapp.com",
    projectId: "easycsp",
    storageBucket: "easycsp.firebasestorage.app",
    messagingSenderId: "124310563918",
    appId: "1:124310563918:web:86e820b2b6a1749638671f",
    measurementId: "G-MYW234KVD3"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var firestore = (0, firestore_1.getFirestore)(app);
var functions = (0, functions_1.getFunctions)(app);
// const auth = getAuth(app);
// Connect to emulators in development
if (envUtils_1.isDevEnvironment) {
    (0, firestore_1.connectFirestoreEmulator)(firestore, "127.0.0.1", 8080);
    (0, functions_1.connectFunctionsEmulator)(functions, "127.0.0.1", 5001);
    // connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
function App() {
    var _this = this;
    var _a = (0, useAuthState_1.useAuthState)(), signedIn = _a.signedIn, loading = _a.loading, userId = _a.userId;
    var _b = (0, react_1.useState)(null), mfaEnabled = _b[0], setMfaEnabled = _b[1];
    var _c = (0, react_1.useState)(null), emailVerified = _c[0], setEmailVerified = _c[1];
    var _d = (0, react_1.useState)(true), checkingMfa = _d[0], setCheckingMfa = _d[1];
    (0, react_1.useEffect)(function () {
        var checkMfaStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var auth, currentUser, firestore_2, userDoc, userData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!signedIn || !userId) {
                            setCheckingMfa(false);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        auth = (0, auth_1.getAuth)();
                        currentUser = auth.currentUser;
                        // Check email verification status
                        setEmailVerified((currentUser === null || currentUser === void 0 ? void 0 : currentUser.emailVerified) || false);
                        firestore_2 = (0, firestore_1.getFirestore)();
                        return [4 /*yield*/, (0, firestore_1.getDoc)((0, firestore_1.doc)(firestore_2, shared_types_1.USERS_COLLECTION, userId))];
                    case 2:
                        userDoc = _a.sent();
                        userData = userDoc.data();
                        setMfaEnabled((userData === null || userData === void 0 ? void 0 : userData.mfaEnabled) || false);
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error checking MFA status:', error_1);
                        setMfaEnabled(false);
                        return [3 /*break*/, 5];
                    case 4:
                        setCheckingMfa(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        checkMfaStatus();
    }, [signedIn, userId]);
    if (loading || checkingMfa) {
        return (<div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication status...</p>
      </div>);
    }
    // Show email verification screen if user is signed in but email not verified
    if (signedIn && emailVerified === false) {
        return <EmailVerification_1.EmailVerification />;
    }
    // Show MFA enrollment if user is signed in, email verified, but hasn't enabled MFA
    if (signedIn && emailVerified === true && mfaEnabled === false) {
        return <RequireMfaEnrollment_1.RequireMfaEnrollment />;
    }
    return (<div className="app-container bg-background">
      {signedIn ? (<Tabs_1.Tabs paths={[
                {
                    path: "/",
                    name: "Spending",
                    icon: lucide_react_1.BarChart3,
                    element: <ConsciousSpendingPlanPage_1["default"] />,
                    showInNav: true
                },
                {
                    path: "/net-worth",
                    name: "Net Worth",
                    icon: lucide_react_1.TrendingUp,
                    element: <NetWorthPage_1["default"] />,
                    showInNav: true
                },
                {
                    path: "/net-worth/add-account",
                    name: "Add Account",
                    icon: lucide_react_1.TrendingUp,
                    element: <AddAccountPage_1["default"] />,
                    showInNav: false
                },
                {
                    path: "/net-worth/account/:accountId/edit",
                    name: "Edit Account",
                    icon: lucide_react_1.TrendingUp,
                    element: <AccountEditPage_1["default"] />,
                    showInNav: false
                },
                {
                    path: "/transactions",
                    name: "Transactions",
                    icon: lucide_react_1.DollarSign,
                    element: <TransactionsPage_1["default"] />,
                    showInNav: true
                },
                {
                    path: "/transactions/:id/edit",
                    name: "Edit Transaction",
                    icon: lucide_react_1.DollarSign,
                    element: <TransactionEditPage_1["default"] />,
                    showInNav: false
                },
                {
                    path: "/rules",
                    name: "Rules",
                    icon: lucide_react_1.Filter,
                    element: <RulesPage_1["default"] />,
                    showInNav: false
                },
                {
                    path: "/rules/:index/edit",
                    name: "Edit Rule",
                    icon: lucide_react_1.Filter,
                    element: <RuleEditPage_1["default"] />,
                    showInNav: false
                },
                {
                    path: "/settings",
                    name: "Settings",
                    icon: lucide_react_1.Settings,
                    element: <SettingsPage_1["default"] />,
                    showInNav: true
                },
                {
                    path: "/travel-mode/edit",
                    name: "Travel Mode",
                    icon: lucide_react_1.Settings,
                    element: <TravelModeEditPage_1["default"] />,
                    showInNav: false
                },
            ]}/>) : (<SignInPage_1["default"] />)}
    </div>);
}
exports["default"] = App;
