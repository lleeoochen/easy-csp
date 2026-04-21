import { useNavigate } from "react-router-dom";
import { Plane, ChevronRight } from "lucide-react";
import { Switch } from "./common/switch";
import { useUserRules, useToggleTravelMode } from '@/hooks/useTravelMode';
import { isTravelModeConfigured, isTravelModeEnabled } from '@/utils/travelModeUtils';

export function TravelModeSettingsRow() {
  const navigate = useNavigate();
  const { data: rulesData = null } = useUserRules();
  const { mutate: toggleTravelMode, isPending: isToggling } = useToggleTravelMode();

  const configured = isTravelModeConfigured(rulesData);
  const enabled = isTravelModeEnabled(rulesData);

  const handleRowClick = () => {
    navigate('/travel-mode/edit');
  };

  const handleToggle = (newEnabled: boolean) => {
    toggleTravelMode(newEnabled, {
      onSuccess: () => {
        console.log(
          newEnabled ? 'Travel mode activated' : 'Travel mode deactivated'
        );
      },
      onError: (error) => {
        console.error('Failed to toggle travel mode:', error);
      }
    });
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className="w-full flex items-center justify-between rounded-lg hover:bg-gray-100 transition-colors p-2 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <p className="font-medium">Travel Mode</p>
            <p className="text-sm text-gray-500">Auto-mark travel spending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {configured && (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={isToggling}
              />
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </>
  );
}
