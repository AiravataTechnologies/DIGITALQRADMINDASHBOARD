// Instead of clearing DB, let me fix the existing restaurants by updating their customTypes
import mongoose from 'mongoose';

async function fixExistingRestaurants() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    // Update all restaurants to have empty customTypes so they get extracted dynamically
    const result = await mongoose.connection.db.collection('restaurants').updateMany(
      {},
      { $set: { customTypes: [] } }
    );
    
    console.log(`Updated ${result.modifiedCount} restaurants to clear customTypes`);
    console.log('Now the frontend will extract categories dynamically from menu items');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixExistingRestaurants();