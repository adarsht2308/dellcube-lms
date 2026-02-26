// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import bcrypt from "bcryptjs";
// import { User } from "./models/user.js";
// import connectDB from "./config/dbConfig.js";

// dotenv.config();

// async function seedUsers() {
//   try {
//     await connectDB();
//     console.log("Database Connected");

//     const usersToCreate = [
//       {
//         name: "DellCube Admin",
//         email: "info@dellcube.com",
//         password: "123456",
//         role: "superAdmin",
//         status: true,
//       },
//       {
//         name: "Test Admin",
//         email: "test@gmail.com",
//         password: "123456",
//         role: "superAdmin",
//         status: true,
//       },
//     ];

//     for (const userData of usersToCreate) {
//       // Check if user already exists
//       const existingUser = await User.findOne({ email: userData.email });

//       if (existingUser) {
//         // Update existing user
//         const hashedPassword = await bcrypt.hash(userData.password, 10);
//         existingUser.password = hashedPassword;
//         existingUser.name = userData.name;
//         existingUser.role = userData.role;
//         existingUser.status = userData.status;
//         await existingUser.save();
//         console.log(`✓ Updated user: ${userData.email}`);
//       } else {
//         // Create new user
//         const hashedPassword = await bcrypt.hash(userData.password, 10);
//         await User.create({
//           name: userData.name,
//           email: userData.email,
//           password: hashedPassword,
//           role: userData.role,
//           status: userData.status,
//         });
//         console.log(`✓ Created user: ${userData.email}`);
//       }
//     }

//     console.log("\n✓ User seeding complete!");
//     process.exit(0);
//   } catch (error) {
//     console.error("✗ Seeding error:", error);
//     process.exit(1);
//   }
// }

// seedUsers();

