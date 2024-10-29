import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';

const prisma = new PrismaClient();
const defaultAvatarPath = '/images/default-avatar.png';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { firstName, lastName, email, password, phone, role } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                avatar: defaultAvatarPath,
                phone,
                role
            }
        });

        res.status(201).json({ message: 'User created successfully', newUser });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}