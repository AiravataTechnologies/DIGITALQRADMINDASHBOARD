import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save, Store, Upload } from "lucide-react";

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  website?: string;
  qrCode?: string;
  mongoUri?: string;
  customTypes?: string[];
  customAttributes?: any;
  isActive: boolean;
}

export default function RestaurantForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params.id;
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    image: "",
    website: "",
    mongoUri: "",
    customTypes: "Starters,Main Course,Desserts,Beverages",
    isActive: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: [`/api/admin/restaurants/${id}`],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      return await apiRequest(`/api/admin/restaurants/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        image: restaurant.image || "",
        website: restaurant.website || "",
        mongoUri: restaurant.mongoUri || "",
        customTypes: restaurant.customTypes?.join(",") || "Starters,Main Course,Desserts,Beverages",
        isActive: restaurant.isActive ?? true,
      });
      setImagePreview(restaurant.image || "");
    }
  }, [restaurant]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem("adminToken");
      const url = isEditing
        ? `/api/admin/restaurants/${id}`
        : "/api/admin/restaurants";
      const method = isEditing ? "PUT" : "POST";

      const requestData = {
        ...data,
        customTypes: data.customTypes.split(",").map(type => type.trim()).filter(Boolean)
      };
      
      return await apiRequest(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Restaurant ${isEditing ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} restaurant`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-xl sm:text-2xl text-blue-600 break-words">
                  {isEditing ? "Edit Restaurant" : "Add New Restaurant"}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600">
                  {isEditing ? "Update restaurant information" : "Create a new restaurant"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Restaurant Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  placeholder="Enter restaurant description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    placeholder="Enter restaurant address"
                    rows={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                  Restaurant Website (Optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://your-restaurant-website.com"
                />
                <p className="text-xs sm:text-sm text-gray-600">
                  If provided, a QR code will be generated for customers to visit your website
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                  Restaurant Image *
                </Label>
                <div className="space-y-3">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">Or enter image URL:</p>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange("image", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter image URL"
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Restaurant preview"
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mongoUri" className="text-sm font-medium text-gray-700">
                  MongoDB URI (Optional)
                </Label>
                <Input
                  id="mongoUri"
                  type="text"
                  value={formData.mongoUri}
                  onChange={(e) => handleInputChange("mongoUri", e.target.value)}
                  className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter MongoDB connection string to fetch dishes dynamically"
                />
                <p className="text-xs sm:text-sm text-gray-600">
                  If provided, the system will fetch menu items directly from this database
                </p>
              </div>

              {!formData.mongoUri && (
                <div className="space-y-2">
                  <Label htmlFor="customTypes" className="text-sm font-medium text-gray-700">
                    Menu Categories *
                  </Label>
                  <Input
                    id="customTypes"
                    type="text"
                    value={formData.customTypes}
                    onChange={(e) => handleInputChange("customTypes", e.target.value)}
                    className="w-full bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Starters,Main Course,Desserts,Beverages"
                    required
                  />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Enter categories separated by commas (e.g., Starters,Main Course,Desserts)
                  </p>
                </div>
              )}
              
              {formData.mongoUri && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm font-medium text-blue-800">
                      Categories will be automatically extracted from your MongoDB database
                    </p>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex items-center space-x-3">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Restaurant is active
                  </Label>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold order-2 sm:order-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {mutation.isPending
                    ? `${isEditing ? "Updating" : "Creating"}...`
                    : `${isEditing ? "Update" : "Create"} Restaurant`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/dashboard")}
                  className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 order-1 sm:order-2"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}