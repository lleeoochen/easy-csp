import { CategorySection } from "./CategorySection";
import type { Category } from "./CategorySection";

export interface Budget {
  fixedCosts: Category;
  investments: Category;
  savings: Category;
  guiltFree: Category;
}

interface BudgetTabProps {
  budget: Budget;
  onUpdateSubCategory: (categoryKey: string, subCategoryId: string, name: string, budgeted: number) => void;
  onAddSubCategory: (categoryKey: string, name: string, budgeted: number) => void;
  onDeleteSubCategory: (categoryKey: string, subCategoryId: string) => void;
}

export function BudgetTab({
  budget,
  onUpdateSubCategory,
  onAddSubCategory,
  onDeleteSubCategory,
}: BudgetTabProps) {
  const categories: Array<{ key: string; category: Category }> = [
    { key: "fixedCosts", category: budget.fixedCosts },
    { key: "investments", category: budget.investments },
    { key: "savings", category: budget.savings },
    { key: "guiltFree", category: budget.guiltFree },
  ];

  const totalBudgeted = categories.reduce(
    (sum, { category }) =>
      sum + category.subCategories.reduce((subSum, sub) => subSum + sub.budgeted, 0),
    0
  );

  const totalSpent = categories.reduce(
    (sum, { category }) =>
      sum + category.subCategories.reduce((subSum, sub) => subSum + sub.spent, 0),
    0
  );

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-100 px-6 py-4 border-b border-gray-200 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Budgeted</div>
          <div className="text-lg font-bold mt-0.5">${totalBudgeted.toLocaleString()}</div>
        </div>
        <div className="bg-amber-100 px-6 py-4 border-b border-gray-200 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Spent</div>
          <div className="text-lg font-bold mt-0.5">${totalSpent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : 0}% of budget
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-3">
        {categories.map(({ key, category }) => (
          <CategorySection
            key={key}
            category={category}
            onUpdateSubCategory={(subCategoryId, name, budgeted) =>
              onUpdateSubCategory(key, subCategoryId, name, budgeted)
            }
            onAddSubCategory={(name, budgeted) => onAddSubCategory(key, name, budgeted)}
            onDeleteSubCategory={(subCategoryId) => onDeleteSubCategory(key, subCategoryId)}
          />
        ))}
      </div>
    </div>
  );
}
