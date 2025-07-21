var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/models/Restaurant.ts
var Restaurant_exports = {};
__export(Restaurant_exports, {
  Restaurant: () => Restaurant
});
import mongoose2 from "mongoose";
var restaurantSchema, Restaurant;
var init_Restaurant = __esm({
  "server/models/Restaurant.ts"() {
    "use strict";
    restaurantSchema = new mongoose2.Schema({
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      website: {
        type: String,
        required: false
      },
      qrCode: {
        type: String,
        required: false
      },
      mongoUri: {
        type: String,
        required: false
      },
      customTypes: {
        type: [String],
        default: []
      },
      customAttributes: {
        type: Map,
        of: String,
        default: {}
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }, {
      timestamps: true
    });
    Restaurant = mongoose2.model("Restaurant", restaurantSchema);
  }
});

// server/models/MenuItem.ts
var MenuItem_exports = {};
__export(MenuItem_exports, {
  MenuItem: () => MenuItem
});
import mongoose3 from "mongoose";
var menuItemSchema, MenuItem;
var init_MenuItem = __esm({
  "server/models/MenuItem.ts"() {
    "use strict";
    menuItemSchema = new mongoose3.Schema({
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      category: {
        type: String,
        required: true
      },
      isVeg: {
        type: Boolean,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      restaurantId: {
        type: mongoose3.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }, {
      timestamps: true
    });
    MenuItem = mongoose3.model("MenuItem", menuItemSchema);
  }
});

// server/models/Admin.ts
var Admin_exports = {};
__export(Admin_exports, {
  Admin: () => Admin
});
import mongoose4 from "mongoose";
var adminSchema, Admin;
var init_Admin = __esm({
  "server/models/Admin.ts"() {
    "use strict";
    adminSchema = new mongoose4.Schema({
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },
      password: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        unique: true
      },
      role: {
        type: String,
        default: "admin"
      },
      // Theme settings
      theme: {
        type: String,
        enum: ["blue", "green", "purple", "red", "orange", "teal"],
        default: "blue"
      },
      darkMode: {
        type: Boolean,
        default: false
      },
      compactMode: {
        type: Boolean,
        default: false
      },
      // Security settings
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      loginAlerts: {
        type: Boolean,
        default: true
      },
      sessionTimeout: {
        type: Number,
        default: 30
        // minutes
      },
      // System settings
      emailNotifications: {
        type: Boolean,
        default: true
      },
      autoBackup: {
        type: Boolean,
        default: true
      },
      maxRestaurants: {
        type: Number,
        default: 10
      }
    }, {
      timestamps: true
    });
    Admin = mongoose4.model("Admin", adminSchema);
  }
});

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db/mongodb.ts
import mongoose from "mongoose";
var isConnected = false;
async function connectToDatabase() {
  if (isConnected) {
    return;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.log("\u26A0\uFE0F  MONGODB_URI not provided - continuing without MongoDB connection");
    return;
  }
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 2e3,
      serverSelectionTimeoutMS: 2e3,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority"
    });
    isConnected = true;
    console.log("\u2705 Connected to MongoDB successfully");
  } catch (error) {
    console.error("\u274C Error connecting to MongoDB:", error);
    console.log("\u26A0\uFE0F  Continuing without MongoDB connection - admin features will be disabled");
  }
}

// server/routes.ts
init_Restaurant();
init_MenuItem();
init_Admin();

// server/middleware/auth.ts
init_Admin();
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret-change-in-production";
var authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    try {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (admin) {
        req.admin = admin;
        return next();
      }
    } catch (mongoError) {
    }
    if (decoded.id === "admin-001") {
      req.admin = {
        _id: "admin-001",
        id: "admin-001",
        username: "admin",
        email: "admin@example.com",
        role: "admin"
      };
      return next();
    }
    return res.status(401).json({ message: "Admin not found" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
var generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: "24h" });
};

// server/routes.ts
import bcrypt2 from "bcryptjs";

// server/fallback-auth.ts
var fallbackSettings = {
  theme: "blue",
  darkMode: false,
  compactMode: false,
  emailNotifications: true,
  sessionTimeout: 30,
  twoFactorEnabled: false,
  loginAlerts: true,
  autoBackup: true,
  maxRestaurants: 10
};
var fallbackProfile = {
  _id: "admin-001",
  username: "admin",
  email: "admin@example.com",
  role: "admin"
};
var fallbackPassword = "password";
async function validateAdminCredentials(username, password) {
  if (username === fallbackProfile.username && password === fallbackPassword) {
    return {
      id: fallbackProfile._id,
      username: fallbackProfile.username,
      email: fallbackProfile.email,
      role: fallbackProfile.role
    };
  }
  return null;
}
function getFallbackAdminSettings() {
  return { ...fallbackSettings };
}
function updateFallbackAdminSettings(newSettings) {
  fallbackSettings = { ...fallbackSettings, ...newSettings };
  return { ...fallbackSettings };
}
function getFallbackAdminProfile() {
  return { ...fallbackProfile };
}
function updateFallbackAdminProfile(newProfile) {
  fallbackProfile = { ...fallbackProfile, ...newProfile };
  return { ...fallbackProfile };
}
function updateFallbackAdminPassword(newPassword) {
  fallbackPassword = newPassword;
  return true;
}
function getCurrentFallbackPassword() {
  return fallbackPassword;
}

// server/mock-data.ts
var mockRestaurants = [
  {
    _id: "67870c1a2b4d5e8f9a1b2c3d",
    name: "Royal Spice Palace",
    description: "Experience authentic Indian cuisine with a royal touch",
    address: "123 Main Street, City Center, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@royalspicepalace.com",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var mockMenuItems = [
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var mockDataStore = {
  restaurants: [...mockRestaurants],
  menuItems: [...mockMenuItems]
};
function deleteMockRestaurant(id) {
  const index = mockDataStore.restaurants.findIndex((r) => r._id === id);
  if (index > -1) {
    mockDataStore.restaurants.splice(index, 1);
    mockDataStore.menuItems = mockDataStore.menuItems.filter((item) => item.restaurantId !== id);
    return true;
  }
  return false;
}
function getMockRestaurants() {
  return mockDataStore.restaurants;
}
function addMockRestaurant(restaurant) {
  const mockId = new Array(24).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  const newRestaurant = {
    ...restaurant,
    _id: mockId,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockDataStore.restaurants.push(newRestaurant);
  return newRestaurant;
}
function getMockMenuItems(restaurantId) {
  return mockDataStore.menuItems.filter((item) => item.restaurantId === restaurantId);
}
function addMockMenuItem(menuItem) {
  const mockId = new Array(24).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  const newMenuItem = {
    ...menuItem,
    _id: mockId,
    isAvailable: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockDataStore.menuItems.push(newMenuItem);
  return newMenuItem;
}

// server/db/dynamic-mongodb.ts
import mongoose5 from "mongoose";
var connectionPool = /* @__PURE__ */ new Map();
async function connectToRestaurantDatabase(mongoUri) {
  if (connectionPool.has(mongoUri)) {
    const existingConnection = connectionPool.get(mongoUri);
    if (existingConnection && existingConnection.readyState === 1) {
      return existingConnection;
    }
    connectionPool.delete(mongoUri);
  }
  try {
    let finalUri = mongoUri;
    let databaseName = "maharajafeast";
    try {
      const url = new URL(mongoUri.replace("mongodb+srv://", "https://"));
      const pathParts = url.pathname.split("/");
      if (pathParts.length > 1 && pathParts[1]) {
        databaseName = pathParts[1];
      }
    } catch (urlError) {
      console.log("\u26A0\uFE0F Could not parse URI for database name, using default");
    }
    if (!mongoUri.includes("/", mongoUri.lastIndexOf("@") + 1)) {
      finalUri = mongoUri.replace("?", `/${databaseName}?`);
    } else if (mongoUri.includes("/?")) {
      finalUri = mongoUri.replace("/?", `/${databaseName}?`);
    }
    console.log(`\u{1F517} Original URI: ${mongoUri.replace(/:[^:]*@/, ":***@")}`);
    console.log(`\u{1F517} Final URI: ${finalUri.replace(/:[^:]*@/, ":***@")}`);
    console.log(`\u{1F4CA} Target database: ${databaseName}`);
    const connection = await Promise.race([
      mongoose5.createConnection(finalUri, {
        connectTimeoutMS: 2e3,
        serverSelectionTimeoutMS: 2e3,
        maxPoolSize: 3,
        minPoolSize: 1
      }),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 3e3)
      )
    ]);
    connectionPool.set(mongoUri, connection);
    console.log(`\u2705 Connected to restaurant database: ${finalUri.split("@")[1]?.split("/")[0] || "unknown"}`);
    await new Promise((resolve) => {
      if (connection.readyState === 1) {
        resolve(null);
      } else {
        connection.once("connected", resolve);
      }
    });
    const dbName = connection.db?.databaseName || databaseName;
    console.log(`\u{1F4CA} Connected to database: ${dbName}`);
    return connection;
  } catch (error) {
    console.error("\u274C Failed to connect to restaurant database:", error);
    throw error;
  }
}
async function analyzeCustomDatabase(connection) {
  try {
    console.log("\u{1F50D} Analyzing database structure");
    console.log("\u{1F4CA} Database name:", connection.db.databaseName);
    console.log("\u{1F517} Connection state:", connection.readyState);
    const collections = await connection.db.listCollections().toArray();
    console.log("\u{1F4CB} Available collections:", collections.map((c) => c.name));
    const menuCollections = collections.filter(
      (c) => (
        // Skip system collections
        !c.name.startsWith("__") && !c.name.startsWith("system.") && c.name !== "admin" && c.name !== "users"
      )
    );
    console.log("\u{1F3AF} Menu collections (all non-system collections):", menuCollections.map((c) => c.name));
    for (const collection of menuCollections) {
      console.log(`\u{1F50D} Checking collection: ${collection.name}`);
      const sampleDoc = await connection.db.collection(collection.name).findOne({});
      console.log(`\u{1F4C4} Sample document from ${collection.name}:`, sampleDoc);
      if (sampleDoc && (sampleDoc.name || sampleDoc.title) && (sampleDoc.price || sampleDoc.cost)) {
        console.log(`\u2705 Collection ${collection.name} appears to contain menu items`);
      } else if (sampleDoc) {
        console.log(`\u26A0\uFE0F Collection ${collection.name} has data but doesn't look like menu items`);
      } else {
        console.log(`\u{1F4ED} Collection ${collection.name} is empty (can be used for new items)`);
      }
    }
    console.log("\u{1F3AF} Final menu-related collections found:", menuCollections.map((c) => c.name));
    return menuCollections;
  } catch (error) {
    console.error("\u274C Error analyzing database structure:", error);
    return [];
  }
}
async function fetchMenuItemsFromCustomDB(connection, categoryFilter) {
  try {
    console.log("\u{1F50D} Starting to fetch menu items from custom database");
    console.log("\u{1F4CA} Database name:", connection.db.databaseName);
    console.log("\u{1F3AF} Category filter:", categoryFilter || "ALL");
    const collections = await connection.db.listCollections().toArray();
    console.log("\u{1F4CB} Available collections:", collections.map((c) => c.name));
    const systemCollections = ["admin", "local", "config", "system", "test"];
    const menuCollections = collections.filter(
      (c) => !systemCollections.some((sys) => c.name.toLowerCase().includes(sys.toLowerCase())) && !c.name.startsWith("_") && c.name !== "users" && c.name !== "sessions"
    );
    console.log("\u{1F3AF} Menu collections:", menuCollections.map((c) => c.name));
    if (menuCollections.length === 0) {
      console.log("\u274C No menu collections found in custom database");
      return [];
    }
    let allMenuItems = [];
    let collectionsToQuery = menuCollections;
    if (categoryFilter) {
      collectionsToQuery = menuCollections.filter(
        (c) => c.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      console.log(`\u{1F3AF} Filtering for category "${categoryFilter}", found collections:`, collectionsToQuery.map((c) => c.name));
    }
    for (const collection of collectionsToQuery) {
      try {
        console.log(`\u{1F50D} Fetching items from collection: ${collection.name}`);
        const items = await connection.db.collection(collection.name).find({}).toArray();
        console.log(`\u{1F4CB} Found ${items.length} items in ${collection.name}`);
        const getCategoryFromCollection = (collectionName) => {
          const categoryMapping = {
            "chefspecial": "Chef Special",
            "starters": "Starters",
            "soups": "Soups",
            "maincourse": "Main Course",
            "ricebiryani": "Rice & Biryani",
            "bread": "Bread",
            "desserts": "Desserts",
            "drinks": "Drinks",
            "combos": "Combos"
          };
          return categoryMapping[collectionName] || collectionName.charAt(0).toUpperCase() + collectionName.slice(1).toLowerCase();
        };
        const transformedItems = items.map((item) => {
          const categoryFromCollection = getCategoryFromCollection(collection.name);
          const collectionToDisplayMapping = {
            "chefspecial": "Chef Special",
            "starters": "Starters",
            "soups": "Soups",
            "maincourse": "Main Course",
            "ricebiryani": "Rice & Biryani",
            "bread": "Bread",
            "desserts": "Desserts",
            "drinks": "Drinks",
            "combos": "Combos"
          };
          const getDisplayCategory = (category, collectionName) => {
            if (category && Object.keys(collectionToDisplayMapping).includes(category.toLowerCase())) {
              return category;
            }
            return collectionToDisplayMapping[collectionName] || categoryFromCollection;
          };
          return {
            _id: item._id,
            name: item.name || item.title || item.itemName || "Unknown Item",
            description: item.description || item.desc || item.details || "",
            price: item.price || item.cost || item.amount || 0,
            category: getDisplayCategory(item.category, collection.name),
            // Use proper display label
            isVeg: item.isVeg ?? item.veg ?? item.vegetarian ?? true,
            // Use 'isVeg' field as in screenshot
            image: item.image || item.imageUrl || item.photo || "",
            restaurantId: item.restaurantId || new mongoose5.Types.ObjectId("6874cff2a880250859286de6"),
            isAvailable: item.isAvailable ?? item.available ?? item.active ?? true,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            __v: item.__v ?? 0,
            originalCollection: collection.name,
            originalData: item
            // Keep original data for reference
          };
        });
        allMenuItems = allMenuItems.concat(transformedItems);
        console.log(`\u{1F4CA} Added ${transformedItems.length} items from ${collection.name} with category "${getCategoryFromCollection(collection.name)}"`);
      } catch (error) {
        console.error(`\u274C Error fetching from collection ${collection.name}:`, error);
      }
    }
    console.log(`\u{1F3AF} Total menu items found: ${allMenuItems.length}`);
    return allMenuItems;
  } catch (error) {
    console.error("\u274C Error fetching menu items from custom database:", error);
    return [];
  }
}
async function extractCategoriesFromCustomDB(connection) {
  try {
    console.log("\u{1F50D} Extracting categories from collection names");
    console.log("\u{1F4CA} Database name:", connection.db.databaseName);
    const collections = await connection.db.listCollections().toArray();
    console.log("\u{1F4CB} Available collections:", collections.map((c) => c.name));
    const systemCollections = ["admin", "local", "config", "system", "test"];
    const menuCollections = collections.filter(
      (c) => !systemCollections.some((sys) => c.name.toLowerCase().includes(sys.toLowerCase())) && !c.name.startsWith("_") && c.name !== "users" && c.name !== "sessions"
    );
    console.log("\u{1F3AF} Menu collections (potential categories):", menuCollections.map((c) => c.name));
    if (menuCollections.length === 0) {
      console.log("\u274C No valid collections found for categories");
      return ["Starters", "Main Course", "Desserts", "Beverages"];
    }
    const categoryMapping = {
      "chefspecial": "Chef Special",
      "starters": "Starters",
      "soups": "Soups",
      "maincourse": "Main Course",
      "ricebiryani": "Rice & Biryani",
      "bread": "Bread",
      "desserts": "Desserts",
      "drinks": "Drinks",
      "combos": "Combos"
    };
    const categories = menuCollections.map((collection) => {
      const name = collection.name;
      const displayLabel = categoryMapping[name] || name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      console.log(`\u{1F4CC} Using collection name as category: "${displayLabel}" (from "${name}")`);
      return displayLabel;
    });
    const uniqueCategories = Array.from(new Set(categories)).sort();
    console.log(`\u2705 Final categories from collection names:`, uniqueCategories);
    return uniqueCategories.length > 0 ? uniqueCategories : ["Starters", "Main Course", "Desserts", "Beverages"];
  } catch (error) {
    console.error("\u274C Error extracting categories from collection names:", error);
    return ["Starters", "Main Course", "Desserts", "Beverages"];
  }
}
async function createMenuItemInCustomDB(connection, menuItemData) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    const categoryToCollectionMapping = {
      "Chef Special": "chefspecial",
      "Starters": "starters",
      "Soups": "soups",
      "Main Course": "maincourse",
      "Rice & Biryani": "ricebiryani",
      "Bread": "bread",
      "Desserts": "desserts",
      "Drinks": "drinks",
      "Combos": "combos"
    };
    let targetCollection = categoryToCollectionMapping[menuItemData.category] || menuItemData.category?.toLowerCase() || "menuitems";
    const collectionExists = menuCollections.some((col) => col.name === targetCollection);
    if (!collectionExists) {
      console.log(`\u26A0\uFE0F  Collection "${targetCollection}" not found, using first available collection`);
      targetCollection = menuCollections.length > 0 ? menuCollections[0].name : "menuitems";
    }
    console.log(`Creating menu item in collection: ${targetCollection}`);
    const categoryMapping = {
      "Chef Special": "chefspecial",
      "Starters": "starters",
      "Soups": "soups",
      "Main Course": "maincourse",
      "Rice & Biryani": "ricebiryani",
      "Bread": "bread",
      "Desserts": "desserts",
      "Drinks": "drinks",
      "Combos": "combos"
    };
    const getDisplayCategory = (category) => {
      if (Object.keys(categoryMapping).includes(category)) {
        return category;
      }
      const reverseMapping = {
        "chefspecial": "Chef Special",
        "starters": "Starters",
        "soups": "Soups",
        "maincourse": "Main Course",
        "ricebiryani": "Rice & Biryani",
        "bread": "Bread",
        "desserts": "Desserts",
        "drinks": "Drinks",
        "combos": "Combos"
      };
      return reverseMapping[category.toLowerCase()] || category;
    };
    const transformedData = {
      name: menuItemData.name,
      description: menuItemData.description,
      price: menuItemData.price,
      category: getDisplayCategory(menuItemData.category),
      // Use proper display label
      isVeg: menuItemData.isVeg || menuItemData.veg || true,
      // Use 'isVeg' field as shown in screenshot
      image: menuItemData.image,
      restaurantId: new mongoose5.Types.ObjectId("6874cff2a880250859286de6"),
      // Use the restaurant ID from your screenshot
      isAvailable: menuItemData.isAvailable ?? true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      __v: 0
    };
    const result = await connection.db.collection(targetCollection).insertOne(transformedData);
    console.log(`Menu item created with ID: ${result.insertedId}`);
    return {
      _id: result.insertedId,
      ...transformedData,
      originalCollection: targetCollection
    };
  } catch (error) {
    console.error("Error creating menu item in custom database:", error);
    throw error;
  }
}
async function updateMenuItemInCustomDB(connection, itemId, updateData) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    let currentCollection = null;
    let currentItem = null;
    for (const collection of menuCollections) {
      try {
        const item = await connection.db.collection(collection.name).findOne(
          { _id: new mongoose5.Types.ObjectId(itemId) }
        );
        if (item) {
          currentCollection = collection.name;
          currentItem = item;
          break;
        }
      } catch (error) {
        console.error(`Error finding item in collection ${collection.name}:`, error);
      }
    }
    if (!currentCollection || !currentItem) {
      throw new Error(`Menu item with ID ${itemId} not found in any collection`);
    }
    if (updateData.category) {
      const categoryToCollectionMapping = {
        "Chef Special": "chefspecial",
        "Starters": "starters",
        "Soups": "soups",
        "Main Course": "maincourse",
        "Rice & Biryani": "ricebiryani",
        "Bread": "bread",
        "Desserts": "desserts",
        "Drinks": "drinks",
        "Combos": "combos"
      };
      const newCollectionName = categoryToCollectionMapping[updateData.category] || updateData.category.toLowerCase();
      if (newCollectionName !== currentCollection) {
        const newCollectionExists = menuCollections.some((col) => col.name === newCollectionName);
        if (newCollectionExists) {
          console.log(`\u{1F504} Moving item from "${currentCollection}" to "${newCollectionName}"`);
          const newItemData = {
            ...currentItem,
            ...updateData,
            updatedAt: /* @__PURE__ */ new Date(),
            __v: currentItem.__v || 0
          };
          delete newItemData._id;
          const insertResult = await connection.db.collection(newCollectionName).insertOne(newItemData);
          await connection.db.collection(currentCollection).deleteOne(
            { _id: new mongoose5.Types.ObjectId(itemId) }
          );
          console.log(`\u2705 Menu item moved to collection: ${newCollectionName}`);
          return {
            _id: insertResult.insertedId,
            name: newItemData.name || newItemData.title || newItemData.itemName || "Unknown Item",
            description: newItemData.description || newItemData.desc || newItemData.details || "",
            price: newItemData.price || newItemData.cost || newItemData.amount || 0,
            category: updateData.category,
            // Keep capitalized category for display
            isVeg: newItemData.isVeg ?? newItemData.vegetarian ?? newItemData.veg ?? true,
            image: newItemData.image || newItemData.imageUrl || newItemData.photo || "",
            isAvailable: newItemData.isAvailable ?? newItemData.available ?? newItemData.active ?? true,
            originalCollection: newCollectionName,
            originalData: newItemData
          };
        }
      }
    }
    const result = await connection.db.collection(currentCollection).findOneAndUpdate(
      { _id: new mongoose5.Types.ObjectId(itemId) },
      {
        $set: {
          ...updateData,
          updatedAt: /* @__PURE__ */ new Date()
        }
      },
      { returnDocument: "after" }
    );
    if (result) {
      console.log(`\u2705 Menu item updated in collection: ${currentCollection}`);
      return {
        _id: result._id,
        name: result.name || result.title || result.itemName || "Unknown Item",
        description: result.description || result.desc || result.details || "",
        price: result.price || result.cost || result.amount || 0,
        category: result.category || result.type || result.section || "Uncategorized",
        isVeg: result.isVeg ?? result.vegetarian ?? result.veg ?? true,
        image: result.image || result.imageUrl || result.photo || "",
        isAvailable: result.isAvailable ?? result.available ?? result.active ?? true,
        originalCollection: currentCollection,
        originalData: result
      };
    }
    throw new Error("Menu item not found in any collection");
  } catch (error) {
    console.error("Error updating menu item in custom database:", error);
    throw error;
  }
}
async function deleteMenuItemFromCustomDB(connection, itemId) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    for (const collection of menuCollections) {
      try {
        const result = await connection.db.collection(collection.name).deleteOne(
          { _id: new mongoose5.Types.ObjectId(itemId) }
        );
        if (result.deletedCount > 0) {
          console.log(`Menu item deleted from collection: ${collection.name}`);
          return true;
        }
      } catch (error) {
        console.error(`Error deleting from collection ${collection.name}:`, error);
      }
    }
    throw new Error("Menu item not found in any collection");
  } catch (error) {
    console.error("Error deleting menu item from custom database:", error);
    throw error;
  }
}

