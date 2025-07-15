import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, Menu, IndianRupee, Utensils, Leaf, RefreshCw } from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  restaurantId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  customTypes?: string[];
  mongoUri?: string;
}

export default function MenuManagement() {
  const { restaurantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isVeg: false,
    image: "",
    isAvailable: true,
  });

  // Enhanced category normalization function
  const normalizeCategory = (cat: string) => {
    if (!cat) return '';
    return cat
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]+/g, ' ')  // Replace spaces, hyphens, and underscores with single space
      .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
      .trim();                   // Final trim
  };

  // Fuzzy matching for more robust category comparison
  const fuzzyMatch = (str1: string, str2: string) => {
    const normalize = (s: string) => s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
    
    return normalize(str1) === normalize(str2);
  };

  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = useQuery({
    queryKey: [`/api/admin/restaurants/${restaurantId}`],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      console.log('🔍 Fetching restaurant with ID:', restaurantId);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      
      const result = await apiRequest(`/api/admin/restaurants/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('🏪 Restaurant data fetched:', result);
      console.log('📂 Restaurant categories:', result?.customTypes);
      
      return result;
    },
    enabled: !!restaurantId,
    retry: 2,
    staleTime: 0,
  });
  
  if (restaurantError) {
    console.error('❌ Restaurant fetch error:', restaurantError);
  }
  if (restaurantLoading) {
    console.log('⏳ Restaurant data loading...');
  }
  
  const { data: menuItems, isLoading } = useQuery({
    queryKey: [`/api/admin/restaurants/${restaurantId}/menu-items`],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const result = await apiRequest(`/api/admin/restaurants/${restaurantId}/menu-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('🎯 Menu items fetched successfully:', result);
      console.log('📊 Total items:', result?.length || 0);
      
      // Debug menu item categories
      if (result && result.length > 0) {
        console.log('📋 Menu item categories:', result.map((item: MenuItem) => ({
          name: item.name,
          category: item.category,
          normalized: normalizeCategory(item.category)
        })));
      }
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/restaurants/${restaurantId}`] });
      }, 1000);
      
      return result;
    },
  });

  console.log('🏪 Restaurant data:', restaurant);
  console.log('📂 Restaurant customTypes:', restaurant?.customTypes);
  console.log('🔗 Restaurant mongoUri:', restaurant?.mongoUri);
  console.log('📊 Menu items available:', !!menuItems, menuItems?.length || 0);
  
  let categories = ["Starters", "Main Course", "Desserts", "Beverages"];
  
  if (restaurant?.customTypes && restaurant.customTypes.length > 0) {
    categories = restaurant.customTypes;
    console.log('✅ Using restaurant customTypes:', categories);
  }
  // else if (restaurant?.mongoUri && menuItems && menuItems.length > 0) {
  //   // Fixed: Use Array.from() to convert Set to Array
  //   const categorySet = new Set(menuItems.map((item: MenuItem) => {
  //     const category = item.category;
  //     return category.toLowerCase()
  //       .split(/[\s\-_]+/)  // Split on spaces, hyphens, and underscores
  //       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //       .join(' ');
  //   }));
    
  //   const extractedCategories = Array.from(categorySet);
    
  //   if (extractedCategories.length > 0) {
  //     categories = extractedCategories;
  //     console.log('🔄 Using categories extracted from menu items:', categories);
  //   }
  // }
  
// Replace lines 154-165 with this fixed version:

else if (restaurant?.mongoUri && menuItems && menuItems.length > 0) {
  // Fixed: Use Array.from() to convert Set to Array with proper typing
  const validCategories: string[] = [];
  
  menuItems.forEach((item: MenuItem) => {
    if (typeof item.category === 'string' && item.category.trim() !== '') {
      validCategories.push(item.category);
    }
  });
  
  const formattedCategories = validCategories.map((category: string) => {
    return category.toLowerCase()
      .split(/[\s\-_]+/)  // Split on spaces, hyphens, and underscores
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
  
  const categorySet = new Set<string>(formattedCategories);
  const extractedCategories: string[] = Array.from(categorySet);
  
  if (extractedCategories.length > 0) {
    categories = extractedCategories;
    console.log('🔄 Using categories extracted from menu items:', categories);
  }
}

  console.log('📋 Final categories being used:', categories);
  console.log('📋 Normalized categories:', categories.map(cat => normalizeCategory(cat)));

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem("adminToken");
      const url = editingItem
        ? `/api/admin/menu-items/${editingItem._id}`
        : `/api/admin/restaurants/${restaurantId}/menu-items`;
      const method = editingItem ? "PUT" : "POST";

      return await apiRequest(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
          restaurantId,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Menu item ${editingItem ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/restaurants/${restaurantId}/menu-items`] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingItem ? "update" : "create"} menu item`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest(`/api/admin/menu-items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restaurantId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/restaurants/${restaurantId}/menu-items`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });

  const refreshCategoriesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest(`/api/admin/restaurants/${restaurantId}/refresh-categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Categories refreshed! Found: ${data.categories?.join(', ')}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/restaurants/${restaurantId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/restaurants/${restaurantId}/menu-items`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh categories",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      isVeg: false,
      image: "",
      isAvailable: true,
    });
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      isVeg: item.isVeg,
      image: item.image,
      isAvailable: item.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(itemId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/dashboard")}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Menu Management</h1>
              <p className="text-gray-600 mb-4 break-words">
                {restaurant?.name} - Manage menu items and categories
              </p>
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Current Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span 
                      key={category} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 break-words"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {restaurant?.mongoUri && (
                <Button
                  onClick={() => refreshCategoriesMutation.mutate()}
                  disabled={refreshCategoriesMutation.isPending}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 w-full sm:w-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshCategoriesMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="truncate">
                    {refreshCategoriesMutation.isPending ? 'Refreshing...' : 'Refresh Categories'}
                  </span>
                </Button>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-blue-600">
                      {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700">Item Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-gray-700">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="1"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          className="bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
                          placeholder="Enter price in rupees"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 resize-none"
                        placeholder="Enter item description"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                          <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image" className="text-gray-700">Image URL *</Label>
                        <Input
                          id="image"
                          type="url"
                          value={formData.image}
                          onChange={(e) => handleInputChange("image", e.target.value)}
                          className="bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500"
                          placeholder="Enter image URL"
                          required
                        />
                      </div>
                    </div>

                    {/* Image Preview */}
                    {formData.image && (
                      <div className="space-y-2">
                        <Label className="text-gray-700">Image Preview</Label>
                        <div className="relative h-32 w-48 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                          <img 
                            src={formData.image} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const nextSibling = target.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                            onLoad={(e) => {
                              const target = e.currentTarget;
                              const nextSibling = target.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'none';
                              }
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm" style={{ display: 'none' }}>
                            Invalid image URL
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isVeg"
                          checked={formData.isVeg}
                          onCheckedChange={(checked) => handleInputChange("isVeg", checked)}
                        />
                        <Label htmlFor="isVeg" className="text-gray-700 flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${formData.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {formData.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        </Label>
                      </div>
                      {editingItem && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isAvailable"
                            checked={formData.isAvailable}
                            onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
                          />
                          <Label htmlFor="isAvailable" className="text-gray-700">Available</Label>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto"
                      >
                        {mutation.isPending
                          ? `${editingItem ? "Updating" : "Creating"}...`
                          : `${editingItem ? "Update" : "Create"} Item`}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Menu Items by Category */}
        <div className="space-y-8">
          {categories.map((category) => {
            // Enhanced category filtering with multiple matching strategies
            const categoryItems = menuItems?.filter((item: MenuItem) => {
              if (!item.category) return false;
              
              // Strategy 1: Exact match after normalization
              const normalizedItemCategory = normalizeCategory(item.category);
              const normalizedFilterCategory = normalizeCategory(category);
              
              if (normalizedItemCategory === normalizedFilterCategory) {
                return true;
              }
              
              // Strategy 2: Fuzzy matching (removes all non-alphanumeric)
              if (fuzzyMatch(item.category, category)) {
                return true;
              }
              
              // Strategy 3: Contains match (for partial matches)
              const itemCategoryLower = item.category.toLowerCase().trim();
              const filterCategoryLower = category.toLowerCase().trim();
              
              if (itemCategoryLower.includes(filterCategoryLower) || 
                  filterCategoryLower.includes(itemCategoryLower)) {
                return true;
              }
              
              return false;
            }) || [];
            
            console.log(`📊 Category "${category}" matched ${categoryItems.length} items`);
            console.log(`📝 Items in category:`, categoryItems.map((item: MenuItem) => ({
              name: item.name,
              originalCategory: item.category,
              normalizedCategory: normalizeCategory(item.category)
            })));
            
            return (
              <div key={category} className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-blue-600 flex items-center break-words">
                  <Utensils className="w-5 h-5 mr-2 shrink-0" />
                  <span className="truncate">{category}</span>
                  <span className="ml-2 text-sm text-gray-500">({categoryItems.length})</span>
                </h2>
                
                {categoryItems.length === 0 ? (
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Menu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No items in this category</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Category: "{category}" (normalized: "{normalizeCategory(category)}")
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categoryItems.map((item: MenuItem) => (
                      <Card key={item._id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                        {/* Image Section */}
                        {item.image && (
                          <div className="relative h-48 overflow-hidden rounded-t-lg shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'} border-2 border-white shrink-0`}></div>
                              <Badge variant={item.isAvailable ? "default" : "secondary"} className={`text-xs ${item.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        <CardHeader className="pb-3 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg text-gray-900 mb-1 break-words line-clamp-2">
                                {item.name}
                              </CardTitle>
                              <CardDescription className="text-gray-600 break-words line-clamp-3">
                                {item.description}
                              </CardDescription>
                            </div>
                            {!item.image && (
                              <div className="flex items-center space-x-2 shrink-0">
                                <div className={`w-4 h-4 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <Badge variant={item.isAvailable ? "default" : "secondary"} className={`text-xs ${item.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                  {item.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-blue-600 font-semibold">
                              <IndianRupee className="w-4 h-4 mr-1 shrink-0" />
                              <span className="truncate">{item.price.toFixed(0)}</span>
                            </div>
                            <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs truncate max-w-[100px]">
                              {item.category}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 text-xs"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-600 text-red-600 hover:bg-red-50 text-xs"
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}