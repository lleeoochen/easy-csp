import { getAuth, signOut } from "firebase/auth";
import { useAuthState } from "../hooks/useAuthState";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/common/card";
import { Page } from "../components/Page";
import { Button } from "../components/common/button";

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
    <Page title="Settings">
      <div className="space-y-4">
        {/* User Information Section */}
        <Card>
          <CardHeader className="text-lg flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Information
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <label className="font-medium text-gray-600">Name:</label>
              <p className="text-gray-900">
                {user?.displayName || user?.email || 'Anonymous User'}
              </p>
            </div>

            {user?.email && (
              <div>
                <label className="font-medium text-gray-600">Email:</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default SettingsPage;
