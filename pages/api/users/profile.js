import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { password, phone, avatar } = req.body;

    // Validate JWT token
    const token = req.headers.authorization.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.ACCESS_SECRET); // Assuming you're using ACCESS_SECRET here
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Prepare an object to hold only the fields that are being updated
    const updateData = {};

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
      updateData.password = hashedPassword;
    }
    if (phone) {
      updateData.phone = phone;
    }
    if (avatar) {
      updateData.avatar = avatar;
    }

    try {
      // Update the user in the database based on their email
      const updatedUser = await prisma.user.update({
        where: { email: decoded.email },
        data: updateData,
      });

      return res.status(200).json({ message: "Profile updated", updatedUser });
    } catch (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "Error updating profile" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
