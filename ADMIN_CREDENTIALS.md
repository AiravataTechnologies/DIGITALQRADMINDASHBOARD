# Admin Panel Login Credentials

## Access the Admin Panel
Visit: [/admin/login](http://localhost:5000/admin/login)

## Login Credentials

**Username:** `admin`
**Password:** `password`

## Features Available

1. **Dashboard** - Overview of all restaurants and statistics
2. **Restaurant Management** - Add, edit, and delete restaurants
3. **Menu Management** - Manage menu items by categories:
   - Starters
   - Main Course
   - Desserts
   - Beverages

## Database Status

Currently using fallback authentication system since MongoDB Atlas requires IP whitelisting.

To enable full MongoDB functionality:
1. Go to MongoDB Atlas Dashboard
2. Navigate to Network Access
3. Add current IP address to whitelist (or add 0.0.0.0/0 for all IPs)
4. Restart the application

## Admin Panel Routes

- `/admin/login` - Admin login page
- `/admin/dashboard` - Main dashboard
- `/admin/restaurants/new` - Add new restaurant
- `/admin/restaurants/:id/edit` - Edit restaurant
- `/admin/restaurants/:id/menu` - Manage restaurant menu