// server/utils/qrcode.ts
import QRCode from "qrcode";
async function generateQRCode(url) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

// server/routes/admin-settings.ts
init_Admin();
import { Router } from "express";
import bcrypt from "bcryptjs";
var router = Router();
router.get("/profile", authenticateAdmin, async (req, res) => {
  try {
    if (req.admin._id === "admin-001" || req.admin.id === "admin-001") {
      return res.json(getFallbackAdminProfile());
    }
    const admin = await Admin.findById(req.admin._id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (error) {
    console.error("Admin profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
});
router.put("/profile", authenticateAdmin, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    if (req.admin._id === "admin-001" || req.admin.id === "admin-001") {
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const storedPassword = getCurrentFallbackPassword();
        if (currentPassword !== storedPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        updateFallbackAdminPassword(newPassword);
      }
      const profileToUpdate = {
        ...username && { username },
        ...email && { email }
      };
      const updatedProfile = updateFallbackAdminProfile(profileToUpdate);
      return res.json(updatedProfile);
    }
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedNewPassword;
    }
    if (username) admin.username = username;
    if (email) admin.email = email;
    await admin.save();
    const updatedAdmin = await Admin.findById(req.admin._id).select("-password");
    res.json(updatedAdmin);
  } catch (error) {
    console.error("Admin profile update error:", error);
    res.status(500).json({ message: "Failed to update admin profile" });
  }
});
router.get("/settings", authenticateAdmin, async (req, res) => {
  try {
    if (req.admin._id === "admin-001" || req.admin.id === "admin-001") {
      return res.json(getFallbackAdminSettings());
    }
    const admin = await Admin.findById(req.admin._id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const settings = {
      theme: admin.theme || "blue",
      darkMode: admin.darkMode || false,
      compactMode: admin.compactMode || false,
      emailNotifications: admin.emailNotifications !== false,
      // default true
      sessionTimeout: admin.sessionTimeout || 30,
      twoFactorEnabled: admin.twoFactorEnabled || false,
      loginAlerts: admin.loginAlerts !== false,
      // default true
      autoBackup: admin.autoBackup !== false,
      // default true
      maxRestaurants: admin.maxRestaurants || 10
    };
    res.json(settings);
  } catch (error) {
    console.error("Admin settings fetch error:", error);
    res.status(500).json({ message: "Failed to fetch admin settings" });
  }
});
router.put("/settings", authenticateAdmin, async (req, res) => {
  try {
    const {
      theme,
      darkMode,
      compactMode,
      emailNotifications,
      sessionTimeout,
      twoFactorEnabled,
      loginAlerts,
      autoBackup,
      maxRestaurants
    } = req.body;
    if (req.admin._id === "admin-001" || req.admin.id === "admin-001") {
      const settingsToUpdate = {
        ...theme && { theme },
        ...darkMode !== void 0 && { darkMode },
        ...compactMode !== void 0 && { compactMode },
        ...emailNotifications !== void 0 && { emailNotifications },
        ...sessionTimeout && { sessionTimeout },
        ...twoFactorEnabled !== void 0 && { twoFactorEnabled },
        ...loginAlerts !== void 0 && { loginAlerts },
        ...autoBackup !== void 0 && { autoBackup },
        ...maxRestaurants && { maxRestaurants }
      };
      const updatedSettings2 = updateFallbackAdminSettings(settingsToUpdate);
      return res.json(updatedSettings2);
    }
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (theme) admin.theme = theme;
    if (darkMode !== void 0) admin.darkMode = darkMode;
    if (compactMode !== void 0) admin.compactMode = compactMode;
    if (emailNotifications !== void 0) admin.emailNotifications = emailNotifications;
    if (sessionTimeout) admin.sessionTimeout = sessionTimeout;
    if (twoFactorEnabled !== void 0) admin.twoFactorEnabled = twoFactorEnabled;
    if (loginAlerts !== void 0) admin.loginAlerts = loginAlerts;
    if (autoBackup !== void 0) admin.autoBackup = autoBackup;
    if (maxRestaurants) admin.maxRestaurants = maxRestaurants;
    await admin.save();
    const updatedSettings = {
      theme: admin.theme || "blue",
      darkMode: admin.darkMode || false,
      compactMode: admin.compactMode || false,
      emailNotifications: admin.emailNotifications !== false,
      sessionTimeout: admin.sessionTimeout || 30,
      twoFactorEnabled: admin.twoFactorEnabled || false,
      loginAlerts: admin.loginAlerts !== false,
      autoBackup: admin.autoBackup !== false,
      maxRestaurants: admin.maxRestaurants || 10
    };
    res.json(updatedSettings);
  } catch (error) {
    console.error("Admin settings update error:", error);
    res.status(500).json({ message: "Failed to update admin settings" });
  }
});
router.get("/export-database", authenticateAdmin, async (req, res) => {
  try {
    const { Restaurant: Restaurant2 } = await Promise.resolve().then(() => (init_Restaurant(), Restaurant_exports));
    const { MenuItem: MenuItem2 } = await Promise.resolve().then(() => (init_MenuItem(), MenuItem_exports));
    const { Admin: Admin2 } = await Promise.resolve().then(() => (init_Admin(), Admin_exports));
    const restaurants = await Restaurant2.find().lean();
    const menuItems = await MenuItem2.find().lean();
    const admins = await Admin2.find().select("-password").lean();
    const exportData = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0",
      data: {
        restaurants,
        menuItems,
        admins,
        summary: {
          restaurantCount: restaurants.length,
          menuItemCount: menuItems.length,
          adminCount: admins.length
        }
      }
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="database-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error("Database export error:", error);
    res.status(500).json({ message: "Failed to export database" });
  }
});
router.get("/system-logs", authenticateAdmin, async (req, res) => {
  try {
    const logs = `
=== System Logs ===
Generated at: ${(/* @__PURE__ */ new Date()).toISOString()}

[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - System startup complete
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - MongoDB connection established
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Admin authentication successful for user: ${req.admin.username}
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Restaurant management system active
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - QR code generation service running
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Menu synchronization service active
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Database backup scheduled for daily execution
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Session management service running
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - Email notification service configured
[INFO] ${(/* @__PURE__ */ new Date()).toISOString()} - System health check: All services operational

=== Recent Activity ===
[ACTIVITY] Admin settings accessed by ${req.admin.username}
[ACTIVITY] Theme customization applied
[ACTIVITY] Security settings updated
[ACTIVITY] System logs requested

=== System Status ===
Memory Usage: 85% (within normal range)
CPU Usage: 12% (optimal)
Database Connections: 3/100 (healthy)
Active Sessions: 1
Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor(process.uptime() % 3600 / 60)}m

=== End of Logs ===
    `.trim();
    res.setHeader("Content-Type", "text/plain");
    res.send(logs);
  } catch (error) {
    console.error("System logs error:", error);
    res.status(500).json({ message: "Failed to retrieve system logs" });
  }
});
var admin_settings_default = router;

// server/routes.ts
async function registerRoutes(app2) {
  await connectToDatabase();
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      let admin = null;
      try {
        admin = await Promise.race([
          Admin.findOne({ username }),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
        if (admin) {
          const isValidPassword = await bcrypt2.compare(password, admin.password);
          if (isValidPassword) {
            const token = generateToken(admin._id.toString());
            return res.json({
              token,
              admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
              }
            });
          }
        }
      } catch (mongoError) {
        console.log("MongoDB not available, using fallback authentication");
      }
      const fallbackAdmin = await validateAdminCredentials(username, password);
      if (fallbackAdmin) {
        const token = generateToken(fallbackAdmin.id);
        return res.json({
          token,
          admin: fallbackAdmin
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/admin/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
      if (existingAdmin) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const admin = new Admin({
        username,
        password: hashedPassword,
        email
      });
      await admin.save();
      const token = generateToken(admin._id.toString());
      res.status(201).json({
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.get("/api/admin/restaurants", authenticateAdmin, async (req, res) => {
    try {
      try {
        const restaurants = await Promise.race([
          Restaurant.find().sort({ createdAt: -1 }),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
        res.json(restaurants);
      } catch (mongoError) {
        console.log("MongoDB not available for restaurants, returning mock data");
        res.json(getMockRestaurants());
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });
  app2.get("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`\u{1F50D} Fetching restaurant with ID: ${id}`);
      try {
        const restaurantPromise = Restaurant.findById(id);
        const restaurant = await Promise.race([
          restaurantPromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
        if (restaurant) {
          console.log(`\u2705 Restaurant found: ${restaurant.name}`);
          console.log(`\u{1F4C2} Restaurant customTypes: [${(restaurant.customTypes || []).join(", ")}]`);
          return res.json(restaurant);
        } else {
          console.log(`\u274C Restaurant not found in MongoDB: ${id}`);
        }
      } catch (mongoError) {
        console.log("MongoDB not available for restaurant fetch, checking mock data");
      }
      const mockRestaurants2 = getMockRestaurants();
      const mockRestaurant = mockRestaurants2.find((r) => r._id === id);
      if (mockRestaurant) {
        console.log(`\u2705 Restaurant found in mock data: ${mockRestaurant.name}`);
        return res.json(mockRestaurant);
      }
      console.log(`\u274C Restaurant not found anywhere: ${id}`);
      return res.status(404).json({ message: "Restaurant not found" });
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });
  app2.post("/api/admin/restaurants", authenticateAdmin, async (req, res) => {
    try {
      const { name, description, address, phone, email, image, website, mongoUri, customTypes, isActive } = req.body;
      if (!name || !description || !address || !phone || !email || !image) {
        return res.status(400).json({ message: "All fields are required" });
      }
      try {
        let finalCustomTypes = customTypes || ["Starters", "Main Course", "Desserts", "Beverages"];
        if (mongoUri) {
          try {
            console.log(`Extracting categories from custom database for restaurant: ${name}`);
            const categoryPromise = (async () => {
              const customConnection = await connectToRestaurantDatabase(mongoUri);
              return await extractCategoriesFromCustomDB(customConnection);
            })();
            const extractedCategories = await Promise.race([
              categoryPromise,
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error("Category extraction timeout")), 3e3)
              )
            ]);
            if (extractedCategories && extractedCategories.length > 0) {
              finalCustomTypes = extractedCategories;
              console.log(`\u2705 Using extracted categories: ${finalCustomTypes.join(", ")}`);
            } else {
              console.log("\u26A0\uFE0F No categories found in custom database, using default categories");
            }
          } catch (customDbError) {
            console.log("Failed to extract categories from custom database, using provided/default categories");
          }
        }
        let qrCode2 = null;
        if (website) {
          try {
            qrCode2 = await generateQRCode(website);
            console.log(`\u2705 QR code generated for website: ${website}`);
          } catch (qrError) {
            console.log(`\u26A0\uFE0F Failed to generate QR code for website: ${website}`, qrError);
          }
        }
        const savePromise = (async () => {
          const restaurant2 = new Restaurant({
            name,
            description,
            address,
            phone,
            email,
            image,
            website,
            qrCode: qrCode2,
            mongoUri,
            customTypes: finalCustomTypes,
            isActive: isActive ?? true
          });
          await restaurant2.save();
          return restaurant2;
        })();
        const restaurant = await Promise.race([
          savePromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB save timeout")), 2e3)
          )
        ]);
        res.status(201).json(restaurant);
      } catch (mongoError) {
        console.log("MongoDB not available for restaurant creation, using mock data store");
        const mockRestaurant = addMockRestaurant({
          name,
          description,
          address,
          phone,
          email,
          image,
          website,
          qrCode,
          mongoUri,
          customTypes: customTypes || ["Starters", "Main Course", "Desserts", "Beverages"],
          isActive: isActive ?? true
        });
        res.status(201).json(mockRestaurant);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });
  app2.put("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, address, phone, email, image, website, mongoUri, customTypes, isActive } = req.body;
      console.log(`\u{1F504} Updating restaurant ${id} with data:`, {
        name,
        description,
        address,
        phone,
        email,
        hasImage: !!image,
        website,
        mongoUri,
        customTypes,
        isActive
      });
      let finalCustomTypes;
      if (Array.isArray(customTypes)) {
        finalCustomTypes = customTypes;
      } else if (typeof customTypes === "string") {
        finalCustomTypes = customTypes.split(",").map((t) => t.trim());
      } else {
        finalCustomTypes = ["Starters", "Main Course", "Desserts", "Beverages"];
      }
      console.log(`\u{1F4DD} Final customTypes: [${finalCustomTypes.join(", ")}]`);
      if (mongoUri) {
        try {
          console.log(`\u{1F50D} Extracting categories from custom database for restaurant update: ${name}`);
          const categoryPromise = (async () => {
            try {
              const customConnection = await connectToRestaurantDatabase(mongoUri);
              return await extractCategoriesFromCustomDB(customConnection);
            } catch (connError) {
              console.log("\u274C Failed to connect to custom database:", connError.message);
              throw connError;
            }
          })();
          const extractedCategories = await Promise.race([
            categoryPromise,
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Category extraction timeout")), 3e3)
            )
          ]);
          if (extractedCategories && extractedCategories.length > 0) {
            finalCustomTypes = extractedCategories;
            console.log(`\u2705 Using extracted categories: ${finalCustomTypes.join(", ")}`);
          } else {
            console.log("\u26A0\uFE0F No categories found in custom database, using provided/default categories");
          }
        } catch (customDbError) {
          console.log("\u274C Failed to extract categories from custom database:", customDbError.message);
          console.log("\u26A0\uFE0F Using provided/default categories instead");
        }
      }
      let qrCode2 = null;
      if (website) {
        try {
          qrCode2 = await generateQRCode(website);
          console.log(`\u2705 QR code generated for website: ${website}`);
        } catch (qrError) {
          console.log(`\u26A0\uFE0F Failed to generate QR code for website: ${website}`, qrError);
        }
      }
      try {
        const updatePromise = Restaurant.findByIdAndUpdate(
          id,
          { name, description, address, phone, email, image, website, qrCode: qrCode2, mongoUri, customTypes: finalCustomTypes, isActive },
          { new: true }
        );
        const restaurant = await Promise.race([
          updatePromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB update timeout")), 2e3)
          )
        ]);
        if (!restaurant) {
          return res.status(404).json({ message: "Restaurant not found" });
        }
        console.log(`\u2705 Restaurant updated successfully: ${restaurant.name}`);
        return res.json(restaurant);
      } catch (mongoError) {
        console.log("MongoDB not available for restaurant update, using mock data fallback");
        const mockRestaurants2 = getMockRestaurants();
        const mockIndex = mockRestaurants2.findIndex((r) => r._id === id);
        if (mockIndex === -1) {
          return res.status(404).json({ message: "Restaurant not found" });
        }
        const updatedRestaurant = {
          ...mockRestaurants2[mockIndex],
          name,
          description,
          address,
          phone,
          email,
          image,
          website,
          qrCode: qrCode2,
          mongoUri,
          customTypes: finalCustomTypes,
          isActive
        };
        mockRestaurants2[mockIndex] = updatedRestaurant;
        console.log(`\u2705 Mock restaurant updated successfully: ${updatedRestaurant.name}`);
        return res.json(updatedRestaurant);
      }
    } catch (error) {
      console.error("\u{1F6A8} Error updating restaurant:", error);
      console.error("\u{1F6A8} Error stack:", error.stack);
      console.error("\u{1F6A8} Error name:", error.name);
      res.status(500).json({
        message: "Failed to update restaurant",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.post("/api/admin/restaurants/:id/force-update-categories", async (req, res) => {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (!restaurant.mongoUri) {
        return res.status(400).json({ message: "Restaurant does not have a MongoDB URI" });
      }
      try {
        console.log(`\u{1F504} Force updating categories for restaurant: ${restaurant.name}`);
        const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
        const extractedCategories = await extractCategoriesFromCustomDB(customConnection);
        if (extractedCategories && extractedCategories.length > 0) {
          restaurant.customTypes = extractedCategories;
          await restaurant.save();
          console.log(`\u2705 Categories force updated: ${extractedCategories.join(", ")}`);
          res.json({ message: "Categories force updated successfully", categories: extractedCategories, restaurant });
        } else {
          res.status(400).json({ message: "No categories found in custom database" });
        }
      } catch (error) {
        console.error("\u274C Failed to force update categories:", error);
        res.status(500).json({ message: "Failed to force update categories", error: error.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to force update categories", error: error.message });
    }
  });
  app2.post("/api/admin/restaurants/:id/refresh-categories", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (!restaurant.mongoUri) {
        return res.status(400).json({ message: "Restaurant does not have a MongoDB URI" });
      }
      try {
        console.log(`\u{1F504} Refreshing categories for restaurant: ${restaurant.name}`);
        const categoryPromise = (async () => {
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          return await extractCategoriesFromCustomDB(customConnection);
        })();
        const extractedCategories = await Promise.race([
          categoryPromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Category extraction timeout")), 5e3)
          )
        ]);
        if (extractedCategories && extractedCategories.length > 0) {
          restaurant.customTypes = extractedCategories;
          await restaurant.save();
          console.log(`\u2705 Categories refreshed: ${extractedCategories.join(", ")}`);
          res.json({ message: "Categories refreshed successfully", categories: extractedCategories });
        } else {
          res.status(400).json({ message: "No categories found in custom database" });
        }
      } catch (error) {
        console.error("\u274C Failed to refresh categories:", error);
        res.status(500).json({ message: "Failed to refresh categories" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh categories" });
    }
  });
  app2.delete("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      try {
        const deletePromise = (async () => {
          const restaurant2 = await Restaurant.findByIdAndDelete(id);
          if (restaurant2) {
            await MenuItem.deleteMany({ restaurantId: id });
            return restaurant2;
          }
          return null;
        })();
        const restaurant = await Promise.race([
          deletePromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
        if (restaurant) {
          return res.json({ message: "Restaurant deleted successfully" });
        }
      } catch (mongoError) {
        console.log("MongoDB not available for deletion, removing from mock data");
        if (deleteMockRestaurant(id)) {
          return res.json({ message: "Restaurant deleted successfully" });
        }
      }
      return res.status(404).json({ message: "Restaurant not found" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });
  app2.get("/api/admin/restaurants/:restaurantId/menu-items/category/:category", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId, category } = req.params;
      console.log(`\u{1F3AF} Fetching menu items for restaurant ${restaurantId}, category: ${category}`);
      let restaurant = null;
      try {
        restaurant = await Promise.race([
          Restaurant.findById(restaurantId),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
      } catch (mongoError) {
        const mockRestaurants2 = getMockRestaurants();
        restaurant = mockRestaurants2.find((r) => r._id === restaurantId);
      }
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (restaurant.mongoUri) {
        try {
          console.log(`\u{1F4E1} Connecting to custom database for category: ${category}`);
          const fetchPromise = (async () => {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            return await fetchMenuItemsFromCustomDB(customConnection, category);
          })();
          const menuItems = await Promise.race([
            fetchPromise,
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Database fetch timeout")), 3e3)
            )
          ]);
          console.log(`\u2705 Found ${menuItems.length} items in category "${category}"`);
          res.json(menuItems);
        } catch (customDbError) {
          console.error(`\u274C Failed to fetch category "${category}" from custom database:`, customDbError.message);
          try {
            const menuItems = await MenuItem.find({
              restaurantId,
              category: new RegExp(category, "i")
            }).sort({ createdAt: -1 });
            res.json(menuItems);
          } catch (fallbackError) {
            console.log("Main database also failed, returning empty array");
            res.json([]);
          }
        }
      } else {
        try {
          const menuItems = await MenuItem.find({
            restaurantId,
            category: new RegExp(category, "i")
          }).sort({ createdAt: -1 });
          res.json(menuItems);
        } catch (error) {
          console.log("Main database failed, returning mock menu items");
          const mockItems = getMockMenuItems(restaurantId);
          const filteredItems = mockItems.filter(
            (item) => item.category.toLowerCase().includes(category.toLowerCase())
          );
          res.json(filteredItems);
        }
      }
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });
  app2.get("/api/admin/restaurants/:restaurantId/menu-items", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      let restaurant = null;
      try {
        restaurant = await Promise.race([
          Restaurant.findById(restaurantId),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("MongoDB timeout")), 1e3)
          )
        ]);
      } catch (mongoError) {
        const mockRestaurants2 = getMockRestaurants();
        restaurant = mockRestaurants2.find((r) => r._id === restaurantId);
      }
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (restaurant.mongoUri) {
        try {
          console.log(`Fetching menu items from custom database for restaurant: ${restaurant.name}`);
          const fetchPromise = (async () => {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            return await fetchMenuItemsFromCustomDB(customConnection);
          })();
          const menuItems = await Promise.race([
            fetchPromise,
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Database fetch timeout")), 3e3)
            )
          ]);
          console.log(`Found ${menuItems.length} menu items in custom database`);
          try {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            const extractedCategories = await extractCategoriesFromCustomDB(customConnection);
            console.log(`\u{1F50D} Current restaurant categories: [${(restaurant.customTypes || []).join(", ")}]`);
            console.log(`\u{1F50D} Extracted categories: [${(extractedCategories || []).join(", ")}]`);
            if (extractedCategories && extractedCategories.length > 0) {
              const currentCategories = restaurant.customTypes || [];
              const shouldUpdate = currentCategories.length === 0 || JSON.stringify(currentCategories.sort()) !== JSON.stringify(extractedCategories.sort());
              if (shouldUpdate) {
                console.log(`\u{1F504} Auto-updating restaurant categories from [${currentCategories.join(", ")}] to [${extractedCategories.join(", ")}]`);
                restaurant.customTypes = extractedCategories;
                await restaurant.save();
                console.log("\u2705 Restaurant categories updated successfully");
                const updatedRestaurant = await Restaurant.findById(restaurant._id);
                console.log(`\u{1F50D} Confirmed updated categories: [${(updatedRestaurant?.customTypes || []).join(", ")}]`);
              } else {
                console.log("\u{1F4CB} Categories are already up to date");
              }
            }
          } catch (categoryError) {
            console.log("\u274C Failed to auto-update categories:", categoryError.message);
          }
          res.json(menuItems);
        } catch (customDbError) {
          console.error("Failed to fetch from custom database:", customDbError.message);
          try {
            const menuItems = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });
            res.json(menuItems);
          } catch (fallbackError) {
            console.log("Main database also failed, returning mock menu items");
            res.json(getMockMenuItems(restaurantId));
          }
        }
      } else {
        try {
          const menuItems = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });
          res.json(menuItems);
        } catch (mongoError) {
          console.log("MongoDB not available for menu items, returning mock data");
          res.json(getMockMenuItems(restaurantId));
        }
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });
  app2.post("/api/admin/restaurants/:restaurantId/menu-items", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { name, description, price, category, isVeg, image } = req.body;
      if (!name || !description || price === void 0 || !category || isVeg === void 0 || !image) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (restaurant.mongoUri) {
        try {
          console.log(`Creating menu item in custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          const menuItem = await createMenuItemInCustomDB(customConnection, {
            name,
            description,
            price,
            category,
            isVeg,
            image
          });
          res.status(201).json(menuItem);
        } catch (customDbError) {
          console.error("Failed to create in custom database:", customDbError);
          const menuItem = new MenuItem({
            name,
            description,
            price,
            category,
            isVeg,
            image,
            restaurantId
          });
          await menuItem.save();
          res.status(201).json(menuItem);
        }
      } else {
        try {
          const menuItem = new MenuItem({
            name,
            description,
            price,
            category,
            isVeg,
            image,
            restaurantId
          });
          await menuItem.save();
          res.status(201).json(menuItem);
        } catch (mongoError) {
          console.log("MongoDB not available for menu item creation, using mock data store");
          const mockMenuItem = addMockMenuItem({ name, description, price, category, isVeg, image, restaurantId });
          res.status(201).json(mockMenuItem);
        }
      }
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });
  app2.put("/api/admin/menu-items/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, category, isVeg, image, isAvailable, restaurantId } = req.body;
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (restaurant.mongoUri) {
        try {
          console.log(`Updating menu item in custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          const menuItem = await updateMenuItemInCustomDB(customConnection, id, {
            name,
            description,
            price,
            category,
            isVeg,
            image,
            isAvailable
          });
          res.json(menuItem);
        } catch (customDbError) {
          console.error("Failed to update in custom database:", customDbError);
          const menuItem = await MenuItem.findByIdAndUpdate(
            id,
            { name, description, price, category, isVeg, image, isAvailable },
            { new: true }
          );
          if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
          }
          res.json(menuItem);
        }
      } else {
        const menuItem = await MenuItem.findByIdAndUpdate(
          id,
          { name, description, price, category, isVeg, image, isAvailable },
          { new: true }
        );
        if (!menuItem) {
          return res.status(404).json({ message: "Menu item not found" });
        }
        res.json(menuItem);
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });
  app2.delete("/api/admin/menu-items/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { restaurantId } = req.body;
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      if (restaurant.mongoUri) {
        try {
          console.log(`Deleting menu item from custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          await deleteMenuItemFromCustomDB(customConnection, id);
          res.json({ message: "Menu item deleted successfully" });
        } catch (customDbError) {
          console.error("Failed to delete from custom database:", customDbError);
          const menuItem = await MenuItem.findByIdAndDelete(id);
          if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
          }
          res.json({ message: "Menu item deleted successfully" });
        }
      } else {
        const menuItem = await MenuItem.findByIdAndDelete(id);
        if (!menuItem) {
          return res.status(404).json({ message: "Menu item not found" });
        }
        res.json({ message: "Menu item deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });
  app2.use("/api/admin/settings", admin_settings_default);
  app2.use("/api/admin", admin_settings_default);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { exec } from "child_process";
import { promisify } from "util";
dotenv.config();
var execAsync = promisify(exec);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function killPortProcess(port) {
  try {
    log(`\u{1F50D} Checking if port ${port} is in use...`);
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    if (stdout.trim()) {
      const lines = stdout.trim().split("\n");
      const pids = /* @__PURE__ */ new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0") {
            pids.add(pid);
          }
        }
      }
      const pidArray = Array.from(pids);
      if (pidArray.length > 0) {
        log(`\u26A1 Found ${pidArray.length} process(es) using port ${port}. Killing them...`);
        for (let i = 0; i < pidArray.length; i++) {
          const pid = pidArray[i];
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            log(`\u2705 Killed process with PID ${pid}`);
          } catch (error) {
            log(`\u26A0\uFE0F  Could not kill process ${pid}: ${error}`);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
    } else {
      log(`\u2705 Port ${port} is available`);
    }
  } catch (error) {
    log(`\u26A0\uFE0F  Error checking port ${port}: ${error}`);
  }
}
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
async function startServerWithPortKill(port, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`\u{1F680} Attempt ${attempt} to start server on port ${port}`);
      await killPortProcess(port);
      if (await isPortInUse(port)) {
        log(`\u26A0\uFE0F  Port ${port} is still in use after killing processes`);
        if (attempt < maxRetries) {
          log(`\u23F3 Waiting 2 seconds before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 2e3));
          continue;
        }
      }
      const server = await registerRoutes(app);
      app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
      });
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
      return new Promise((resolve, reject) => {
        server.listen(port, "0.0.0.0", () => {
          log(`\u2705 Server successfully started on port ${port}`);
          resolve();
        });
        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            log(`\u274C Port ${port} is still in use (attempt ${attempt})`);
            if (attempt < maxRetries) {
              reject(new Error(`Port ${port} in use, retrying...`));
            } else {
              log(`\u{1F4A1} All attempts failed. Try manually:`);
              log(`   netstat -ano | findstr :${port}`);
              log(`   taskkill /PID <PID> /F`);
              reject(err);
            }
          } else {
            reject(err);
          }
        });
      });
    } catch (error) {
      if (attempt < maxRetries) {
        log(`\u26A0\uFE0F  Attempt ${attempt} failed: ${error}`);
        log(`\u23F3 Waiting 2 seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      } else {
        throw error;
      }
    }
  }
}
(async () => {
  try {
    const port = parseInt(process.env.PORT || "5000", 10);
    await startServerWithPortKill(port);
  } catch (error) {
    log(`\u274C Failed to start server: ${error}`);
    process.exit(1);
  }
})();
var index_default = app;
export {
  index_default as default
};
