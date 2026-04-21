import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from '@/components/Page';
import { Card, CardHeader, CardContent } from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Label } from '@/components/common/label';
import { AccountSelector } from '@/components/common/AccountSelector';
import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { useCSP } from '@/hooks/api/useCSP';
import { useSaveTravelMode, useUserRules } from '@/hooks/useTravelMode';
import { getTravelModeConfig, getDefaultTravelCategories } from '@/utils/travelModeUtils';
import { CSPBucket } from "@easy-csp/shared-types";
import { camelCaseToSentence } from '@/utils/stringUtils';
import { ArrowLeft } from "lucide-react";

const CSP_BUCKET_ORDER: CSPBucket[] = [
  CSPBucket.Income,
  CSPBucket.FixedCost,
  CSPBucket.Savings,
  CSPBucket.Investment,
  CSPBucket.GuildFreeSpending,
  CSPBucket.Ignored,
];

const TravelModeEditPage = () => {
  const navigate = useNavigate();
  const { data: csp } = useCSP();
  const { data: rulesData, isLoading: loadingRules } = useUserRules();
  const { mutate: saveConfig, isPending, isError, error } = useSaveTravelMode();

  const existingConfig = useMemo(() => getTravelModeConfig(rulesData ?? null), [rulesData]);
  const defaultCategories = useMemo(() => getDefaultTravelCategories(csp), [csp]);

  const initialCategories = existingConfig?.categories ?? defaultCategories;
  const initialAccountId = existingConfig?.accountId ?? "";

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [accountId, setAccountId] = useState<string>(initialAccountId);

  // Sync state when initial values change (e.g., when CSP data loads)
  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setAccountId(initialAccountId);
  }, [initialAccountId]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0 || !accountId) return;

    saveConfig(
      { categories: selectedCategories, accountId: accountId },
      {
        onSuccess: () => {
          navigate('/settings');
        },
      }
    );
  };

  const isValid = selectedCategories.length > 0 && accountId !== "";

  // Group categories by bucket
  const categoriesByBucket = useMemo(() => {
    if (!csp) return [];

    return CSP_BUCKET_ORDER.map((bucket) => ({
      bucket,
      categories: (csp[bucket] || [])
        .filter((budget) => !budget.isTrackingAccount)
        .map((budget) => ({
          id: budget.category,
          name: budget.name || camelCaseToSentence(budget.category),
        })),
    })).filter((group) => group.categories.length > 0); // Only show buckets with categories
  }, [csp]);

  if (loadingRules) {
    return (
      <Page maxWidth="cozy">
        <div className="animate-pulse">Loading...</div>
      </Page>
    );
  }

  return (
    <>
      <Page maxWidth="cozy" title="Configure Travel Mode">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Settings</span>
          </Button>
        </div>

        {/* Categories Card */}
        <Card>
          <CardHeader>
            Travel Categories
          </CardHeader>
          <CardContent className="py-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Select categories to track during travel
            </Label>
            <div className="space-y-4 rounded-lg p-3">
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
          </CardContent>
        </Card>

        <Card className="mt-2">
          <CardHeader>
            Assign an Account
          </CardHeader>
          <CardContent className="py-4">
            <AccountSelector
              value={accountId}
              onValueChange={setAccountId}
              label="Travel Account"
              placeholder="Select an account"
              includeNoneOption={false}
            />

            {isError && error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-4">
                {error.message || "Failed to save travel mode configuration"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons - Fixed at bottom on mobile */}
        <Card className="bg-white p-4 mt-2">
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: () => navigate('/settings'),
              disabled: isPending
            }}
            submit={{
              label: isPending ? 'Saving...' : 'Save',
              onClick: handleSave,
              disabled: isPending || !isValid
            }}
            isLoading={isPending}
          />
        </Card>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>
    </>
  );
};

export default TravelModeEditPage;
