import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="size-4" />
      <span>You're offline — showing cached data</span>
    </div>
  );
};
