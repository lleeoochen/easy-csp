import ConsciousSpendingPlanPage from "./pages/consciousSpendingPlan/ConsciousSpendingPlanPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import TransactionEditPage from "./pages/transactions/TransactionEditPage";
import RulesPage from "./pages/rules/RulesPage";
import RuleEditPage from "./pages/rules/RuleEditPage";
import SettingsPage from "./pages/SettingsPage";
import TravelModeEditPage from "./pages/travelMode/TravelModeEditPage";
import NetWorthPage from "./pages/netWorth/NetWorthPage";
import AddAccountPage from "./pages/netWorth/AddAccountPage";
import AccountEditPage from "./pages/netWorth/AccountEditPage";
import ManageAccountsPage from "./pages/netWorth/ManageAccountsPage";
import { DollarSign, BarChart3, Settings, Filter, TrendingUp, Target } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getAuth, multiFactor } from "firebase/auth";
import SignInPage from "./pages/SignInPage";
import { useAuthState } from "./hooks/useAuthState";
import { Tabs } from "./components/Tabs";
import { isDevEnvironment } from "./utils/envUtils";
import { RequireMfaEnrollment } from "./components/RequireMfaEnrollment";
import { EmailVerification } from "./components/auth/EmailVerification";
import { FundsPage } from "@/pages/funds/FundsPage";
import AddFundPage from "@/pages/funds/AddFundPage";
import EditFundPage from "@/pages/funds/EditFundPage";
import { OfflineBanner } from "./components/OfflineBanner";

const firebaseConfig = {
  apiKey: "AIzaSyBERcnPQeqTU4VrJryfWAiqaFe4BPxDRXQ",
  authDomain: "easycsp.firebaseapp.com",
  projectId: "easycsp",
  storageBucket: "easycsp.firebasestorage.app",
  messagingSenderId: "124310563918",
  appId: "1:124310563918:web:86e820b2b6a1749638671f",
  measurementId: "G-MYW234KVD3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const functions = getFunctions(app);
// const auth = getAuth(app);

// Connect to emulators in development
if (isDevEnvironment) {
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  // connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

function App() {
  const { signedIn, loading } = useAuthState();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const emailVerified = signedIn ? (currentUser?.emailVerified || false) : null;
  const mfaEnrolled = signedIn && currentUser ? multiFactor(currentUser).enrolledFactors.length > 0 : null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication status...</p>
      </div>
    );
  }

  // Show email verification screen if user is signed in but email not verified
  if (signedIn && emailVerified === false) {
    return <EmailVerification />;
  }

  // Show MFA enrollment if user is signed in, email verified, but no MFA factors enrolled
  if (signedIn && emailVerified === true && !mfaEnrolled) {
    return <RequireMfaEnrollment />;
  }

  return (
    <div className="app-container bg-background">
      <OfflineBanner />
      {signedIn ? (
        <Tabs
          paths={[
            {
              path: "/",
              name: "Spending",
              icon: BarChart3,
              element: <ConsciousSpendingPlanPage />,
              showInNav: true
            },
            {
              path: "/funds",
              name: "Funds",
              icon: Target,
              element: <FundsPage />,
              showInNav: true
            },
            {
              path: "/funds/add",
              name: "Add Fund",
              icon: Target,
              element: <AddFundPage />,
              showInNav: false
            },
            {
              path: "/funds/:fundId/edit",
              name: "Edit Fund",
              icon: Target,
              element: <EditFundPage />,
              showInNav: false
            },
            {
              path: "/net-worth",
              name: "Net Worth",
              icon: TrendingUp,
              element: <NetWorthPage />,
              showInNav: true
            },
            {
              path: "/net-worth/add-account",
              name: "Add Account",
              icon: TrendingUp,
              element: <AddAccountPage />,
              showInNav: false
            },
            {
              path: "/net-worth/account/:accountId/edit",
              name: "Edit Account",
              icon: TrendingUp,
              element: <AccountEditPage />,
              showInNav: false
            },
            {
              path: "/net-worth/manage-accounts",
              name: "Manage Accounts",
              icon: TrendingUp,
              element: <ManageAccountsPage />,
              showInNav: false
            },
            {
              path: "/transactions",
              name: "Transactions",
              icon: DollarSign,
              element: <TransactionsPage />,
              showInNav: true
            },
            {
              path: "/transactions/:id/edit",
              name: "Edit Transaction",
              icon: DollarSign,
              element: <TransactionEditPage />,
              showInNav: false
            },
            {
              path: "/rules",
              name: "Rules",
              icon: Filter,
              element: <RulesPage />,
              showInNav: false
            },
            {
              path: "/rules/:index/edit",
              name: "Edit Rule",
              icon: Filter,
              element: <RuleEditPage />,
              showInNav: false
            },
            {
              path: "/settings",
              name: "Settings",
              icon: Settings,
              element: <SettingsPage />,
              showInNav: true
            },
            {
              path: "/travel-mode/edit",
              name: "Travel Mode",
              icon: Settings,
              element: <TravelModeEditPage />,
              showInNav: false
            },
          ]}
        />
      ) : (
        <SignInPage />
      )}
    </div>
  )
}

export default App;
