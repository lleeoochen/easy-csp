import { useCallback, useEffect } from "react";
import { SavingTargetsTab } from "../components/SavingTargetsTab";
import {
  fetchSavingTargets,
  addSavingTarget,
  updateSavingTarget,
  deleteSavingTarget,
  updateSavingTargetProgress,
  type ThunkProps_AddSavingTarget,
  type ThunkProps_UpdateSavingTarget
} from "../redux/thunks/savingTargetsThunk";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";

const SavingTargetsPage = () => {
  const dispatch = useAppDispatch();
  const savingTargetsState = useAppSelector(state => state.savingTargets);
  const savingTargets = savingTargetsState.savingTargets;
  const loading = savingTargetsState.isLoading;
  const errorMessage = savingTargetsState.errorMessage;

  const dispatchFetchSavingTargets = useCallback(async () => {
    dispatch(fetchSavingTargets());
  }, [dispatch]);

  const handleAddSavingTarget = useCallback((savingTargetData: ThunkProps_AddSavingTarget) => {
    dispatch(addSavingTarget(savingTargetData));
  }, [dispatch]);

  const handleUpdateSavingTarget = useCallback((savingTargetData: ThunkProps_UpdateSavingTarget) => {
    dispatch(updateSavingTarget(savingTargetData));
  }, [dispatch]);

  const handleDeleteSavingTarget = useCallback((id: string) => {
    dispatch(deleteSavingTarget(id));
  }, [dispatch]);

  const handleUpdateProgress = useCallback((id: string, amount: number) => {
    dispatch(updateSavingTargetProgress({ id, amount }));
  }, [dispatch]);

  useEffect(() => {
    // Load saving targets when the component mounts
    dispatchFetchSavingTargets();
  }, [dispatchFetchSavingTargets]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Saving Targets</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading saving targets...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Saving Targets</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading saving targets: {errorMessage}</p>
          <button
            onClick={dispatchFetchSavingTargets}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl text-center font-bold px-4 pt-4">Saving Targets</h1>
      <SavingTargetsTab
        savingTargets={savingTargets}
        onAddSavingTarget={handleAddSavingTarget}
        onUpdateSavingTarget={handleUpdateSavingTarget}
        onDeleteSavingTarget={handleDeleteSavingTarget}
        onUpdateProgress={handleUpdateProgress}
      />
    </div>
  );
};

export default SavingTargetsPage;
