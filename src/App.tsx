import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

import { useAuthState } from './hooks/useAuthState';
import LinkFinancialInstitutionButton from './components/LinkFinancialInstitutionButton';
import TransactionsPage from './pages/TransactionsPage';
import SignInPage from './pages/SignInPage';

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
connectFirestoreEmulator(firestore, "localhost", 8080);
connectFunctionsEmulator(functions, "localhost", 5001);

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
      <h1>Easy CSP</h1>
      <div className="auth-status">
        {signedIn ? "Signed in ✅" : "Not signed in"}
      </div>

      {signedIn ? (
        <>
          <div className="link-section">
            <LinkFinancialInstitutionButton />
          </div>

          <div className="transactions-section">
            <TransactionsPage />
          </div>

          <div className="sign-out-section">
            <button
              className="sign-out-button"
              onClick={() => {
                const auth = getAuth();
                signOut(auth).then(() => {
                  console.log('User signed out successfully');
                }).catch((error) => {
                  console.error('Sign out error:', error);
                });
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <SignInPage />
      )}
    </div>
  )
}

export default App
