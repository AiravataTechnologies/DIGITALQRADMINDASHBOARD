import bcrypt from "bcryptjs";

// Fallback admin credentials when MongoDB is not available
const FALLBACK_ADMIN = {
  id: "admin-001",
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "admin"
};

// In-memory storage for fallback admin settings
let fallbackSettings = {
  theme: "blue",
  darkMode: false,
  compactMode: false,
  emailNotifications: true,
  sessionTimeout: 30,
  twoFactorEnabled: false,
  loginAlerts: true,
  autoBackup: true,
  maxRestaurants: 10,
};

// In-memory storage for fallback admin profile
let fallbackProfile = {
  _id: "admin-001",
  username: "admin",
  email: "admin@example.com",
  role: "admin"
};

// In-memory storage for fallback admin password
let fallbackPassword = "password";

export async function validateAdminCredentials(username: string, password: string) {
  // Fast validation without database timeout
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

export function getFallbackAdminSettings() {
  return { ...fallbackSettings };
}

export function updateFallbackAdminSettings(newSettings: any) {
  fallbackSettings = { ...fallbackSettings, ...newSettings };
  return { ...fallbackSettings };
}

export function getFallbackAdminProfile() {
  return { ...fallbackProfile };
}

export function updateFallbackAdminProfile(newProfile: any) {
  fallbackProfile = { ...fallbackProfile, ...newProfile };
  return { ...fallbackProfile };
}

export function updateFallbackAdminPassword(newPassword: string) {
  fallbackPassword = newPassword;
  return true;
}

export function getCurrentFallbackPassword() {
  return fallbackPassword;
}

export const fallbackCredentials = {
  username: "admin",
  password: "password"
};