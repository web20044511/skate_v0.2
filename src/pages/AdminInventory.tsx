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
import { Product } from "@/types/database";
import { productService } from "@/services/database";
import { storageService } from "@/services/storage";
import { Plus, Edit2, Trash2, AlertCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    original_price: 0,
    category: "",
    image_url: "",
    images: [] as string[],
    stock_quantity: 0,
    sku: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getAllAdmin();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        original_price: product.original_price || 0,
        category: product.category,
        image_url: product.image_url || "",
        images: product.images || [],
        stock_quantity: product.stock_quantity,
        sku: product.sku || "",
      });
      setPreviewUrls(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        original_price: 0,
        category: "",
        image_url: "",
        images: [],
        stock_quantity: 0,
        sku: "",
      });
      setPreviewUrls([]);
    }
    setSelectedFiles([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      // Generate preview URLs
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove: number, isNewFile: boolean) => {
    if (isNewFile) {
      // Remove from newly selected files
      const newFilesIndex = previewUrls.length - selectedFiles.length;
      if (indexToRemove >= newFilesIndex) {
        const selectedFileIndex = indexToRemove - newFilesIndex;
        setSelectedFiles((prev) => prev.filter((_, idx) => idx !== selectedFileIndex));
        setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
      }
    } else {
      // Remove from existing images
      setFormData((prev) => ({
        ...prev,
        images: prev.images?.filter((_, idx) => idx !== indexToRemove) || [],
      }));
      setPreviewUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUploading(true);
      let imageUrl = formData.image_url;
      let images = formData.images || [];

      // Upload new files
      if (selectedFiles.length > 0) {
        try {
          for (const file of selectedFiles) {
            const url = await storageService.uploadProductImage(file);
            images.push(url);
          }
          // Set the first image as the main image_url
          if (images.length > 0) {
            imageUrl = images[0];
          }
        } catch (error) {
          toast.error("Failed to upload images");
          setIsUploading(false);
          return;
        }
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        images: images,
        price: parseFloat(formData.price.toString()),
        original_price: formData.original_price
          ? parseFloat(formData.original_price.toString())
          : null,
        stock_quantity: parseInt(formData.stock_quantity.toString()),
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, productData);
        toast.success("Product updated successfully");
      } else {
        await productService.create({
          ...productData,
          is_active: true,
        });
        toast.success("Product created successfully");
      }
      loadProducts();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await productService.delete(productId);
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity < 10 && p.stock_quantity > 0
  );
  const outOfStockProducts = products.filter((p) => p.stock_quantity === 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600 mt-1">Manage product catalog and stock</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU</label>
                    <Input
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Quantity *</label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock_quantity: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Original Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          original_price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Images</label>
                  <p className="text-xs text-gray-500">
                    Upload multiple images. The first image will be the main product image.
                  </p>
                  <div className="space-y-3">
                    {/* Image Previews Grid */}
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {previewUrls.map((url, index) => {
                          const isNewFile =
                            index >= (formData.images?.length || 0);
                          return (
                            <div
                              key={index}
                              className="relative w-full aspect-square border rounded-lg overflow-hidden bg-gray-100 group"
                            >
                              <img
                                src={url}
                                alt={`Product preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === 0 && (
                                <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                                  Main
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeImage(index, isNewFile)
                                }
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* File Upload Input */}
                    <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                      <label className="w-full cursor-pointer flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Click to add more images
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG or WebP (Max 5MB each)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploading}
                          multiple
                        />
                      </label>
                    </div>

                    {previewUrls.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">
                        No images added yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    {isUploading
                      ? "Uploading..."
                      : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts */}
        {outOfStockProducts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  {outOfStockProducts.length} product(s) out of stock
                </p>
                <p className="text-sm text-red-700">
                  {outOfStockProducts.map((p) => p.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">
                  {lowStockProducts.length} product(s) with low stock
                </p>
                <p className="text-sm text-yellow-700">
                  {lowStockProducts.map((p) => p.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">Stock</th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-600">
                              {product.description?.substring(0, 50)}...
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {product.sku}
                        </td>
                        <td className="py-3 px-4">{product.category}</td>
                        <td className="py-3 px-4 font-medium">
                          ₹{product.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              product.stock_quantity === 0
                                ? "bg-red-100 text-red-800"
                                : product.stock_quantity < 10
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDialog(product)}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No products found. Click "Add Product" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
