import { Page } from "../../components/Page";
import { SavingTargetsContent } from "./SavingTargetsContent";
import { useSavingTargets, useAddSavingTarget, useUpdateSavingTarget, useDeleteSavingTarget } from "../../hooks/api/useSavingTargets";

const SavingFundsPage = () => {
  const { data: savingFunds = [], isLoading, error, refetch } = useSavingTargets();
  const addMutation = useAddSavingTarget();
  const updateMutation = useUpdateSavingTarget();
  const deleteMutation = useDeleteSavingTarget();

  if (isLoading) {
    return (
      <Page title="Saving Funds">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading saving funds...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Saving Funds">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading saving funds: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Saving Funds">
      <SavingTargetsContent
        savingTargets={savingFunds}
        onAddSavingTarget={(data) => addMutation.mutate(data)}
        onUpdateSavingTarget={(data) => updateMutation.mutate(data)}
        onDeleteSavingTarget={(id) => deleteMutation.mutate(id)}
      />
    </Page>
  );
};

export default SavingFundsPage;
