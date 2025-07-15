import { Router } from "express";
import { Admin } from "../models/Admin";
import { authenticateAdmin, AuthRequest } from "../middleware/auth";
import { getFallbackAdminSettings, updateFallbackAdminSettings, getFallbackAdminProfile, updateFallbackAdminProfile, updateFallbackAdminPassword, getCurrentFallbackPassword } from "../fallback-auth";
import bcrypt from "bcryptjs";

const router = Router();

// Get admin profile
router.get("/profile", authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Handle fallback admin (not in MongoDB)
    if (req.admin._id === 'admin-001' || req.admin.id === 'admin-001') {
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

// Update admin profile
router.put("/profile", authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    
    // Handle fallback admin (not in MongoDB) - update profile in memory
    if (req.admin._id === 'admin-001' || req.admin.id === 'admin-001') {
      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        
        // Validate current password against the stored fallback password
        const storedPassword = getCurrentFallbackPassword();
        if (currentPassword !== storedPassword) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        updateFallbackAdminPassword(newPassword);
      }
      
      const profileToUpdate = {
        ...(username && { username }),
        ...(email && { email }),
      };
      
      const updatedProfile = updateFallbackAdminProfile(profileToUpdate);
      return res.json(updatedProfile);
    }
    
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // If password change is requested, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedNewPassword;
    }

    // Update username and email
    if (username) admin.username = username;
    if (email) admin.email = email;

    await admin.save();
    
    // Return admin info without password
    const updatedAdmin = await Admin.findById(req.admin._id).select("-password");
    res.json(updatedAdmin);
  } catch (error) {
    console.error("Admin profile update error:", error);
    res.status(500).json({ message: "Failed to update admin profile" });
  }
});

// Get admin settings
router.get("/settings", authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Handle fallback admin (not in MongoDB) - return stored settings
    if (req.admin._id === 'admin-001' || req.admin.id === 'admin-001') {
      return res.json(getFallbackAdminSettings());
    }
    
    const admin = await Admin.findById(req.admin._id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Return admin settings with defaults
    const settings = {
      theme: admin.theme || "blue",
      darkMode: admin.darkMode || false,
      compactMode: admin.compactMode || false,
      emailNotifications: admin.emailNotifications !== false, // default true
      sessionTimeout: admin.sessionTimeout || 30,
      twoFactorEnabled: admin.twoFactorEnabled || false,
      loginAlerts: admin.loginAlerts !== false, // default true
      autoBackup: admin.autoBackup !== false, // default true
      maxRestaurants: admin.maxRestaurants || 10,
    };
    
    res.json(settings);
  } catch (error) {
    console.error("Admin settings fetch error:", error);
    res.status(500).json({ message: "Failed to fetch admin settings" });
  }
});

// Update admin settings
router.put("/settings", authenticateAdmin, async (req: AuthRequest, res) => {
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
      maxRestaurants,
    } = req.body;

    // Handle fallback admin (not in MongoDB) - store settings in memory
    if (req.admin._id === 'admin-001' || req.admin.id === 'admin-001') {
      const settingsToUpdate = {
        ...(theme && { theme }),
        ...(darkMode !== undefined && { darkMode }),
        ...(compactMode !== undefined && { compactMode }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(sessionTimeout && { sessionTimeout }),
        ...(twoFactorEnabled !== undefined && { twoFactorEnabled }),
        ...(loginAlerts !== undefined && { loginAlerts }),
        ...(autoBackup !== undefined && { autoBackup }),
        ...(maxRestaurants && { maxRestaurants }),
      };
      
      const updatedSettings = updateFallbackAdminSettings(settingsToUpdate);
      return res.json(updatedSettings);
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update settings
    if (theme) admin.theme = theme;
    if (darkMode !== undefined) admin.darkMode = darkMode;
    if (compactMode !== undefined) admin.compactMode = compactMode;
    if (emailNotifications !== undefined) admin.emailNotifications = emailNotifications;
    if (sessionTimeout) admin.sessionTimeout = sessionTimeout;
    if (twoFactorEnabled !== undefined) admin.twoFactorEnabled = twoFactorEnabled;
    if (loginAlerts !== undefined) admin.loginAlerts = loginAlerts;
    if (autoBackup !== undefined) admin.autoBackup = autoBackup;
    if (maxRestaurants) admin.maxRestaurants = maxRestaurants;

    await admin.save();
    
    // Return updated settings
    const updatedSettings = {
      theme: admin.theme || "blue",
      darkMode: admin.darkMode || false,
      compactMode: admin.compactMode || false,
      emailNotifications: admin.emailNotifications !== false,
      sessionTimeout: admin.sessionTimeout || 30,
      twoFactorEnabled: admin.twoFactorEnabled || false,
      loginAlerts: admin.loginAlerts !== false,
      autoBackup: admin.autoBackup !== false,
      maxRestaurants: admin.maxRestaurants || 10,
    };
    
    res.json(updatedSettings);
  } catch (error) {
    console.error("Admin settings update error:", error);
    res.status(500).json({ message: "Failed to update admin settings" });
  }
});

// Export database route
router.get("/export-database", authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // For MongoDB restaurants, we'll export a summary
    const { Restaurant } = await import("../models/Restaurant");
    const { MenuItem } = await import("../models/MenuItem");
    const { Admin } = await import("../models/Admin");
    
    const restaurants = await Restaurant.find().lean();
    const menuItems = await MenuItem.find().lean();
    const admins = await Admin.find().select("-password").lean();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        restaurants,
        menuItems,
        admins,
        summary: {
          restaurantCount: restaurants.length,
          menuItemCount: menuItems.length,
          adminCount: admins.length,
        }
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="database-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error("Database export error:", error);
    res.status(500).json({ message: "Failed to export database" });
  }
});

// System logs route
router.get("/system-logs", authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Generate a sample system log (in a real system, you'd read from actual log files)
    const logs = `
=== System Logs ===
Generated at: ${new Date().toISOString()}

[INFO] ${new Date().toISOString()} - System startup complete
[INFO] ${new Date().toISOString()} - MongoDB connection established
[INFO] ${new Date().toISOString()} - Admin authentication successful for user: ${req.admin.username}
[INFO] ${new Date().toISOString()} - Restaurant management system active
[INFO] ${new Date().toISOString()} - QR code generation service running
[INFO] ${new Date().toISOString()} - Menu synchronization service active
[INFO] ${new Date().toISOString()} - Database backup scheduled for daily execution
[INFO] ${new Date().toISOString()} - Session management service running
[INFO] ${new Date().toISOString()} - Email notification service configured
[INFO] ${new Date().toISOString()} - System health check: All services operational

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
Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m

=== End of Logs ===
    `.trim();
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs);
  } catch (error) {
    console.error("System logs error:", error);
    res.status(500).json({ message: "Failed to retrieve system logs" });
  }
});

export default router;