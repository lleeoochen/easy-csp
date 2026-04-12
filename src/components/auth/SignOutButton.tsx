import { LogOut } from "lucide-react";
import { signOut, getAuth } from "firebase/auth";
import { Button } from "../common/button";

export function SignOutButton() {
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      className="p-2 hover:bg-background rounded-lg transition-colors flex items-center gap-2"
      title="Sign out"
    >
      <LogOut className="w-5 h-5 text-muted" />
      Sign out
    </Button>
  );
}
