import moment from 'moment';
import type { FinancialInstitution } from '@easy-csp/shared-types';

export const LastSynced = ({ institutions }: { institutions?: FinancialInstitution[] }) => {
  const lastSynced = institutions?.reduce((max, inst) =>
    inst.lastSyncTimestamp > max ? inst.lastSyncTimestamp : max, 0
  ) ?? 0;

  if (!lastSynced) return null;

  return (
    <span className="text-primary-fg text-sm mt-1 ml-auto">
      Last synced {moment(lastSynced).fromNow()}
    </span>
  );
};
