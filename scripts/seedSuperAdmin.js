import mongoose from "mongoose";
import env from "../config/env.js";
import connectDB from "../config/db.js";
import SuperAdmin from "../models/superAdmin.model.js";

const seedSuperAdmin = async () => {
  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    console.error("[Seed] SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in the environment");
    process.exit(1);
  }

  await connectDB();

  const existing = await SuperAdmin.findOne({ email: env.SUPER_ADMIN_EMAIL });

  if (existing) {
    console.log(`[Seed] Super admin already exists for ${env.SUPER_ADMIN_EMAIL}. Skipping.`);
  } else {
    await SuperAdmin.create({
      name: env.SUPER_ADMIN_NAME,
      email: env.SUPER_ADMIN_EMAIL,
      password: env.SUPER_ADMIN_PASSWORD,
    });
    console.log(`[Seed] Super admin account created for ${env.SUPER_ADMIN_EMAIL}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

seedSuperAdmin().catch((error) => {
  console.error("[Seed] Failed to seed super admin:", error);
  process.exit(1);
});
