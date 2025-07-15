import { connectToDatabase } from "./db/mongodb";
import { Admin } from "./models/Admin";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    await connectToDatabase();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new Admin({
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com",
      role: "admin"
    });

    await admin.save();
    console.log("Default admin user created:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@example.com");
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

seedAdmin();