import mongoose from 'mongoose';

// Dynamic MongoDB connections for restaurant-specific databases
const connectionPool = new Map<string, mongoose.Connection>();

export async function connectToRestaurantDatabase(mongoUri: string): Promise<mongoose.Connection> {
  // If connection already exists, return it
  if (connectionPool.has(mongoUri)) {
    const existingConnection = connectionPool.get(mongoUri);
    if (existingConnection && existingConnection.readyState === 1) {
      return existingConnection;
    }
    // Remove stale connection
    connectionPool.delete(mongoUri);
  }

  try {
    // Parse the MongoDB URI to extract database name
    let finalUri = mongoUri;
    let databaseName = 'maharajafeast'; // Default database name
    
    // Try to extract database name from URI
    try {
      const url = new URL(mongoUri.replace('mongodb+srv://', 'https://'));
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 1 && pathParts[1]) {
        databaseName = pathParts[1];
      }
    } catch (urlError) {
      console.log('⚠️ Could not parse URI for database name, using default');
    }
    
    // Ensure the URI includes the database name
    if (!mongoUri.includes('/', mongoUri.lastIndexOf('@') + 1)) {
      // If no database name in URI, add the extracted/default database name
      finalUri = mongoUri.replace('?', `/${databaseName}?`);
    } else if (mongoUri.includes('/?')) {
      // Replace /? with /databaseName?
      finalUri = mongoUri.replace('/?', `/${databaseName}?`);
    }
    
    console.log(`🔗 Original URI: ${mongoUri.replace(/:[^:]*@/, ':***@')}`);
    console.log(`🔗 Final URI: ${finalUri.replace(/:[^:]*@/, ':***@')}`); // Hide password in logs
    console.log(`📊 Target database: ${databaseName}`);
    
    // Create new connection with reduced timeout and proper error handling
    const connection = await Promise.race([
      mongoose.createConnection(finalUri, {
        connectTimeoutMS: 2000,
        serverSelectionTimeoutMS: 2000,
        maxPoolSize: 3,
        minPoolSize: 1
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout")), 3000)
      )
    ]);
    
    // Store connection for reuse
    connectionPool.set(mongoUri, connection);
    
    console.log(`✅ Connected to restaurant database: ${finalUri.split('@')[1]?.split('/')[0] || 'unknown'}`);
    
    // Wait for connection to be ready and get database name safely
    await new Promise((resolve) => {
      if (connection.readyState === 1) {
        resolve(null);
      } else {
        connection.once('connected', resolve);
      }
    });
    
    const dbName = connection.db?.databaseName || databaseName;
    console.log(`📊 Connected to database: ${dbName}`);
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to restaurant database:', error);
    throw error;
  }
}

export function closeRestaurantConnection(mongoUri: string) {
  const connection = connectionPool.get(mongoUri);
  if (connection) {
    connection.close();
    connectionPool.delete(mongoUri);
    console.log(`Closed connection to restaurant database: ${mongoUri.split('@')[1]?.split('/')[0] || 'unknown'}`);
  }
}

// Define flexible menu item schema for dynamic connections
export function getMenuItemModel(connection: mongoose.Connection) {
  // Use exact schema structure from your MongoDB Atlas screenshot
  const menuItemSchema = new mongoose.Schema({
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
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }, { 
    strict: false, 
    timestamps: true 
  });

  // Use existing model if already compiled
  if (connection.models['MenuItem']) {
    return connection.models['MenuItem'];
  }
  
  return connection.model('MenuItem', menuItemSchema);
}

// Function to detect and analyze database structure
export async function analyzeCustomDatabase(connection: mongoose.Connection) {
  try {
    console.log('🔍 Analyzing database structure');
    console.log('📊 Database name:', connection.db.databaseName);
    console.log('🔗 Connection state:', connection.readyState);
    
    // Get all collections in the database
    const collections = await connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // For our use case, we want to include ALL collections as potential menu categories
    // This allows for empty collections like "chefspecial" to be used for new items
    const menuCollections = collections.filter(c => 
      // Skip system collections
      !c.name.startsWith('__') && 
      !c.name.startsWith('system.') &&
      c.name !== 'admin' &&
      c.name !== 'users'
    );
    
    console.log('🎯 Menu collections (all non-system collections):', menuCollections.map(c => c.name));
    
    // Optional: Log which collections have data vs empty
    for (const collection of menuCollections) {
      console.log(`🔍 Checking collection: ${collection.name}`);
      const sampleDoc = await connection.db.collection(collection.name).findOne({});
      console.log(`📄 Sample document from ${collection.name}:`, sampleDoc);
      
      if (sampleDoc && (sampleDoc.name || sampleDoc.title) && (sampleDoc.price || sampleDoc.cost)) {
        console.log(`✅ Collection ${collection.name} appears to contain menu items`);
      } else if (sampleDoc) {
        console.log(`⚠️ Collection ${collection.name} has data but doesn't look like menu items`);
      } else {
        console.log(`📭 Collection ${collection.name} is empty (can be used for new items)`);
      }
    }
    
    console.log('🎯 Final menu-related collections found:', menuCollections.map(c => c.name));
    return menuCollections;
  } catch (error) {
    console.error('❌ Error analyzing database structure:', error);
    return [];
  }
}

