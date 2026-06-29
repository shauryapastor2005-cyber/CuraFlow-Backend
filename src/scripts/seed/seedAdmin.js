import { User } from "../../models/users.model.js";

const seedAdmin = async () => {
  try {
    console.log("Creating admin...");

    const admin = await User.create({
      fullname: "CuraFlow Admin",
      username: "admin",
      email: "admin.curaflow.healthcare.ai@gmail.com",
      avatar:
        "https://res.cloudinary.com/dna6rpwb6/image/upload/v1782670990/Designer_orgak6.png",
      coverImage: "",
      password: "Admin@12345",
      role: "admin",
      isActive: true,
      isSuspended: false,
    });

    console.log("Admin created successfully.");

    return admin;
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    throw error;
  }
};

export { seedAdmin };
