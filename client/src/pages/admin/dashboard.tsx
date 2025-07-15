// import { useState } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { Plus, Store, Menu, Users, Crown, LogOut, Edit, Trash2, Settings } from "lucide-react";
// import { useLocation } from "wouter";
// import QRCodeModal from "@/components/QRCodeModal";
// import AdminSettingsModal from "@/components/AdminSettingsModal";

// interface Restaurant {
//   _id: string;
//   name: string;
//   description: string;
//   address: string;
//   phone: string;
//   email: string;
//   image: string;
//   website?: string;
//   qrCode?: string;
//   isActive: boolean;
//   createdAt: string;
// }

// export default function AdminDashboard() {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const [settingsOpen, setSettingsOpen] = useState(false);

//   const { data: restaurants, isLoading } = useQuery({
//     queryKey: ["/api/admin/restaurants"],
//     queryFn: async () => {
//       return await apiRequest("/api/admin/restaurants");
//     },
//   });

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     localStorage.removeItem("adminUser");
//     toast({
//       title: "Logged out",
//       description: "You have been logged out successfully",
//     });
//     setLocation("/admin/login");
//   };

//   const deleteMutation = useMutation({
//     mutationFn: async (restaurantId: string) => {
//       return await apiRequest(`/api/admin/restaurants/${restaurantId}`, {
//         method: "DELETE",
//       });
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "Restaurant deleted successfully",
//       });
//       queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Error",
//         description: error.message || "Failed to delete restaurant",
//         variant: "destructive",
//       });
//     },
//   });

//   const handleDelete = (restaurantId: string, restaurantName: string) => {
//     if (window.confirm(`Are you sure you want to delete "${restaurantName}"? This action cannot be undone.`)) {
//       deleteMutation.mutate(restaurantId);
//     }
//   };

//   const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-blue-600 text-lg">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b border-gray-200 p-4">
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <Crown className="w-8 h-8 text-blue-600" />
//             <div>
//               <h1 className="text-2xl font-bold text-blue-600">Airavata Technologies</h1>
//               <p className="text-gray-600">Restaurant Management System</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="text-right">
//               <p className="text-gray-900 font-medium">Welcome, {adminUser.username}</p>
//               <p className="text-gray-600 text-sm">{adminUser.email}</p>
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setSettingsOpen(true)}
//               className="border-blue-600 text-blue-600 hover:bg-blue-50"
//             >
//               <Settings className="w-4 h-4 mr-2" />
//               Settings
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={handleLogout}
//               className="border-blue-600 text-blue-600 hover:bg-blue-50"
//             >
//               <LogOut className="w-4 h-4 mr-2" />
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto p-6">
//         {/* Statistics Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <Card className="bg-white border-gray-200 shadow-sm">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm">Total Restaurants</p>
//                   <p className="text-2xl font-bold text-blue-600">
//                     {restaurants?.length || 0}
//                   </p>
//                 </div>
//                 <Store className="w-8 h-8 text-blue-400" />
//               </div>
//             </CardContent>
//           </Card>
//           <Card className="bg-white border-gray-200 shadow-sm">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm">Active Restaurants</p>
//                   <p className="text-2xl font-bold text-blue-600">
//                     {restaurants?.filter((r: Restaurant) => r.isActive).length || 0}
//                   </p>
//                 </div>
//                 <Users className="w-8 h-8 text-blue-400" />
//               </div>
//             </CardContent>
//           </Card>
//           <Card className="bg-white border-gray-200 shadow-sm">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm">Total Items</p>
//                   <p className="text-2xl font-bold text-blue-600">-</p>
//                 </div>
//                 <Menu className="w-8 h-8 text-blue-400" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Restaurants Section */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-gray-900">Restaurants</h2>
//             <Button
//               onClick={() => setLocation("/admin/restaurants/new")}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add Restaurant
//             </Button>
//           </div>