// Function to fetch menu items from each collection (where collection name = category)
export async function fetchMenuItemsFromCustomDB(connection: mongoose.Connection, categoryFilter?: string) {
  try {
    console.log('🔍 Starting to fetch menu items from custom database');
    console.log('📊 Database name:', connection.db.databaseName);
    console.log('🎯 Category filter:', categoryFilter || 'ALL');
    
    // Get all collections in the database
    const collections = await connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Filter out system collections
    const systemCollections = ['admin', 'local', 'config', 'system', 'test'];
    const menuCollections = collections.filter(c => 
      !systemCollections.some(sys => c.name.toLowerCase().includes(sys.toLowerCase())) &&
      !c.name.startsWith('_') &&
      c.name !== 'users' &&
      c.name !== 'sessions'
    );
    
    console.log('🎯 Menu collections:', menuCollections.map(c => c.name));
    
    if (menuCollections.length === 0) {
      console.log('❌ No menu collections found in custom database');
      return [];
    }
    
    let allMenuItems = [];
    
    // If categoryFilter is provided, find the matching collection
    let collectionsToQuery = menuCollections;
    if (categoryFilter) {
      // Filter directly by collection name (exact match)
      collectionsToQuery = menuCollections.filter(c => 
        c.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      
      console.log(`🎯 Filtering for category "${categoryFilter}", found collections:`, collectionsToQuery.map(c => c.name));
    }
    
    for (const collection of collectionsToQuery) {
      try {
        console.log(`🔍 Fetching items from collection: ${collection.name}`);
        const items = await connection.db.collection(collection.name).find({}).toArray();
        
        console.log(`📋 Found ${items.length} items in ${collection.name}`);
        
        // Use collection name with proper display label mapping
        const getCategoryFromCollection = (collectionName: string): string => {
          const categoryMapping = {
            'chefspecial': 'Chef Special',
            'starters': 'Starters',
            'soups': 'Soups',
            'maincourse': 'Main Course',
            'ricebiryani': 'Rice & Biryani',
            'bread': 'Bread',
            'desserts': 'Desserts',
            'drinks': 'Drinks',
            'combos': 'Combos'
          };
          return categoryMapping[collectionName] || collectionName.charAt(0).toUpperCase() + collectionName.slice(1).toLowerCase();
        };
        
        // Transform items to match the exact structure from your MongoDB screenshot
        const transformedItems = items.map(item => {
          const categoryFromCollection = getCategoryFromCollection(collection.name);
          
          // Map collection name to proper display label
          const collectionToDisplayMapping = {
            'chefspecial': 'Chef Special',
            'starters': 'Starters',
            'soups': 'Soups',
            'maincourse': 'Main Course',
            'ricebiryani': 'Rice & Biryani',
            'bread': 'Bread',
            'desserts': 'Desserts',
            'drinks': 'Drinks',
            'combos': 'Combos'
          };
          
          const getDisplayCategory = (category: string, collectionName: string) => {
            // If category exists in item, use it (it should already be properly formatted)
            if (category && Object.keys(collectionToDisplayMapping).includes(category.toLowerCase())) {
              return category;
            }
            // Otherwise map from collection name
            return collectionToDisplayMapping[collectionName] || categoryFromCollection;
          };
          
          return {
            _id: item._id,
            name: item.name || item.title || item.itemName || 'Unknown Item',
            description: item.description || item.desc || item.details || '',
            price: item.price || item.cost || item.amount || 0,
            category: getDisplayCategory(item.category, collection.name), // Use proper display label
            isVeg: item.isVeg ?? item.veg ?? item.vegetarian ?? true, // Use 'isVeg' field as in screenshot
            image: item.image || item.imageUrl || item.photo || '',
            restaurantId: item.restaurantId || new mongoose.Types.ObjectId("6874cff2a880250859286de6"),
            isAvailable: item.isAvailable ?? item.available ?? item.active ?? true,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            __v: item.__v ?? 0,
            originalCollection: collection.name,
            originalData: item // Keep original data for reference
          };
        });
        
        allMenuItems = allMenuItems.concat(transformedItems);
        console.log(`📊 Added ${transformedItems.length} items from ${collection.name} with category "${getCategoryFromCollection(collection.name)}"`);
      } catch (error) {
        console.error(`❌ Error fetching from collection ${collection.name}:`, error);
      }
    }
    
    console.log(`🎯 Total menu items found: ${allMenuItems.length}`);
    return allMenuItems;
  } catch (error) {
    console.error('❌ Error fetching menu items from custom database:', error);
    return [];
  }
}

// Function to extract categories from collection names instead of menu items
export async function extractCategoriesFromCustomDB(connection: mongoose.Connection) {
  try {
    console.log('🔍 Extracting categories from collection names');
    console.log('📊 Database name:', connection.db.databaseName);
    
    // Get all collections in the database
    const collections = await connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Filter out system collections and process collection names as categories
    const systemCollections = ['admin', 'local', 'config', 'system', 'test'];
    const menuCollections = collections.filter(c => 
      !systemCollections.some(sys => c.name.toLowerCase().includes(sys.toLowerCase())) &&
      !c.name.startsWith('_') &&
      c.name !== 'users' &&
      c.name !== 'sessions'
    );
    
    console.log('🎯 Menu collections (potential categories):', menuCollections.map(c => c.name));
    
    if (menuCollections.length === 0) {
      console.log('❌ No valid collections found for categories');
      return ['Starters', 'Main Course', 'Desserts', 'Beverages'];
    }
    
    // Map collection names to proper display labels
    const categoryMapping = {
      'chefspecial': 'Chef Special',
      'starters': 'Starters',
      'soups': 'Soups',
      'maincourse': 'Main Course',
      'ricebiryani': 'Rice & Biryani',
      'bread': 'Bread',
      'desserts': 'Desserts',
      'drinks': 'Drinks',
      'combos': 'Combos'
    };
    
    const categories = menuCollections.map(collection => {
      const name = collection.name;
      const displayLabel = categoryMapping[name] || name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      console.log(`📌 Using collection name as category: "${displayLabel}" (from "${name}")`);
      return displayLabel;
    });
    
    // Remove duplicates and sort
    const uniqueCategories = Array.from(new Set(categories)).sort();
    
    console.log(`✅ Final categories from collection names:`, uniqueCategories);
    
    return uniqueCategories.length > 0 ? uniqueCategories : ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  } catch (error) {
    console.error('❌ Error extracting categories from collection names:', error);
    return ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  }
}

// Function to create a menu item in the custom database
export async function createMenuItemInCustomDB(connection: mongoose.Connection, menuItemData: any) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    
    // Map display category to collection name
    const categoryToCollectionMapping = {
      'Chef Special': 'chefspecial',
      'Starters': 'starters',
      'Soups': 'soups',
      'Main Course': 'maincourse',
      'Rice & Biryani': 'ricebiryani',
      'Bread': 'bread',
      'Desserts': 'desserts',
      'Drinks': 'drinks',
      'Combos': 'combos'
    };
    
    let targetCollection = categoryToCollectionMapping[menuItemData.category] || menuItemData.category?.toLowerCase() || 'menuitems';
    
    // Verify the collection exists in the database
    const collectionExists = menuCollections.some(col => col.name === targetCollection);
    if (!collectionExists) {
      console.log(`⚠️  Collection "${targetCollection}" not found, using first available collection`);
      targetCollection = menuCollections.length > 0 ? menuCollections[0].name : 'menuitems';
    }
    
    console.log(`Creating menu item in collection: ${targetCollection}`);
    
    // Transform the data to match the exact MongoDB document structure from your screenshot
    // Map category display labels to collection names and back to proper display format
    const categoryMapping = {
      'Chef Special': 'chefspecial',
      'Starters': 'starters',
      'Soups': 'soups',
      'Main Course': 'maincourse',
      'Rice & Biryani': 'ricebiryani',
      'Bread': 'bread',
      'Desserts': 'desserts',
      'Drinks': 'drinks',
      'Combos': 'combos'
    };
    
    // Get the proper display label for the category
    const getDisplayCategory = (category: string) => {
      // If it's already a display label, return it
      if (Object.keys(categoryMapping).includes(category)) {
        return category;
      }
      // If it's a collection name, map it to display label
      const reverseMapping = {
        'chefspecial': 'Chef Special',
        'starters': 'Starters',
        'soups': 'Soups',
        'maincourse': 'Main Course',
        'ricebiryani': 'Rice & Biryani',
        'bread': 'Bread',
        'desserts': 'Desserts',
        'drinks': 'Drinks',
        'combos': 'Combos'
      };
      return reverseMapping[category.toLowerCase()] || category;
    };
    
    const transformedData = {
      name: menuItemData.name,
      description: menuItemData.description,
      price: menuItemData.price,
      category: getDisplayCategory(menuItemData.category), // Use proper display label
      isVeg: menuItemData.isVeg || menuItemData.veg || true, // Use 'isVeg' field as shown in screenshot
      image: menuItemData.image,
      restaurantId: new mongoose.Types.ObjectId("6874cff2a880250859286de6"), // Use the restaurant ID from your screenshot
      isAvailable: menuItemData.isAvailable ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    console.error('Error creating menu item in custom database:', error);
    throw error;
  }
}

