import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./common/dialog";
import { Button } from "./common/button";
import { Label } from "./common/label";
import { FundSelector } from "./common/FundSelector";
import { useCSP } from "../hooks/api/useCSP";
import { useSaveTravelMode, useUserRules } from "../hooks/useTravelMode";
import { getTravelModeConfig, getDefaultTravelCategories } from "../utils/travelModeUtils";
import { CSPBucket } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../utils/stringUtils";

interface TravelModeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSP_BUCKET_ORDER: CSPBucket[] = [
  CSPBucket.Income,
  CSPBucket.FixedCost,
  CSPBucket.Savings,
  CSPBucket.Investment,
  CSPBucket.GuildFreeSpending,
  CSPBucket.Ignored,
];

function useTravelModeConfigDialogContent() {
  const { data: csp } = useCSP();
  const { data: rule } = useUserRules();
  const { mutate: saveConfig, isPending, isError, error } = useSaveTravelMode();

  const existingConfig = useMemo(() => getTravelModeConfig(rule ?? null), [rule]);
  const defaultCategories = useMemo(() => getDefaultTravelCategories(csp), [csp]);

  // Derive initial state from existing config or defaults
  // The parent component uses a key to reset this hook when config changes
  const initialCategories = existingConfig?.categories ?? defaultCategories;
  const initialFundId = existingConfig?.fundId ?? "";

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [fundId, setFundId] = useState<string>(initialFundId);

  // Sync state when initial values change (e.g., when CSP data loads)
  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setFundId(initialFundId);
  }, [initialFundId]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = (onClose: () => void) => {
    if (selectedCategories.length === 0 || !fundId) return;

    saveConfig(
      { categories: selectedCategories, fundId: fundId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const isValid = selectedCategories.length > 0 && fundId !== "";

  // Group categories by bucket
  const categoriesByBucket = useMemo(() => {
    if (!csp) return [];

    return CSP_BUCKET_ORDER.map((bucket) => ({
      bucket,
      categories: (csp[bucket] || [])
        .filter((budget) => !budget.isTrackingFund) // Exclude saving target categories
        .map((budget) => ({
          id: budget.category,
          name: budget.name || camelCaseToSentence(budget.category),
        })),
    })).filter((group) => group.categories.length > 0); // Only show buckets with categories
  }, [csp]);

  return {
    selectedCategories,
    fundId,
    setFundId,
    handleCategoryToggle,
    handleSave,
    isValid,
    isPending,
    isError,
    error,
    categoriesByBucket,
  };
}

export function TravelModeConfigDialog({ open, onOpenChange }: TravelModeConfigDialogProps) {
  const { data: rule } = useUserRules();

  // Use rule as key to reset component state when config changes
  const dialogKey = useMemo(() => {
    const config = getTravelModeConfig(rule ?? null);
    return config ? `${config.categories.join(',')}-${config.fundId}` : 'new';
  }, [rule]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={dialogKey}>
        <TravelModeConfigDialogInner onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TravelModeConfigDialogInner({ onClose }: { onClose: () => void }) {
  const {
    selectedCategories,
    fundId,
    setFundId,
    handleCategoryToggle,
    handleSave,
    isValid,
    isPending,
    isError,
    error,
    categoriesByBucket,
  } = useTravelModeConfigDialogContent();

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configure Travel Mode</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Select categories to track during travel
          </Label>
          <div className="space-y-4 max-h-96 overflow-y-auto rounded-lg p-3">
            {categoriesByBucket.map(({ bucket, categories }) => (
              <div key={bucket} className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-600">
                  {camelCaseToSentence(bucket)}
                </h4>
                <div className="space-y-1.5 pl-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-4 h-4 text-primary-bg border-gray-300 rounded focus:ring-primary-bg"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <FundSelector
          value={fundId}
          onValueChange={setFundId}
          label="Saving Fund"
          placeholder="Select a fund"
        />

        {isError && error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error.message || "Failed to save travel mode configuration"}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSave(onClose)}
          disabled={!isValid || isPending}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}
