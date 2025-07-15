import type { Express } from "express";
import { createServer, type Server } from "http";
// Removed storage and cart schema imports - Admin-only system
import { connectToDatabase } from "./db/mongodb";
import { Restaurant } from "./models/Restaurant";
import { MenuItem } from "./models/MenuItem";
import { Admin } from "./models/Admin";
import { authenticateAdmin, generateToken, AuthRequest } from "./middleware/auth";
import bcrypt from "bcryptjs";
import { validateAdminCredentials } from "./fallback-auth";
import { getMockRestaurants, addMockRestaurant, getMockMenuItems, addMockMenuItem, deleteMockRestaurant } from "./mock-data";
import { connectToRestaurantDatabase, getMenuItemModel, fetchMenuItemsFromCustomDB, createMenuItemInCustomDB, updateMenuItemInCustomDB, deleteMenuItemFromCustomDB, extractCategoriesFromCustomDB } from "./db/dynamic-mongodb";
import { generateQRCode } from "./utils/qrcode";
import adminSettingsRoutes from "./routes/admin-settings";

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectToDatabase();
  // Customer-facing routes removed - Admin-only system

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Try MongoDB first with quick timeout, then fallback
      let admin = null;
      
      try {
        admin = await Promise.race([
          Admin.findOne({ username }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
        
        if (admin) {
          const isValidPassword = await bcrypt.compare(password, admin.password);
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
        // MongoDB connection failed or timeout, use fallback quickly
        console.log("MongoDB not available, using fallback authentication");
      }

      // Try fallback authentication
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

  app.post("/api/admin/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }

      const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
      if (existingAdmin) {
        return res.status(400).json({ message: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
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

  // Restaurant Management Routes
  app.get("/api/admin/restaurants", authenticateAdmin, async (req, res) => {
    try {
      // Try MongoDB first with quick timeout, then fallback
      try {
        const restaurants = await Promise.race([
          Restaurant.find().sort({ createdAt: -1 }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
        res.json(restaurants);
      } catch (mongoError) {
        // MongoDB not available or timeout, return mock data quickly
        console.log("MongoDB not available for restaurants, returning mock data");
        res.json(getMockRestaurants());
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Get single restaurant by ID
  app.get("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Fetching restaurant with ID: ${id}`);
      
      // Try MongoDB first with quick timeout, then fallback
      try {
        const restaurantPromise = Restaurant.findById(id);
        const restaurant = await Promise.race([
          restaurantPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
        
        if (restaurant) {
          console.log(`✅ Restaurant found: ${restaurant.name}`);
          console.log(`📂 Restaurant customTypes: [${(restaurant.customTypes || []).join(', ')}]`);
          return res.json(restaurant);
        } else {
          console.log(`❌ Restaurant not found in MongoDB: ${id}`);
        }
      } catch (mongoError) {
        console.log("MongoDB not available for restaurant fetch, checking mock data");
      }
      
      // Try mock data as fallback
      const mockRestaurants = getMockRestaurants();
      const mockRestaurant = mockRestaurants.find(r => r._id === id);
      
      if (mockRestaurant) {
        console.log(`✅ Restaurant found in mock data: ${mockRestaurant.name}`);
        return res.json(mockRestaurant);
      }
      
      console.log(`❌ Restaurant not found anywhere: ${id}`);
      return res.status(404).json({ message: "Restaurant not found" });
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/admin/restaurants", authenticateAdmin, async (req, res) => {
    try {
      const { name, description, address, phone, email, image, website, mongoUri, customTypes, isActive } = req.body;
      
      if (!name || !description || !address || !phone || !email || !image) {
        return res.status(400).json({ message: "All fields are required" });
      }

      try {
        let finalCustomTypes = customTypes || ['Starters', 'Main Course', 'Desserts', 'Beverages'];
        
        // If mongoUri is provided, try to extract categories with timeout
        if (mongoUri) {
          try {
            console.log(`Extracting categories from custom database for restaurant: ${name}`);
            
            const categoryPromise = (async () => {
              const customConnection = await connectToRestaurantDatabase(mongoUri);
              return await extractCategoriesFromCustomDB(customConnection);
            })();
            
            const extractedCategories = await Promise.race([
              categoryPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Category extraction timeout")), 3000)
              )
            ]);
            
            if (extractedCategories && extractedCategories.length > 0) {
              finalCustomTypes = extractedCategories;
              console.log(`✅ Using extracted categories: ${finalCustomTypes.join(', ')}`);
            } else {
              console.log('⚠️ No categories found in custom database, using default categories');
            }
          } catch (customDbError) {
            console.log('Failed to extract categories from custom database, using provided/default categories');
          }
        }

        // Generate QR code if website is provided
        let qrCode = null;
        if (website) {
          try {
            qrCode = await generateQRCode(website);
            console.log(`✅ QR code generated for website: ${website}`);
          } catch (qrError) {
            console.log(`⚠️ Failed to generate QR code for website: ${website}`, qrError);
          }
        }

        // Try to save to MongoDB with timeout
        const savePromise = (async () => {
          const restaurant = new Restaurant({
            name,
            description,
            address,
            phone,
            email,
            image,
            website,
            qrCode,
            mongoUri,
            customTypes: finalCustomTypes,
            isActive: isActive ?? true
          });
          
          await restaurant.save();
          return restaurant;
        })();
        
        const restaurant = await Promise.race([
          savePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB save timeout")), 2000)
          )
        ]);
        
        res.status(201).json(restaurant);
      } catch (mongoError) {
        // MongoDB not available, add to mock data store
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
          customTypes: customTypes || ['Starters', 'Main Course', 'Desserts', 'Beverages'],
          isActive: isActive ?? true
        });
        res.status(201).json(mockRestaurant);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.put("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, address, phone, email, image, website, mongoUri, customTypes, isActive } = req.body;

      console.log(`🔄 Updating restaurant ${id} with data:`, {
        name, description, address, phone, email, 
        hasImage: !!image, website, mongoUri, customTypes, isActive
      });

      // Handle customTypes properly - it can be an array or a string
      let finalCustomTypes;
      if (Array.isArray(customTypes)) {
        finalCustomTypes = customTypes;
      } else if (typeof customTypes === 'string') {
        finalCustomTypes = customTypes.split(',').map((t: string) => t.trim());
      } else {
        finalCustomTypes = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
      }

      console.log(`📝 Final customTypes: [${finalCustomTypes.join(', ')}]`);
      
      if (mongoUri) {
        try {
          console.log(`🔍 Extracting categories from custom database for restaurant update: ${name}`);
          
          const categoryPromise = (async () => {
            try {
              const customConnection = await connectToRestaurantDatabase(mongoUri);
              return await extractCategoriesFromCustomDB(customConnection);
            } catch (connError) {
              console.log('❌ Failed to connect to custom database:', connError.message);
              throw connError;
            }
          })();
          
          const extractedCategories = await Promise.race([
            categoryPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Category extraction timeout")), 3000)
            )
          ]);
          
          if (extractedCategories && extractedCategories.length > 0) {
            finalCustomTypes = extractedCategories;
            console.log(`✅ Using extracted categories: ${finalCustomTypes.join(', ')}`);
          } else {
            console.log('⚠️ No categories found in custom database, using provided/default categories');
          }
        } catch (customDbError) {
          console.log('❌ Failed to extract categories from custom database:', customDbError.message);
          console.log('⚠️ Using provided/default categories instead');
        }
      }

      // Generate QR code if website is provided
      let qrCode = null;
      if (website) {
        try {
          qrCode = await generateQRCode(website);
          console.log(`✅ QR code generated for website: ${website}`);
        } catch (qrError) {
          console.log(`⚠️ Failed to generate QR code for website: ${website}`, qrError);
        }
      }

      // Try MongoDB first with timeout, then fallback to mock data
      try {
        const updatePromise = Restaurant.findByIdAndUpdate(
          id,
          { name, description, address, phone, email, image, website, qrCode, mongoUri, customTypes: finalCustomTypes, isActive },
          { new: true }
        );
        
        const restaurant = await Promise.race([
          updatePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB update timeout")), 2000)
          )
        ]);

        if (!restaurant) {
          return res.status(404).json({ message: "Restaurant not found" });
        }

        console.log(`✅ Restaurant updated successfully: ${restaurant.name}`);
        return res.json(restaurant);
      } catch (mongoError) {
        console.log("MongoDB not available for restaurant update, using mock data fallback");
        
        // Try to find and update in mock data
        const mockRestaurants = getMockRestaurants();
        const mockIndex = mockRestaurants.findIndex(r => r._id === id);
        
        if (mockIndex === -1) {
          return res.status(404).json({ message: "Restaurant not found" });
        }
        
        // Update mock restaurant
        const updatedRestaurant = {
          ...mockRestaurants[mockIndex],
          name,
          description,
          address,
          phone,
          email,
          image,
          website,
          qrCode,
          mongoUri,
          customTypes: finalCustomTypes,
          isActive
        };
        
        mockRestaurants[mockIndex] = updatedRestaurant;
        console.log(`✅ Mock restaurant updated successfully: ${updatedRestaurant.name}`);
        return res.json(updatedRestaurant);
      }
    } catch (error) {
      console.error("🚨 Error updating restaurant:", error);
      console.error("🚨 Error stack:", error.stack);
      console.error("🚨 Error name:", error.name);
      res.status(500).json({ 
        message: "Failed to update restaurant", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Add endpoint to manually force update restaurant categories (for testing)
  app.post("/api/admin/restaurants/:id/force-update-categories", async (req, res) => {
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
        console.log(`🔄 Force updating categories for restaurant: ${restaurant.name}`);
        
        const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
        const extractedCategories = await extractCategoriesFromCustomDB(customConnection);
        
        if (extractedCategories && extractedCategories.length > 0) {
          restaurant.customTypes = extractedCategories;
          await restaurant.save();
          console.log(`✅ Categories force updated: ${extractedCategories.join(', ')}`);
          res.json({ message: "Categories force updated successfully", categories: extractedCategories, restaurant });
        } else {
          res.status(400).json({ message: "No categories found in custom database" });
        }
      } catch (error) {
        console.error("❌ Failed to force update categories:", error);
        res.status(500).json({ message: "Failed to force update categories", error: error.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to force update categories", error: error.message });
    }
  });

  // Add endpoint to refresh categories for existing restaurants
  app.post("/api/admin/restaurants/:id/refresh-categories", authenticateAdmin, async (req, res) => {
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
        console.log(`🔄 Refreshing categories for restaurant: ${restaurant.name}`);
        
        const categoryPromise = (async () => {
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          return await extractCategoriesFromCustomDB(customConnection);
        })();
        
        const extractedCategories = await Promise.race([
          categoryPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Category extraction timeout")), 5000)
          )
        ]);
        
        if (extractedCategories && extractedCategories.length > 0) {
          restaurant.customTypes = extractedCategories;
          await restaurant.save();
          console.log(`✅ Categories refreshed: ${extractedCategories.join(', ')}`);
          res.json({ message: "Categories refreshed successfully", categories: extractedCategories });
        } else {
          res.status(400).json({ message: "No categories found in custom database" });
        }
      } catch (error) {
        console.error("❌ Failed to refresh categories:", error);
        res.status(500).json({ message: "Failed to refresh categories" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh categories" });
    }
  });

  app.delete("/api/admin/restaurants/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Try MongoDB first with quick timeout, then fallback
      try {
        const deletePromise = (async () => {
          const restaurant = await Restaurant.findByIdAndDelete(id);
          if (restaurant) {
            await MenuItem.deleteMany({ restaurantId: id });
            return restaurant;
          }
          return null;
        })();
        
        const restaurant = await Promise.race([
          deletePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
        
        if (restaurant) {
          return res.json({ message: "Restaurant deleted successfully" });
        }
      } catch (mongoError) {
        // MongoDB not available or timeout, delete from mock data quickly
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

  // Menu Item Management Routes
  
  // Get menu items by category (collection-based)
  app.get("/api/admin/restaurants/:restaurantId/menu-items/category/:category", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId, category } = req.params;
      console.log(`🎯 Fetching menu items for restaurant ${restaurantId}, category: ${category}`);
      
      // First get the restaurant
      let restaurant = null;
      try {
        restaurant = await Promise.race([
          Restaurant.findById(restaurantId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
      } catch (mongoError) {
        // MongoDB not available, try mock data
        const mockRestaurants = getMockRestaurants();
        restaurant = mockRestaurants.find(r => r._id === restaurantId);
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // If restaurant has custom MongoDB URI, fetch items from specific collection
      if (restaurant.mongoUri) {
        try {
          console.log(`📡 Connecting to custom database for category: ${category}`);
          
          const fetchPromise = (async () => {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            return await fetchMenuItemsFromCustomDB(customConnection, category);
          })();
          
          const menuItems = await Promise.race([
            fetchPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Database fetch timeout")), 3000)
            )
          ]);
          
          console.log(`✅ Found ${menuItems.length} items in category "${category}"`);
          res.json(menuItems);
        } catch (customDbError) {
          console.error(`❌ Failed to fetch category "${category}" from custom database:`, customDbError.message);
          // Fallback to main database
          try {
            const menuItems = await MenuItem.find({ 
              restaurantId, 
              category: new RegExp(category, 'i') 
            }).sort({ createdAt: -1 });
            res.json(menuItems);
          } catch (fallbackError) {
            console.log("Main database also failed, returning empty array");
            res.json([]);
          }
        }
      } else {
        // No custom URI, use main database
        try {
          const menuItems = await MenuItem.find({ 
            restaurantId, 
            category: new RegExp(category, 'i') 
          }).sort({ createdAt: -1 });
          res.json(menuItems);
        } catch (error) {
          console.log("Main database failed, returning mock menu items");
          const mockItems = getMockMenuItems(restaurantId);
          const filteredItems = mockItems.filter(item => 
            item.category.toLowerCase().includes(category.toLowerCase())
          );
          res.json(filteredItems);
        }
      }
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/admin/restaurants/:restaurantId/menu-items", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      // First get the restaurant with quick timeout
      let restaurant = null;
      try {
        restaurant = await Promise.race([
          Restaurant.findById(restaurantId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB timeout")), 1000)
          )
        ]);
      } catch (mongoError) {
        // MongoDB not available or timeout, try mock data quickly
        const mockRestaurants = getMockRestaurants();
        restaurant = mockRestaurants.find(r => r._id === restaurantId);
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // If restaurant has custom MongoDB URI, connect to it and fetch menu items
      if (restaurant.mongoUri) {
        try {
          console.log(`Fetching menu items from custom database for restaurant: ${restaurant.name}`);
          
          // Set timeout for database operations
          const fetchPromise = (async () => {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            return await fetchMenuItemsFromCustomDB(customConnection);
          })();
          
          // Race against timeout  
          const menuItems = await Promise.race([
            fetchPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Database fetch timeout")), 3000)
            )
          ]);
          
          console.log(`Found ${menuItems.length} menu items in custom database`);
          
          // Auto-update restaurant categories if they don't match extracted ones
          try {
            const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
            const extractedCategories = await extractCategoriesFromCustomDB(customConnection);
            
            console.log(`🔍 Current restaurant categories: [${(restaurant.customTypes || []).join(', ')}]`);
            console.log(`🔍 Extracted categories: [${(extractedCategories || []).join(', ')}]`);
            
            if (extractedCategories && extractedCategories.length > 0) {
              const currentCategories = restaurant.customTypes || [];
              // Force update if current categories are empty or different
              const shouldUpdate = currentCategories.length === 0 || 
                                 JSON.stringify(currentCategories.sort()) !== JSON.stringify(extractedCategories.sort());
              
              if (shouldUpdate) {
                console.log(`🔄 Auto-updating restaurant categories from [${currentCategories.join(', ')}] to [${extractedCategories.join(', ')}]`);
                restaurant.customTypes = extractedCategories;
                await restaurant.save();
                console.log('✅ Restaurant categories updated successfully');
                
                // Reload restaurant from database to confirm update
                const updatedRestaurant = await Restaurant.findById(restaurant._id);
                console.log(`🔍 Confirmed updated categories: [${(updatedRestaurant?.customTypes || []).join(', ')}]`);
              } else {
                console.log('📋 Categories are already up to date');
              }
            }
          } catch (categoryError) {
            console.log('❌ Failed to auto-update categories:', categoryError.message);
          }
          
          res.json(menuItems);
        } catch (customDbError) {
          console.error("Failed to fetch from custom database:", customDbError.message);
          // Fall back to main database
          try {
            const menuItems = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });
            res.json(menuItems);
          } catch (fallbackError) {
            console.log("Main database also failed, returning mock menu items");
            res.json(getMockMenuItems(restaurantId));
          }
        }
      } else {
        // No custom URI, use main database
        try {
          const menuItems = await MenuItem.find({ restaurantId }).sort({ createdAt: -1 });
          res.json(menuItems);
        } catch (mongoError) {
          // MongoDB not available, return mock menu items
          console.log("MongoDB not available for menu items, returning mock data");
          res.json(getMockMenuItems(restaurantId));
        }
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/admin/restaurants/:restaurantId/menu-items", authenticateAdmin, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { name, description, price, category, isVeg, image } = req.body;

      if (!name || !description || price === undefined || !category || isVeg === undefined || !image) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Get the restaurant to check if it has a custom MongoDB URI
      const restaurant = await Restaurant.findById(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // If restaurant has custom MongoDB URI, create in custom database
      if (restaurant.mongoUri) {
        try {
          console.log(`Creating menu item in custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          
          const menuItem = await createMenuItemInCustomDB(customConnection, {
            name, description, price, category, isVeg, image
          });
          
          res.status(201).json(menuItem);
        } catch (customDbError) {
          console.error("Failed to create in custom database:", customDbError);
          // Fall back to main database
          const menuItem = new MenuItem({
            name, description, price, category, isVeg, image, restaurantId
          });
          await menuItem.save();
          res.status(201).json(menuItem);
        }
      } else {
        // No custom URI, use main database
        try {
          const menuItem = new MenuItem({
            name, description, price, category, isVeg, image, restaurantId
          });

          await menuItem.save();
          res.status(201).json(menuItem);
        } catch (mongoError) {
          // MongoDB not available, add to mock data store
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

  app.put("/api/admin/menu-items/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, category, isVeg, image, isAvailable, restaurantId } = req.body;

      // Get the restaurant to check if it has a custom MongoDB URI
      const restaurant = await Restaurant.findById(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // If restaurant has custom MongoDB URI, update in custom database
      if (restaurant.mongoUri) {
        try {
          console.log(`Updating menu item in custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          
          const menuItem = await updateMenuItemInCustomDB(customConnection, id, {
            name, description, price, category, isVeg, image, isAvailable
          });
          
          res.json(menuItem);
        } catch (customDbError) {
          console.error("Failed to update in custom database:", customDbError);
          // Fall back to main database
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
        // No custom URI, use main database
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

  app.delete("/api/admin/menu-items/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { restaurantId } = req.body;

      // Get the restaurant to check if it has a custom MongoDB URI
      const restaurant = await Restaurant.findById(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // If restaurant has custom MongoDB URI, delete from custom database
      if (restaurant.mongoUri) {
        try {
          console.log(`Deleting menu item from custom database for restaurant: ${restaurant.name}`);
          const customConnection = await connectToRestaurantDatabase(restaurant.mongoUri);
          
          await deleteMenuItemFromCustomDB(customConnection, id);
          res.json({ message: "Menu item deleted successfully" });
        } catch (customDbError) {
          console.error("Failed to delete from custom database:", customDbError);
          // Fall back to main database
          const menuItem = await MenuItem.findByIdAndDelete(id);
          
          if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
          }
          res.json({ message: "Menu item deleted successfully" });
        }
      } else {
        // No custom URI, use main database
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

  // Admin Settings Routes
  app.use("/api/admin/settings", adminSettingsRoutes);
  
  // Additional admin routes for export and logs  
  app.use("/api/admin", adminSettingsRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
