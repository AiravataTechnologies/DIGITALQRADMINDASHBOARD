import { users, menuItems, cartItems, type User, type InsertUser, type MenuItem, type CartItem, type InsertCartItem } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  
  getCartItems(): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private menuItems: Map<number, MenuItem>;
  private cartItems: Map<number, CartItem>;
  private currentUserId: number;
  private currentMenuItemId: number;
  private currentCartItemId: number;

  constructor() {
    this.users = new Map();
    this.menuItems = new Map();
    this.cartItems = new Map();
    this.currentUserId = 1;
    this.currentMenuItemId = 1;
    this.currentCartItemId = 1;
    
    this.initializeMenuItems();
  }

  private initializeMenuItems() {
    const items: Omit<MenuItem, 'id'>[] = [
      // Starters
      {
        name: "Royal Tandoori Platter",
        description: "Assorted tandoori vegetables with mint chutney and fresh naan",
        price: 420,
        category: "starters",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Maharaja Seekh Kebab",
        description: "Succulent lamb seekh kebabs with royal spices and yogurt sauce",
        price: 580,
        category: "starters",
        isVeg: false,
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Royal Samosa Platter",
        description: "Crispy samosas with spiced potato filling and tamarind chutney",
        price: 240,
        category: "starters",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      // Main Course
      {
        name: "Royal Paneer Makhani",
        description: "Creamy paneer curry with royal spices and fresh cream",
        price: 480,
        category: "mains",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Maharaja Biryani",
        description: "Aromatic basmati rice with tender mutton and royal spices",
        price: 680,
        category: "mains",
        isVeg: false,
        image: "https://images.unsplash.com/photo-1563379091369-5b8fb7e3c7c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Royal Butter Chicken",
        description: "Creamy tomato-based chicken curry with rich butter flavor",
        price: 520,
        category: "mains",
        isVeg: false,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      // Desserts
      {
        name: "Royal Gulab Jamun",
        description: "Soft milk dumplings soaked in rose-cardamom syrup",
        price: 180,
        category: "desserts",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Maharaja Kulfi",
        description: "Traditional frozen dessert with pistachios and cardamom",
        price: 160,
        category: "desserts",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      // Drinks
      {
        name: "Royal Mango Lassi",
        description: "Creamy yogurt drink with fresh mango and cardamom",
        price: 120,
        category: "drinks",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Royal Masala Chai",
        description: "Aromatic spiced tea with cardamom, cinnamon, and ginger",
        price: 80,
        category: "drinks",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      // Combos
      {
        name: "Royal Veg Thali",
        description: "Complete vegetarian meal with dal, sabzi, rice, roti, and dessert",
        price: 380,
        category: "combos",
        isVeg: true,
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      },
      {
        name: "Maharaja Non-Veg Thali",
        description: "Complete non-vegetarian feast with chicken, mutton, rice, naan, and dessert",
        price: 650,
        category: "combos",
        isVeg: false,
        image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
      }
    ];

    items.forEach(item => {
      const menuItem: MenuItem = { ...item, id: this.currentMenuItemId++ };
      this.menuItems.set(menuItem.id, menuItem);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.category === category);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async getCartItems(): Promise<CartItem[]> {
    return Array.from(this.cartItems.values());
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const existing = Array.from(this.cartItems.values()).find(
      cartItem => cartItem.menuItemId === item.menuItemId
    );

    if (existing) {
      existing.quantity += item.quantity || 1;
      this.cartItems.set(existing.id, existing);
      return existing;
    }

    const cartItem: CartItem = { ...item, quantity: item.quantity || 1, id: this.currentCartItemId++ };
    this.cartItems.set(cartItem.id, cartItem);
    return cartItem;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }

  async clearCart(): Promise<void> {
    this.cartItems.clear();
  }
}

export const storage = new MemStorage();
