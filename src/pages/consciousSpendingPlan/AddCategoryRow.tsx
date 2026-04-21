import { useState } from "react";
import { CSPBucket } from "@easy-csp/shared-types";
import { useAddCSPItem, useCSP } from '@/hooks/api/useCSP';
import { sentenceToCamelCase } from '@/utils/stringUtils';
import { Input } from '@/components/common/input';
import { Button } from '@/components/common/button';
import { cn } from '@/components/common/utils';

interface AddCategoryRowProps {
  bucket: CSPBucket;
}

export function AddCategoryRow({ bucket }: AddCategoryRowProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: csp } = useCSP();
  const addCSPItem = useAddCSPItem();

  const handleSubmit = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError("Category name cannot be empty");
      return;
    }

    const derivedId = sentenceToCamelCase(trimmed);

    // Check for duplicate in the current bucket
    const bucketItems = csp?.[bucket] ?? [];
    const isDuplicate = bucketItems.some((item) => item.category === derivedId);
    if (isDuplicate) {
      setError("A category with this name already exists");
      return;
    }

    setError(null);
    addCSPItem.mutate(
      { bucket, category: derivedId, amount: 0, name: trimmed },
      {
        onSuccess: () => {
          setInputValue("");
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to add category");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-stretch gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="New category name..."
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={handleSubmit}
          disabled={addCSPItem.isPending}
          aria-label="Add category"
          className={cn({
            "hidden": inputValue === ""
          })}
        >
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
