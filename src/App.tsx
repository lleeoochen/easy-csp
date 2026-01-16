import ConsciousSpendingPlanPage from "./pages/consciousSpendingPlan/ConsciousSpendingPlanPage";
import SavingTargetsPage from "./pages/savingTargets/SavingTargetsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialInstitutionsPage from "./pages/financialInstitutions/FinancialInstitutionsPage";
import { DollarSign, Target, BarChart3, Settings, Building2 } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import SignInPage from "./pages/SignInPage";
import { useAuthState } from "./hooks/useAuthState";
import { Tabs } from "./components/Tabs";

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
if (window.location.hostname === "localhost") {
  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

function App() {
  // Use our custom auth state hook
  const { signedIn, loading } = useAuthState();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication status...</p>
      </div>
    );
  }

  return (
    <div className="app-container bg-background">
      {signedIn ? (
        <Tabs
          paths={[
            {
              path: "/transactions",
              name: "Transactions",
              icon: DollarSign,
              element: <TransactionsPage />
            },
            {
              path: "/institutions",
              name: "Institutions",
              icon: Building2,
              element: <FinancialInstitutionsPage />
            },
            {
              path: "/consciousSpendingPlan",
              name: "CSP",
              icon: BarChart3,
              element: <ConsciousSpendingPlanPage />
            },
            {
              path: "/savingTargets",
              name: "Savings",
              icon: Target,
              element: <SavingTargetsPage />
            },
            {
              path: "/settings",
              name: "Settings",
              icon: Settings,
              element: <SettingsPage />
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
