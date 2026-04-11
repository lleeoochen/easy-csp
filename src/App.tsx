import ConsciousSpendingPlanPage from "./pages/consciousSpendingPlan/ConsciousSpendingPlanPage";
import FundsPage from "./pages/funds/FundsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import RulesPage from "./pages/rules/RulesPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialInstitutionsPage from "./pages/financialInstitutions/FinancialInstitutionsPage";
import NetWorthPage from "./pages/netWorth/NetWorthPage";
import { DollarSign, Target, BarChart3, Settings, Building2, Filter, TrendingUp } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore, doc, getDoc } from "firebase/firestore";
import SignInPage from "./pages/SignInPage";
import { useAuthState } from "./hooks/useAuthState";
import { Tabs } from "./components/Tabs";
import { isDevEnvironment } from "./utils/envUtils";
import { RequireMfaEnrollment } from "./components/RequireMfaEnrollment";
import { USERS_COLLECTION, type User } from "@easy-csp/shared-types";
import { useState, useEffect } from "react";

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

// Connect to emulators
// Temporarily disabled to test MFA against production
// if (isDevEnvironment) {
//   connectFirestoreEmulator(firestore, "localhost", 8080);
//   connectFunctionsEmulator(functions, "localhost", 5001);
// }

function App() {
  const { signedIn, loading, userId } = useAuthState();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [checkingMfa, setCheckingMfa] = useState(true);

  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!signedIn || !userId) {
        setCheckingMfa(false);
        return;
      }

      try {
        const firestore = getFirestore();
        const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
        const userData = userDoc.data() as User | undefined;

        setMfaEnabled(userData?.mfaEnabled || false);
      } catch (error) {
        console.error('Error checking MFA status:', error);
        setMfaEnabled(false);
      } finally {
        setCheckingMfa(false);
      }
    };

    checkMfaStatus();
  }, [signedIn, userId]);

  if (loading || checkingMfa) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication status...</p>
      </div>
    );
  }

  // Show MFA enrollment if user is signed in but hasn't enabled MFA
  if (signedIn && mfaEnabled === false) {
    return <RequireMfaEnrollment />;
  }

  return (
    <div className="app-container bg-background">
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
              path: "/net-worth",
              name: "Net Worth",
              icon: TrendingUp,
              element: <NetWorthPage />,
              showInNav: true
            },
            {
              path: "/institutions",
              name: "Institutions",
              icon: Building2,
              element: <FinancialInstitutionsPage />,
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
              path: "/rules",
              name: "Rules",
              icon: Filter,
              element: <RulesPage />,
              showInNav: false
            },
            {
              path: "/settings",
              name: "Settings",
              icon: Settings,
              element: <SettingsPage />,
              showInNav: true
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
