import { getAuth, signOut } from "firebase/auth";
import { useAuthState } from "../hooks/useAuthState";
import { User } from "lucide-react";
import LinkFinancialInstitutionButton from "../components/LinkFinancialInstitutionButton";
import { Card } from "../components/common/card";

const SettingsPage = () => {
  const { signedIn } = useAuthState();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSignOut = () => {
    signOut(auth).then(() => {
      console.log('User signed out successfully');
    }).catch((error) => {
      console.error('Sign out error:', error);
    });
  };

  if (!signedIn) {
    return null;
  }

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl text-center font-bold px-4 pt-4 mb-6">Settings</h1>

      <div className="px-4 space-y-6">
        {/* User Information Section */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Information
          </h2>

          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-600">Name:</label>
              <p className="text-gray-900">
                {user?.displayName || user?.email || 'Anonymous User'}
              </p>
            </div>

            {user?.email && (
              <div>
                <label className="text-sm font-medium text-gray-600">Email:</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Actions Section */}
        <Card className="p-4 flex flex-col space-y-2">
          <h2 className="text-lg font-semibold mb-3">Account Actions</h2>

          <button
            className="w-full bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
          
          <LinkFinancialInstitutionButton
            className="w-full bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          />
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
