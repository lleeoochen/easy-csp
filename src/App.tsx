import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import ConsciousSpendingPlanPage from "./pages/consciousSpendingPlan/ConsciousSpendingPlanPage";
import SavingTargetsPage from "./pages/SavingTargetsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialInstitutionsPage from "./pages/financialInstitutions/FinancialInstitutionsPage";
import { DollarSign, Target, BarChart3, Settings, Building2 } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import SignInPage from "./pages/SignInPage";
import { useAuthState } from "./hooks/useAuthState";

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
    <div className="app-container">
      {signedIn ? (
        <Router>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-16">
              <Routes>
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/institutions" element={<FinancialInstitutionsPage />} />
                <Route path="/csp" element={<ConsciousSpendingPlanPage />} />
                <Route path="/goals" element={<SavingTargetsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-10">
              <div className="container max-w-md mx-auto">
                <div className="flex justify-around items-center">
                  <Link
                    to="/transactions"
                    className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs mt-1">Transactions</span>
                  </Link>
                  <Link
                    to="/institutions"
                    className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs mt-1">Accounts</span>
                  </Link>
                  <Link
                    to="/csp"
                    className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-xs mt-1">CSP</span>
                  </Link>
                  <Link
                    to="/goals"
                    className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Target className="w-5 h-5" />
                    <span className="text-xs mt-1">Goals</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex flex-col items-center py-2 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-xs mt-1">Settings</span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>

        </Router>
      ) : (
        <SignInPage />
      )}
    </div>
  )
}

export default App;