// Function to update a menu item in the custom database
export async function updateMenuItemInCustomDB(connection: mongoose.Connection, itemId: string, updateData: any) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    
    // First, find which collection the item is currently in
    let currentCollection = null;
    let currentItem = null;
    
    for (const collection of menuCollections) {
      try {
        const item = await connection.db.collection(collection.name).findOne(
          { _id: new mongoose.Types.ObjectId(itemId) }
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
    
    // If category is being changed, move item to the new collection
    if (updateData.category) {
      const categoryToCollectionMapping = {
        'Chef Special': 'chefspecial',
        'Starters': 'starters',
        'Soups': 'soups',
        'Main Course': 'maincourse',
        'Rice & Biryani': 'ricebiryani',
        'Bread': 'bread',
        'Desserts': 'desserts',
        'Drinks': 'drinks',
        'Combos': 'combos'
      };
      
      const newCollectionName = categoryToCollectionMapping[updateData.category] || updateData.category.toLowerCase();
      
      if (newCollectionName !== currentCollection) {
        const newCollectionExists = menuCollections.some(col => col.name === newCollectionName);
      
        if (newCollectionExists) {
        console.log(`🔄 Moving item from "${currentCollection}" to "${newCollectionName}"`);
        
        // Create the item in the new collection with proper MongoDB format
        const newItemData = {
          ...currentItem,
          ...updateData,
          updatedAt: new Date(),
          __v: currentItem.__v || 0
        };
        delete newItemData._id; // Remove old ID for new insertion
        
        const insertResult = await connection.db.collection(newCollectionName).insertOne(newItemData);
        
        // Delete from old collection
        await connection.db.collection(currentCollection).deleteOne(
          { _id: new mongoose.Types.ObjectId(itemId) }
        );
        
        console.log(`✅ Menu item moved to collection: ${newCollectionName}`);
        return {
          _id: insertResult.insertedId,
          name: newItemData.name || newItemData.title || newItemData.itemName || 'Unknown Item',
          description: newItemData.description || newItemData.desc || newItemData.details || '',
          price: newItemData.price || newItemData.cost || newItemData.amount || 0,
          category: updateData.category, // Keep capitalized category for display
          isVeg: newItemData.isVeg ?? newItemData.vegetarian ?? newItemData.veg ?? true,
          image: newItemData.image || newItemData.imageUrl || newItemData.photo || '',
          isAvailable: newItemData.isAvailable ?? newItemData.available ?? newItemData.active ?? true,
          originalCollection: newCollectionName,
          originalData: newItemData
        };
        }
      }
    }
    
    // Update in current collection
    const result = await connection.db.collection(currentCollection).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    if (result) {
      console.log(`✅ Menu item updated in collection: ${currentCollection}`);
      return {
        _id: result._id,
        name: result.name || result.title || result.itemName || 'Unknown Item',
        description: result.description || result.desc || result.details || '',
        price: result.price || result.cost || result.amount || 0,
        category: result.category || result.type || result.section || 'Uncategorized',
        isVeg: result.isVeg ?? result.vegetarian ?? result.veg ?? true,
        image: result.image || result.imageUrl || result.photo || '',
        isAvailable: result.isAvailable ?? result.available ?? result.active ?? true,
        originalCollection: currentCollection,
        originalData: result
      };
    }
    
    throw new Error('Menu item not found in any collection');
  } catch (error) {
    console.error('Error updating menu item in custom database:', error);
    throw error;
  }
}

// Function to delete a menu item from the custom database
export async function deleteMenuItemFromCustomDB(connection: mongoose.Connection, itemId: string) {
  try {
    const menuCollections = await analyzeCustomDatabase(connection);
    
    // Try to find and delete the item from all collections
    for (const collection of menuCollections) {
      try {
        const result = await connection.db.collection(collection.name).deleteOne(
          { _id: new mongoose.Types.ObjectId(itemId) }
        );
        
        if (result.deletedCount > 0) {
          console.log(`Menu item deleted from collection: ${collection.name}`);
          return true;
        }
      } catch (error) {
        console.error(`Error deleting from collection ${collection.name}:`, error);
      }
    }
    
    throw new Error('Menu item not found in any collection');
  } catch (error) {
    console.error('Error deleting menu item from custom database:', error);
    throw error;
  }
}