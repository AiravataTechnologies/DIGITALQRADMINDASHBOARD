// Mock data for demonstration when MongoDB is not available
export const mockRestaurants = [
  {
    _id: "67870c1a2b4d5e8f9a1b2c3d",
    name: "Royal Spice Palace",
    description: "Experience authentic Indian cuisine with a royal touch",
    address: "123 Main Street, City Center, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@royalspicepalace.com",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "67870c1a2b4d5e8f9a1b2c4e",
    name: "Golden Dragon Restaurant",
    description: "Traditional Chinese cuisine with modern presentation",
    address: "456 Oak Avenue, Downtown, State 12345",
    phone: "+1 (555) 987-6543",
    email: "contact@goldendragon.com",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const mockMenuItems = [
  {
    _id: "67870c1a2b4d5e8f9a1b2c5f",
    name: "Butter Chicken",
    description: "Creamy tomato-based curry with tender chicken pieces",
    price: 450,
    category: "Main Course",
    isVeg: false,
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400",
    restaurantId: "67870c1a2b4d5e8f9a1b2c3d",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "67870c1a2b4d5e8f9a1b2c6a",
    name: "Vegetable Samosas",
    description: "Crispy pastry filled with spiced vegetables",
    price: 180,
    category: "Starters",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa2238?w=400",
    restaurantId: "67870c1a2b4d5e8f9a1b2c3d",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "67870c1a2b4d5e8f9a1b2c7b",
    name: "Sweet Lassi",
    description: "Traditional yogurt-based drink with cardamom",
    price: 120,
    category: "Beverages",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400",
    restaurantId: "67870c1a2b4d5e8f9a1b2c3d",
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

let mockDataStore = {
  restaurants: [...mockRestaurants],
  menuItems: [...mockMenuItems]
};

export function deleteMockRestaurant(id: string) {
  const index = mockDataStore.restaurants.findIndex(r => r._id === id);
  if (index > -1) {
    mockDataStore.restaurants.splice(index, 1);
    // Also remove related menu items
    mockDataStore.menuItems = mockDataStore.menuItems.filter(item => item.restaurantId !== id);
    return true;
  }
  return false;
}

export function getMockRestaurants() {
  return mockDataStore.restaurants;
}

export function addMockRestaurant(restaurant: any) {
  // Generate valid MongoDB ObjectId-like string (24 hex characters)
  const mockId = new Array(24).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const newRestaurant = {
    ...restaurant,
    _id: mockId,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  mockDataStore.restaurants.push(newRestaurant);
  return newRestaurant;
}

export function getMockMenuItems(restaurantId: string) {
  return mockDataStore.menuItems.filter(item => item.restaurantId === restaurantId);
}

export function addMockMenuItem(menuItem: any) {
  // Generate valid MongoDB ObjectId-like string (24 hex characters)
  const mockId = new Array(24).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const newMenuItem = {
    ...menuItem,
    _id: mockId,
    isAvailable: true,
    createdAt: new Date().toISOString()
  };
  mockDataStore.menuItems.push(newMenuItem);
  return newMenuItem;
}