import { faker } from "@faker-js/faker";
import { User } from "../../models/users.model.js";

const seedCaregivers = async () => {
  try {
    console.log("Creating caregivers...");

    const caregiverEmails = [
      "fccac101@gmail.com",
      "fccac102@gmail.com",
      "shouryapastor2005@gmail.com",
    ];

    const caregivers = [];

    for (const email of caregiverEmails) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      const caregiver = await User.create({
        fullname: `${firstName} ${lastName}`,
        username: faker.internet
          .username({ firstName, lastName })
          .toLowerCase(),
        email,
        avatar: "...",
        coverImage: "",
        password: "Caregiver@123",
        role: "caregiver",
        isActive: true,
        isSuspended: false,
      });

      caregivers.push(caregiver);
    }

    console.log("3 caregivers created successfully.");

    return caregivers;
  } catch (error) {
    console.error("Failed to create caregivers:", error.message);
    throw error;
  }
};

export { seedCaregivers };
