import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from '@/components/Page';
import { Card, CardHeader, CardContent } from '@/components/common/card';
import { Button } from '@/components/common/button';
import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { DatePicker } from '@/components/common/DatePicker';
import { useUserRules } from '@/hooks/useTravelMode';
import { getTravelModeConfig, getTravelModeStatus } from '@/utils/travelModeUtils';
import { TravelModeService } from '@/services/travelModeService';
import { useFunds } from "@/hooks/api/useFunds";
import { camelCaseToSentence } from '@/utils/stringUtils';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RULES_QUERY_KEY } from "@/hooks/api/useRules";
import { getAuth } from "firebase/auth";
import { Settings } from "lucide-react";

const TravelModeEditPage = () => {
  const navigate = useNavigate();
  const { data: rulesData, isLoading } = useUserRules();
  const { data: funds = [] } = useFunds();
  const queryClient = useQueryClient();

  const config = useMemo(() => getTravelModeConfig(rulesData ?? null), [rulesData]);
  const status = useMemo(() => getTravelModeStatus(rulesData ?? null), [rulesData]);

  const [startDate, setStartDate] = useState<Date | null>(
    config?.startDate ? new Date(config.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    config?.endDate ? new Date(config.endDate) : null
  );

  const fundName = useMemo(() => {
    if (!config?.fundId) return null;
    return funds.find(f => f.id === config.fundId)?.name ?? 'Unknown Fund';
  }, [config, funds]);

  const { mutate: saveDates, isPending } = useMutation({
    mutationFn: async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      if (!startDate || !endDate) throw new Error('Dates required');
      // Set start to beginning of day, end to end of day
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      await TravelModeService.setTripDates(uid, start.getTime(), end.getTime());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
      navigate(-1);
    },
  });

  const { mutate: cancelTrip, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error('Not authenticated');
      await TravelModeService.cancelTrip(uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
      navigate(-1);
    },
  });

  if (isLoading) {
    return (
      <Page maxWidth="cozy" title="Travel Mode" showBack>
        <div className="animate-pulse">Loading...</div>
      </Page>
    );
  }

  // Not configured — redirect to full config
  if (!config) {
    navigate('/travel-mode/configure', { replace: true });
    return null;
  }

  const isValid = startDate !== null && endDate !== null && startDate <= endDate;
  const hasDates = status !== 'no-dates' && status !== 'not-configured';

  return (
    <Page maxWidth="cozy" title="Travel Mode" showBack>
      {/* Trip Dates */}
      <Card>
        <CardHeader>Trip Dates</CardHeader>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                label="Start Date"
              />
            </div>
            <div className="flex-1">
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                label="End Date"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mt-2">
        <CardHeader>Categories and Associated Fund</CardHeader>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Categories:</span>{' '}
                {config.categories.map(c => camelCaseToSentence(c)).join(', ')}
              </p>
              <p>
                <span className="font-medium">Fund:</span>{' '}
                {fundName}
              </p>
            </div>
            <Button
              onClick={() => navigate('/travel-mode/configure')}
              className="text-gray-500"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-white p-4 mt-2">
        <DialogActionPanel
          cancel={{
            label: 'Cancel',
            onClick: () => navigate(-1),
            disabled: isPending
          }}
          submit={{
            label: isPending ? 'Saving...' : 'Save',
            onClick: () => saveDates(),
            disabled: isPending || !isValid
          }}
          customActions={hasDates ? [{
            label: isCancelling ? 'Cancelling...' : 'Cancel Trip',
            onClick: () => cancelTrip(),
            disabled: isCancelling,
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
          }] : undefined}
          isLoading={isPending}
        />
      </Card>
    </Page>
  );
};

export default TravelModeEditPage;
