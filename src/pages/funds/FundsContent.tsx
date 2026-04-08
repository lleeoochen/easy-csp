import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "../../components/common/button";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import type { UI_FundAndBalance } from "../../types/uiTypes";
import { FundDialog } from "./FundDialog";
import { FundType } from "@easy-csp/shared-types";
import { TransactionEditDialog } from "../transactions/TransactionEditDialog";
import { SetBalanceDialog } from "../../components/SetBalanceDialog";
import { FundRow } from "./FundRow";

interface FundsContentProps {
  funds: UI_FundAndBalance[];
  onAddFund: (data: { name: string; type: FundType; targetAmount: number; selectedAccount: string }) => void;
  onUpdateFund: (data: { id: string; name: string; type: FundType; targetAmount: number; selectedAccount: string }) => void;
  onDeleteFund: (id: string) => void;
}

export function FundsContent({
  funds,
  onAddFund,
  onUpdateFund,
  onDeleteFund,
}: FundsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<UI_FundAndBalance | undefined>(undefined);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [prefilledFundId, setPrefilledFundId] = useState<string | undefined>(undefined);
  const [isSetBalanceDialogOpen, setIsSetBalanceDialogOpen] = useState(false);
  const [fundForBalanceSet, setFundForBalanceSet] = useState<UI_FundAndBalance | null>(null);
  const [filterType, setFilterType] = useState<'all' | FundType>('all');

  const handleEdit = (fund: UI_FundAndBalance) => {
    setEditingFund(fund);
  };

  const handleCloseEditDialog = () => {
    setEditingFund(undefined);
  };

  const handleCloseTransactionDialog = () => {
    setIsTransactionDialogOpen(false);
    setPrefilledFundId(undefined);
  };

  const handleSetBalance = (fund: UI_FundAndBalance) => {
    setFundForBalanceSet(fund);
    setIsSetBalanceDialogOpen(true);
  };

  const handleCloseSetBalanceDialog = () => {
    setIsSetBalanceDialogOpen(false);
    setFundForBalanceSet(null);
  };

  // Filter funds based on selected type
  const filteredFunds = filterType === 'all'
    ? funds
    : funds.filter(fund => fund.type === filterType);

  const filteredFundsByType: Record<string, UI_FundAndBalance[]> = filteredFunds.reduce((result, fund) => {
    if (!result[fund.type]) {
      result[fund.type] = [];
    }
    result[fund.type].push(fund);
    return result;
  }, {});

  return (
    <div>
      {/* Header with Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilterType('all')}
            className="text-sm"
          >
            All
          </Button>
          <Button
            variant={filterType === FundType.Saving ? 'primary' : 'secondary'}
            onClick={() => setFilterType(FundType.Saving)}
            className="text-sm"
          >
            Savings
          </Button>
          <Button
            variant={filterType === FundType.Investment ? 'primary' : 'secondary'}
            onClick={() => setFilterType(FundType.Investment)}
            className="text-sm"
          >
            Investments
          </Button>
        </div>
        <Button
          variant="primary"
          className="bg-white hover:bg-white/70 active:bg-gray-300"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      {/* Funds List - Horizontal on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:w-auto gap-3 mt-3">
        {
          Object.entries(filteredFundsByType).map(([type, funds]) => (
            <Card key={type}>
              <CardHeader className="text-lg">
                {type === 'all' ? 'All Funds' : type === FundType.Saving ? 'Saving Funds' : 'Investment Funds'}
              </CardHeader>
              <CardContent className=" p-0! divide-y divide-gray-200">
                {funds.length === 0 ? (
                  <div className="text-center py-16 bg-card border rounded-lg">
                    <Target className="size-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No funds yet</p>
                    <p className="text-muted-foreground mt-1">
                      Create your first fund
                    </p>
                  </div>
                ) : (
                  funds.map((fund) => (
                    <div key={fund.id}>
                      <FundRow
                        fund={fund}
                        onEdit={handleEdit}
                        onSetBalance={handleSetBalance}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Add Dialog */}
      <FundDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
        onAdd={onAddFund}
        onUpdate={onUpdateFund}
        onDelete={onDeleteFund}
      />

      {/* Edit Dialog */}
      <FundDialog
        open={editingFund !== undefined}
        onOpenChange={(open) => !open && handleCloseEditDialog()}
        mode="edit"
        existingFund={editingFund}
        onAdd={onAddFund}
        onUpdate={onUpdateFund}
        onDelete={onDeleteFund}
      />

      {/* Transaction Dialog */}
      <TransactionEditDialog
        open={isTransactionDialogOpen}
        onOpenChange={handleCloseTransactionDialog}
        transaction={null}
        prefilledFundId={prefilledFundId}
      />

      {/* Set Balance Dialog */}
      <SetBalanceDialog
        open={isSetBalanceDialogOpen}
        onOpenChange={handleCloseSetBalanceDialog}
        fund={fundForBalanceSet}
      />
    </div>
  );
}
