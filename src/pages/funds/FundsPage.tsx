import { Page } from "../../components/Page";
import { FundsContent } from "./FundsContent";
import { useFunds, useAddFund, useUpdateFund, useDeleteFund } from "../../hooks/api/useFunds";

const FundsPage = () => {
  const { data: funds = [], isLoading, error, refetch } = useFunds();
  const addMutation = useAddFund();
  const updateMutation = useUpdateFund();
  const deleteMutation = useDeleteFund();

  // Sort funds by type: saving first, then investment
  const sortedFunds = [...funds].sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === 'saving' ? -1 : 1;
  });

  if (isLoading) {
    return (
      <Page title="Funds" maxWidth="full">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading funds...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Funds" maxWidth="half-xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading funds: {error.message}</p>
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
    <Page title="Funds" maxWidth="half-xl">
      <FundsContent
        funds={sortedFunds}
        onAddFund={(data) => addMutation.mutate(data)}
        onUpdateFund={(data) => updateMutation.mutate(data)}
        onDeleteFund={(id) => deleteMutation.mutate(id)}
      />
    </Page>
  );
};

export default FundsPage;