//           {restaurants?.length === 0 ? (
//             <Card className="bg-white border-gray-200 shadow-sm">
//               <CardContent className="p-8 text-center">
//                 <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-600 mb-4">No restaurants found</p>
//                 <Button
//                   onClick={() => setLocation("/admin/restaurants/new")}
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add Your First Restaurant
//                 </Button>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {restaurants?.map((restaurant: Restaurant) => (
//                 <Card key={restaurant._id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
//                   <CardHeader className="pb-3">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-center space-x-3">
//                         <img
//                           src={restaurant.image}
//                           alt={restaurant.name}
//                           className="w-16 h-16 object-cover rounded-lg border border-gray-200"
//                         />
//                         <div>
//                           <CardTitle className="text-lg text-gray-900">{restaurant.name}</CardTitle>
//                           <CardDescription className="text-gray-600">{restaurant.address}</CardDescription>
//                           <p className="text-sm text-gray-500 mt-1">{restaurant.email}</p>
//                         </div>
//                       </div>
//                       <Badge variant={restaurant.isActive ? "default" : "secondary"} className={restaurant.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
//                         {restaurant.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-gray-600 mb-4">{restaurant.description}</p>
//                     <div className="space-y-2 mb-4">
//                       <p className="text-gray-600 text-sm">
//                         <span className="font-medium">Phone:</span> {restaurant.phone}
//                       </p>
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setLocation(`/admin/restaurants/${restaurant._id}/edit`)}
//                         className="flex-1 min-w-0 border-blue-600 text-blue-600 hover:bg-blue-50"
//                       >
//                         <Edit className="w-4 h-4 mr-2" />
//                         Edit
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setLocation(`/admin/restaurants/${restaurant._id}/menu`)}
//                         className="flex-1 min-w-0 border-blue-600 text-blue-600 hover:bg-blue-50"
//                       >
//                         <Menu className="w-4 h-4 mr-2" />
//                         Menu
//                       </Button>
//                       {restaurant.website && restaurant.qrCode && (
//                         <QRCodeModal
//                           website={restaurant.website}
//                           qrCode={restaurant.qrCode}
//                           restaurantName={restaurant.name}
//                         />
//                       )}
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleDelete(restaurant._id, restaurant.name)}
//                         className="flex-1 min-w-0 border-red-600 text-red-600 hover:bg-red-50"
//                         disabled={deleteMutation.isPending}
//                       >
//                         <Trash2 className="w-4 h-4 mr-2" />
//                         Delete
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
      
//       {/* Admin Settings Modal */}
//       <AdminSettingsModal isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
//     </div>
//   );
// }

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Store, Menu, Users, Crown, LogOut, Edit, Trash2, Settings } from "lucide-react";
import { useLocation } from "wouter";
import QRCodeModal from "@/components/QRCodeModal";
import AdminSettingsModal from "@/components/AdminSettingsModal";

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
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["/api/admin/restaurants"],
    queryFn: async () => {
      return await apiRequest("/api/admin/restaurants");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    setLocation("/admin/login");
  };

  const deleteMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      return await apiRequest(`/api/admin/restaurants/${restaurantId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Restaurant deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete restaurant",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (restaurantId: string, restaurantName: string) => {
    if (window.confirm(`Are you sure you want to delete "${restaurantName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(restaurantId);
    }
  };

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3 min-w-0">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">
                  Airavata Technologies
                </h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">
                  Restaurant Management System
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Hidden on small screens */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                  Welcome, {adminUser.username}
                </p>
                <p className="text-xs text-gray-600 truncate max-w-32 lg:max-w-none">
                  {adminUser.email}
                </p>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-2 sm:px-3"
                >
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-2 sm:px-3"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-gray-600 text-sm truncate">Total Restaurants</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {restaurants?.length || 0}
                  </p>
                </div>
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-gray-600 text-sm truncate">Active Restaurants</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {restaurants?.filter((r: Restaurant) => r.isActive).length || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 shadow-sm sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-gray-600 text-sm truncate">Total Items</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">-</p>
                </div>
                <Menu className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Restaurants</h2>
            <Button
              onClick={() => setLocation("/admin/restaurants/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Restaurant
            </Button>
          </div>

          {restaurants?.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8 text-center">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No restaurants found</p>
                <Button
                  onClick={() => setLocation("/admin/restaurants/new")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Restaurant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {restaurants?.map((restaurant: Restaurant) => (
                <Card key={restaurant._id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg text-gray-900 truncate">
                            {restaurant.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 truncate">
                            {restaurant.address}
                          </CardDescription>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                            {restaurant.email}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={restaurant.isActive ? "default" : "secondary"} 
                        className={`${restaurant.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"} flex-shrink-0`}
                      >
                        {restaurant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span>{" "}
                        <span className="truncate">{restaurant.phone}</span>
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-auto">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/restaurants/${restaurant._id}/edit`)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/restaurants/${restaurant._id}/menu`)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                        >
                          <Menu className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Menu
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        {restaurant.website && restaurant.qrCode && (
                          <div className="flex-1">
                            <QRCodeModal
                              website={restaurant.website}
                              qrCode={restaurant.qrCode}
                              restaurantName={restaurant.name}
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(restaurant._id, restaurant.name)}
                          className="border-red-600 text-red-600 hover:bg-red-50 text-xs sm:text-sm flex-1"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Admin Settings Modal */}
      <AdminSettingsModal isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}