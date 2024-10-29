import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";

const prisma = new PrismaClient();

// Multer part of this file is from ChatGPT
const storage = multer.diskStorage({
    destination: "./public/avatars",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const runMulter = req => {
    return new Promise((resolve, reject) => {
        upload.single("avatar")(req, null, err => {
            if (err) reject(err);
            else resolve();
        });
    });
};

export default async function handler(req, res) {
    if (req.method === "PUT") {
        try {
            await runMulter(req);
        } catch (err) {
            return res.status(500).json({ error: "Error uploading avatar" });
        }

        const { password, phone } = req.body;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Authorization token missing" });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        const updateData = {};

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }
        if (phone) {
            updateData.phone = phone;
        }
        if (req.file) {
            updateData.avatar = `/avatars/${req.file.filename}`;
        }

        try {
            const updatedUser = await prisma.user.update({
                where: { email: decoded.email },
                data: updateData,
            });
            return res.status(200).json({ message: "Profile updated", updatedUser });
        } catch (err) {
            return res.status(500).json({ error: "Error updating profile" });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
