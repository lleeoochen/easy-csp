import { Edit2, DollarSign } from "lucide-react";
import { Progress } from "../../components/common/progress";
import { Button } from "../../components/common/button";
import type { UI_FundAndBalance } from "../../types/uiTypes";
import { formatCurrency } from "../../utils/financialUtils";
import { isManualFund, FundType } from "@easy-csp/shared-types";

interface FundRowProps {
  fund: UI_FundAndBalance;
  onEdit: (fund: UI_FundAndBalance) => void;
  onSetBalance: (fund: UI_FundAndBalance) => void;
}

export function FundRow({ fund, onEdit, onSetBalance }: FundRowProps) {
  const percentage = (fund.currentAmount / fund.targetAmount) * 100;
  const isManual = isManualFund(fund);

  return (
    <div className="space-y-2 p-4">
      <div className="flex gap-5">
        <div className="flex flex-col items-start flex-1 m-auto truncate" onClick={() => onEdit(fund)}>
          <div className="flex items-center gap-2">
            <div className="font-semibold">{fund.name}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {fund.type === FundType.Saving ? 'Saving' : 'Investment'}
            </span>
          </div>
          {fund.institutionName && fund.accountName && (
            <p className="text-sm text-gray-400 text-muted-foreground">
              {fund.institutionName} - {fund.accountName}
            </p>
          )}
          {isManual && (
            <p className="text-sm text-gray-400 text-muted-foreground">
              Manual
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isManual && (
            <>
              <Button
                variant="secondary"
                className="h-8 w-8 p-0 flex"
                onClick={() => onSetBalance(fund)}
                title="Set Balance"
              >
                <DollarSign className="size-3.5 m-auto" />
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            className="h-8 w-8 p-0 flex"
            onClick={() => onEdit(fund)}
          >
            <Edit2 className="size-3.5 m-auto" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Progress
          value={Math.min(percentage, 100)}
          className="bg-gray-200"
          activeColorClass="bg-primary-bg"
        />
        <div className="flex justify-between">
          <div className={"text-gray-800 text-sm font-bold"}>
            {formatCurrency(fund.currentAmount)}
          </div>
          <div className="text-gray-400 text-sm">
            Target: {formatCurrency(fund.targetAmount)}
          </div>
        </div>
      </div>
    </div>
  );
}
