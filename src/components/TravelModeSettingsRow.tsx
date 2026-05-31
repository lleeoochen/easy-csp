import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, ChevronRight } from "lucide-react";
import { useUserRules } from '@/hooks/useTravelMode';
import { getTravelModeStatus, getTravelModeDates, isTravelModeConfigured } from '@/utils/travelModeUtils';

const STATUS_LABELS: Record<string, string> = {
  'active': 'Active',
  'upcoming': 'Upcoming',
  'ended': 'Ended',
  'no-dates': 'No dates set',
};

function formatDateRange(startDate: number, endDate: number): string {
  const fmt = (d: number) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export function TravelModeSettingsRow() {
  const navigate = useNavigate();
  const { data: rulesData = null } = useUserRules();

  const configured = isTravelModeConfigured(rulesData);
  const status = useMemo(() => getTravelModeStatus(rulesData), [rulesData]);
  const dates = useMemo(() => getTravelModeDates(rulesData), [rulesData]);

  const handleRowClick = () => {
    navigate(configured ? '/travel-mode/edit' : '/travel-mode/configure');
  };

  const subtitle = dates
    ? `${formatDateRange(dates.startDate, dates.endDate)}  ·  ${STATUS_LABELS[status] ?? ''}`
    : configured
      ? 'No dates set'
      : 'Auto-mark travel spending';

  return (
    <div
      onClick={handleRowClick}
      className="w-full flex items-center justify-between rounded-lg hover:bg-gray-100 transition-colors p-2 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Plane className="w-5 h-5 text-gray-600" />
        <div className="text-left">
          <p className="font-medium">Travel Mode</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}
