import { Card, CardHeader, CardContent } from '@/components/common/card';
import { FundListItem } from './FundListItem';
import type { UI_Fund } from '@/types/uiTypes';

interface FundListCardProps {
  title: string;
  funds: UI_Fund[];
  onDelete: (fund: UI_Fund) => void;
  emptyMessage?: string;
}

export const FundListCard = ({
  title,
  funds,
  onDelete,
  emptyMessage,
}: FundListCardProps) => {
  return (
    <Card className="md:h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg tracking-wide">{title}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0! divide-y divide-gray-200 md:h-full">
        {funds.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">{emptyMessage || 'No funds found.'}</p>
        ) : (
          funds.map((fund) => (
            <div key={fund.id}>
              <FundListItem fund={fund} onDelete={onDelete} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
