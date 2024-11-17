import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const adminData = {
    firstName: process.env.ADMIN_FIRST_NAME || "Test",
    lastName: process.env.ADMIN_LAST_NAME || "Admin",
    email: process.env.ADMIN_EMAIL || "adminUser@gmail.com",
    password: process.env.ADMIN_PASSWORD || "123",
    avatar: process.env.ADMIN_AVATAR || "Test Avatar",
    phone: process.env.ADMIN_PHONE || "1234567890",
    role: process.env.ADMIN_ROLE || "ADMIN",
};

async function createAdmin() {
    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminData.email },
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminData.password, 10);

            await prisma.user.create({
                data: {
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    email: adminData.email,
                    password: hashedPassword,
                    avatar: adminData.avatar,
                    phone: adminData.phone,
                    role: adminData.role,
                },
            });
            console.log("Admin user created successfully.");
        } else {
            console.log("Admin user already exists. Skipping creation.");
        }
    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
