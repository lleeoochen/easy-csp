import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { BudgetTab } from "../components/BudgetTab";
import { mockBudgetData } from "../mocks/budgetData";

const BudgetPage = () => {
  const [budget, setBudget] = useState(mockBudgetData);

  const handleUpdateSubCategory = useCallback((categoryKey: string, subCategoryId: string, name: string, budgeted: number) => {
    setBudget((prevBudget) => {
      const updatedBudget = { ...prevBudget };
      const category = updatedBudget[categoryKey as keyof typeof updatedBudget];

      if (category) {
        category.subCategories = category.subCategories.map((sub) =>
          sub.id === subCategoryId ? { ...sub, name, budgeted } : sub
        );
      }

      return updatedBudget;
    });
  }, []);

  const handleAddSubCategory = useCallback((categoryKey: string, name: string, budgeted: number) => {
    setBudget((prevBudget) => {
      const updatedBudget = { ...prevBudget };
      const category = updatedBudget[categoryKey as keyof typeof updatedBudget];

      if (category) {
        category.subCategories = [
          ...category.subCategories,
          {
            id: uuidv4(),
            name,
            budgeted,
            spent: 0,
          },
        ];
      }

      return updatedBudget;
    });
  }, []);

  const handleDeleteSubCategory = useCallback((categoryKey: string, subCategoryId: string) => {
    setBudget((prevBudget) => {
      const updatedBudget = { ...prevBudget };
      const category = updatedBudget[categoryKey as keyof typeof updatedBudget];

      if (category) {
        category.subCategories = category.subCategories.filter(
          (sub) => sub.id !== subCategoryId
        );
      }

      return updatedBudget;
    });
  }, []);

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl font-bold px-4 pt-4">Conscious Spending Plan</h1>
      <BudgetTab
        budget={budget}
        onUpdateSubCategory={handleUpdateSubCategory}
        onAddSubCategory={handleAddSubCategory}
        onDeleteSubCategory={handleDeleteSubCategory}
      />
    </div>
  );
};

export default BudgetPage;
