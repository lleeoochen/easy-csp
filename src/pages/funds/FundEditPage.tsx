import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "../../components/Page";
import { Card, CardHeader, CardContent } from "../../components/common/card";
import { Input } from "../../components/common/input";
import { DialogActionPanel } from "../../components/common/DialogActionPanel";
import { Label } from "../../components/common/label";
import { AccountSelector, MANUAL_ACCOUNT_VALUE } from "../../components/common/AccountSelector";
import { useFunds, useAddFund, useUpdateFund, useDeleteFund } from "../../hooks/api/useFunds";
import { getAccountOptionValueForFund } from "../../utils/accountUtils";
import { FundType } from "@easy-csp/shared-types";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/common/button";

interface FormData {
  name: string;
  type: FundType;
  targetAmount: number;
  selectedAccount: string;
}

const FundEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = id === 'new';

  const { data: funds = [], isLoading: loadingFunds } = useFunds();
  const addFund = useAddFund();
  const updateFund = useUpdateFund();
  const deleteFund = useDeleteFund();

  const fund = useMemo(() => {
    if (isCreateMode) return null;
    return funds.find(f => f.id === id);
  }, [funds, id, isCreateMode]);

  const initialFormData = useMemo(() => {
    if (!isCreateMode && fund) {
      return {
        name: fund.name,
        type: fund.type,
        targetAmount: fund.targetAmount,
        selectedAccount: getAccountOptionValueForFund({
          financialInstitutionId: fund.financialInstitutionId || "",
          accountId: fund.accountId,
        }),
      };
    }
    return {
      name: "",
      type: FundType.Saving,
      targetAmount: 0,
      selectedAccount: MANUAL_ACCOUNT_VALUE,
    };
  }, [isCreateMode, fund]);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleSubmit = async () => {
    if (!formData.name || formData.targetAmount <= 0) return;

    setIsLoading(true);
    try {
      if (isCreateMode) {
        await addFund.mutateAsync(formData);
      } else if (fund) {
        await updateFund.mutateAsync({
          id: fund.id,
          ...formData,
        });
      }
      navigate('/funds');
    } catch (error) {
      console.error('Error saving fund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!fund) return;

    setIsLoading(true);
    try {
      await deleteFund.mutateAsync(fund.id);
      navigate('/funds');
    } catch (error) {
      console.error('Error deleting fund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingFunds) {
    return (
      <Page maxWidth="half-xl">
        <div className="animate-pulse">Loading...</div>
      </Page>
    );
  }

  if (!isCreateMode && !fund) {
    return (
      <Page maxWidth="half-xl">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Fund not found</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/funds')}
            className="text-primary-fg hover:text-primary-fg/80"
          >
            Back to Funds
          </Button>
        </div>
      </Page>
    );
  }

  const isFormValid = formData.name && formData.targetAmount > 0;
  const hasChanges = isCreateMode ? true : (
    formData.name !== fund!.name ||
    formData.type !== fund!.type ||
    formData.targetAmount !== fund!.targetAmount ||
    formData.selectedAccount !== getAccountOptionValueForFund({
      financialInstitutionId: fund!.financialInstitutionId || "",
      accountId: fund!.accountId,
    })
  );

  return (
    <>
      <Page maxWidth="half-xl" title={isCreateMode ? "Create Fund" : "Edit Fund"}>
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/funds')}
            className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Funds</span>
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isCreateMode ? 'Create New Fund' : fund!.name}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6 py-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Fund Name</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Fund Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FundType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg mt-1"
              >
                <option value={FundType.Saving}>Saving</option>
                <option value={FundType.Investment}>Investment</option>
              </select>
            </div>

            <div>
              <Label htmlFor="target" className="text-sm font-medium text-gray-700">Target Amount</Label>
              <Input
                id="target"
                type="number"
                placeholder="0"
                value={formData.targetAmount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: Number(e.target.value) })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="account" className="text-sm font-medium text-gray-700">Select Account</Label>
              <AccountSelector
                value={formData.selectedAccount}
                onChange={(value) => setFormData({ ...formData, selectedAccount: value })}
                includeManualOption={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action buttons - Fixed at bottom on mobile */}
        <Card className="bg-white p-4 mt-2">
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: () => navigate('/funds'),
              disabled: isLoading
            }}
            submit={{
              label: isLoading ? 'Saving...' : (isCreateMode ? 'Create' : 'Save'),
              onClick: handleSubmit,
              disabled: isLoading || !isFormValid || !hasChanges
            }}
            delete={!isCreateMode ? {
              label: 'Delete',
              onClick: handleDelete,
              disabled: isLoading,
              confirmation: {
                title: 'Delete Fund',
                message: `Are you sure you want to delete "${fund?.name}"? This action cannot be undone.`,
              }
            } : undefined}
            isLoading={isLoading}
          />
        </Card>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>
    </>
  );
};

export default FundEditPage;
