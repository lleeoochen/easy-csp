import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Progress } from "./common/progress";
import { Button } from "./common/button";
import { Input } from "./common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./common/dialog";
import { Label } from "./common/label";

export interface SubCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
}

export interface Category {
  name: string;
  color: string;
  description: string;
  recommended: string;
  subCategories: SubCategory[];
}

interface CategorySectionProps {
  category: Category;
  onUpdateSubCategory: (subCategoryId: string, name: string, budgeted: number) => void;
  onAddSubCategory: (name: string, budgeted: number) => void;
  onDeleteSubCategory: (subCategoryId: string) => void;
}

export function CategorySection({
  category,
  onUpdateSubCategory,
  onAddSubCategory,
  onDeleteSubCategory,
}: CategorySectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", budgeted: 0 });
  const [addForm, setAddForm] = useState({ name: "", budgeted: 0 });

  const totalBudgeted = category.subCategories.reduce((sum, sub) => sum + sub.budgeted, 0);
  const totalSpent = category.subCategories.reduce((sum, sub) => sum + sub.spent, 0);
  const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = totalSpent > totalBudgeted;

  const handleEditClick = (subCategory: SubCategory) => {
    setEditingId(subCategory.id);
    setEditForm({ name: subCategory.name, budgeted: subCategory.budgeted });
  };

  const handleEditSave = () => {
    if (editingId && editForm.name && editForm.budgeted >= 0) {
      onUpdateSubCategory(editingId, editForm.name, editForm.budgeted);
      setEditingId(null);
    }
  };

  const handleAddSave = () => {
    if (addForm.name && addForm.budgeted >= 0) {
      onAddSubCategory(addForm.name, addForm.budgeted);
      setAddForm({ name: "", budgeted: 0 });
      setIsAddOpen(false);
    }
  };

  return (
    <div className="bg-card border border-gray-200 rounded-lg overflow-hidden">
      {/* Category Header */}
      <div className="p-4 bg-amber-100 px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${category.color}`} />
              <h3 className="font-semibold">{category.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {category.recommended}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">
              ${totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              of ${totalBudgeted.toLocaleString()}
            </div>
          </div>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2 mb-2" />
        <div className="flex justify-between text-xs">
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {percentage.toFixed(0)}% used
          </span>
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            ${(totalBudgeted - totalSpent).toLocaleString()} left
          </span>
        </div>
      </div>

      {/* SubCategories */}
      <div>
        {category.subCategories.map((subCategory) => (
          <div key={subCategory.id} className="p-3 flex items-center justify-between active:bg-accent/50">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{subCategory.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                ${subCategory.spent.toLocaleString()} / ${subCategory.budgeted.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleEditClick(subCategory)}
              >
                <Edit2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add SubCategory Button */}
      <div className="p-3 border-cardBorder bg-muted/10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the name and budget amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budgeted">Budget Amount</Label>
              <Input
                id="edit-budgeted"
                type="number"
                value={editForm.budgeted}
                onChange={(e) => setEditForm({ ...editForm, budgeted: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingId) {
                  onDeleteSubCategory(editingId);
                  setEditingId(null);
                }
              }}
              className="flex-1"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleEditSave} className="flex-1">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item to {category.name}</DialogTitle>
            <DialogDescription>Create a new budget item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                placeholder="e.g., Rent"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-budgeted">Budget Amount</Label>
              <Input
                id="add-budgeted"
                type="number"
                placeholder="0"
                value={addForm.budgeted || ""}
                onChange={(e) => setAddForm({ ...addForm, budgeted: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSave} className="w-full">Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
