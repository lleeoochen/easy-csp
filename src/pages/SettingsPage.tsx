import { getAuth, signOut } from "firebase/auth";
import { useAuthState } from "../hooks/useAuthState";
import { User, Filter, ChevronRight, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/common/card";
import { Page } from "../components/Page";
import { Button } from "../components/common/button";
import { useNavigate } from "react-router-dom";
import { isDevEnvironment } from "../utils/envUtils";
import { DevTestImport } from "../components/DevTestImport";
import { ThemeSelector } from "../components/ThemeSelector";
import { TravelModeSettingsRow } from "../components/TravelModeSettingsRow";

const SettingsPage = () => {
  const { signedIn } = useAuthState();
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

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
    <Page title="Settings" maxWidth="half">
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left Column: User Information */}
        <div className="xl:w-80 xl:shrink-0">
          <Card>
            <CardHeader className="text-lg flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Information
            </CardHeader>
            <CardContent>
              <div className="p-2 flex flex-col gap-3">
                {user?.email && (
                  <div>
                    <label className="font-medium text-gray-600">Email:</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Other Settings */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Theme Selector */}
          <ThemeSelector />

          {/* Management Section */}
          <Card>
            <CardHeader className="text-lg">
              Manage
            </CardHeader>
            <CardContent>
              {/* Rules Button */}
              <button
                onClick={() => navigate('/rules')}
                className="w-full flex items-center justify-between rounded-lg hover:bg-gray-100 transition-colors p-2"
              >
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium">Transaction Rules</p>
                    <p className="text-sm text-gray-500">Manage categorization rules</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Travel Mode */}
              <TravelModeSettingsRow />
            </CardContent>
          </Card>

          {/* Dev Tools Section - Only show in development */}
          {isDevEnvironment && (
            <Card>
              <CardHeader className="text-lg flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Dev Tools
              </CardHeader>
              <CardContent>
                <DevTestImport />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
};

export default SettingsPage;
