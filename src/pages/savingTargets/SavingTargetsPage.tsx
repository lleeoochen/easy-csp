import { useCallback, useEffect } from "react";
import { SavingTargetsContent } from "./SavingTargetsContent";
import {
  fetchSavingTargets,
  addSavingTarget,
  updateSavingTarget,
  deleteSavingTarget,
  type ThunkProps_AddSavingTarget,
  type ThunkProps_UpdateSavingTarget
} from "../../redux/thunks/savingTargetsThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { Page } from "../../components/Page";

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

  useEffect(() => {
    // Load saving targets when the component mounts
    dispatchFetchSavingTargets();
  }, [dispatchFetchSavingTargets]);

  if (loading) {
    return (
      <Page title="Saving Targets">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading saving targets...</div>
        </div>
      </Page>
    );
  }

  if (errorMessage) {
    return (
      <Page title="Saving Targets">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading saving targets: {errorMessage}</p>
          <button
            onClick={dispatchFetchSavingTargets}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Saving Targets">
      <SavingTargetsContent
        savingTargets={savingTargets}
        onAddSavingTarget={handleAddSavingTarget}
        onUpdateSavingTarget={handleUpdateSavingTarget}
        onDeleteSavingTarget={handleDeleteSavingTarget}
      />
    </Page>
  );
};

export default SavingTargetsPage;
