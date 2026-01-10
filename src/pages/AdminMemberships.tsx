import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Membership } from "@/types/database";
import { membershipService } from "@/services/database";
import { Plus, Edit2, Trash2, Star, Crown, Flame, Zap, Gift, Trophy, Heart, Award } from "lucide-react";
import { toast } from "sonner";

export default function AdminMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_days: 30,
    benefits: [] as string[],
    icon: "Star",
    color: "silver",
  });
  const [newBenefit, setNewBenefit] = useState("");

  const iconOptions = [
    { name: "Star", Icon: Star },
    { name: "Crown", Icon: Crown },
    { name: "Flame", Icon: Flame },
    { name: "Zap", Icon: Zap },
    { name: "Gift", Icon: Gift },
    { name: "Trophy", Icon: Trophy },
    { name: "Heart", Icon: Heart },
    { name: "Award", Icon: Award },
  ];

  const colorOptions = [
    { name: "silver", label: "Silver", hex: "#C0C0C0" },
    { name: "gold", label: "Gold", hex: "#FFD700" },
    { name: "platinum", label: "Platinum", hex: "#E5E4E2" },
    { name: "blue", label: "Blue", hex: "#3B82F6" },
    { name: "purple", label: "Purple", hex: "#A855F7" },
    { name: "emerald", label: "Emerald", hex: "#10B981" },
  ];

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      setIsLoading(true);
      const data = await membershipService.getAllAdmin();
      setMemberships(data);
    } catch (error) {
      console.error("Error loading memberships:", error);
      toast.error("Failed to load memberships");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (membership?: Membership) => {
    if (membership) {
      setEditingMembership(membership);
      setFormData({
        name: membership.name,
        description: membership.description || "",
        price: membership.price,
        duration_days: membership.duration_days,
        benefits: (membership.benefits as any)?.list || [],
      });
    } else {
      setEditingMembership(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        duration_days: 30,
        benefits: [],
      });
    }
    setNewBenefit("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMembership(null);
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const membershipData = {
        ...formData,
        price: parseFloat(formData.price.toString()),
        duration_days: parseInt(formData.duration_days.toString()),
        benefits: { list: formData.benefits },
        is_active: true,
      };

      if (editingMembership) {
        await membershipService.update(editingMembership.id, membershipData);
        toast.success("Membership updated successfully");
      } else {
        await membershipService.create(membershipData);
        toast.success("Membership created successfully");
      }
      loadMemberships();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving membership:", error);
      toast.error("Failed to save membership");
    }
  };

  const handleDelete = async (membershipId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this membership? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await membershipService.delete(membershipId);
      toast.success("Membership deleted successfully");
      loadMemberships();
    } catch (error) {
      console.error("Error deleting membership:", error);
      toast.error("Failed to delete membership");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Memberships</h1>
            <p className="text-gray-600 mt-1">Create and manage membership plans</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Membership
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMembership
                    ? "Edit Membership"
                    : "Create New Membership"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Membership Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duration (Days) *
                  </label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_days: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Benefits</label>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddBenefit}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  {formData.benefits.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
                        >
                          <span className="text-sm">{benefit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingMembership
                      ? "Update Membership"
                      : "Create Membership"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Memberships Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
            <p className="text-gray-600">Loading memberships...</p>
          </div>
        ) : memberships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => (
              <Card key={membership.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{membership.name}</CardTitle>
                      <p className="text-xs text-gray-600 mt-1">
                        {membership.duration_days} days
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        membership.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {membership.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {membership.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-2xl font-bold">
                      ₹{membership.price.toFixed(2)}
                    </p>
                  </div>

                  {membership.benefits && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        Benefits:
                      </p>
                      <ul className="space-y-1">
                        {(membership.benefits as any)?.list?.map(
                          (benefit: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">
                              • {benefit}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleOpenDialog(membership)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(membership.id)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No memberships found. Click "Add Membership" to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
