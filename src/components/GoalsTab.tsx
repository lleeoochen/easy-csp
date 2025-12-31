import { useState } from "react";
import { Plus, Edit2, Trash2, Target } from "lucide-react";
import { Progress } from "./common/progress";
import { Button } from "./common/button";
import { Input } from "./common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./common/dialog";
import { Label } from "./common/label";
import { Textarea } from "./common/textarea";
import { Card } from "./common/card";

export interface Goal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

interface GoalsTabProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, "id">) => void;
  onUpdateGoal: (id: string, goal: Omit<Goal, "id">) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateProgress: (id: string, amount: number) => void;
}

const GOAL_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
];

export function GoalsTab({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateProgress,
}: GoalsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    color: GOAL_COLORS[0],
  });

  const handleAdd = () => {
    if (formData.name && formData.targetAmount > 0) {
      onAddGoal(formData);
      setFormData({
        name: "",
        description: "",
        targetAmount: 0,
        currentAmount: 0,
        deadline: "",
        color: GOAL_COLORS[0],
      });
      setIsAddOpen(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setFormData({
      name: goal.name,
      description: goal.description,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      color: goal.color,
    });
  };

  const handleUpdate = () => {
    if (editingId && formData.name && formData.targetAmount > 0) {
      onUpdateGoal(editingId, formData);
      setEditingId(null);
    }
  };

  const handleProgressUpdate = () => {
    if (progressId && progressAmount > 0) {
      onUpdateProgress(progressId, progressAmount);
      setProgressId(null);
      setProgressAmount(0);
    }
  };

  const calculateDaysRemaining = (deadline: string) => {
    if (!deadline) return null;
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <div className="flex items-center">
              <Plus className="size-4 mr-2" />
              <span>Add Goal</span>
            </div>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings target</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Emergency Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this goal for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="0"
                  value={formData.targetAmount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current">Current Amount</Label>
                <Input
                  id="current"
                  type="number"
                  placeholder="0"
                  value={formData.currentAmount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Target Date (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color} ${
                        formData.color === color ? "ring-2 ring-offset-2 ring-foreground" : ""
                      }`}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="w-full">Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg">
            <Target className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first savings goal
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = calculateDaysRemaining(goal.deadline);
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full mt-1 ${goal.color}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(goal)}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-2 mb-3">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className=" bg-gray-300"
                  />
                  <div className="flex justify-between text-sm">
                    <span className={isComplete ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}% complete
                    </span>
                    <span className="font-medium">
                      ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div>
                    ${(goal.targetAmount - goal.currentAmount).toLocaleString()} remaining
                  </div>
                  {daysRemaining !== null && (
                    <div className={daysRemaining < 0 ? "text-destructive" : ""}>
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days left`}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setProgressId(goal.id);
                    setProgressAmount(0);
                  }}
                  disabled={isComplete}
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Progress
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update your goal details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Goal Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target">Target Amount</Label>
              <Input
                id="edit-target"
                type="number"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-current">Current Amount</Label>
              <Input
                id="edit-current"
                type="number"
                value={formData.currentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, currentAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Target Date</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${color} ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-foreground" : ""
                    }`}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingId) {
                  onDeleteGoal(editingId);
                  setEditingId(null);
                }
              }}
              className="flex-1"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleUpdate} className="flex-1">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressId !== null} onOpenChange={(open) => !open && setProgressId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
            <DialogDescription>How much did you save towards this goal?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress-amount">Amount</Label>
              <Input
                id="progress-amount"
                type="number"
                placeholder="0"
                value={progressAmount || ""}
                onChange={(e) => setProgressAmount(Number(e.target.value))}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProgressUpdate} className="w-full">
              Add ${progressAmount.toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
