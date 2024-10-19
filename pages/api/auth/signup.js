import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { firstName, lastName, email, password, avatar, phone } = req.body;

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        avatar,
        phone
      }
    });

    res.status(201).json({ message: 'User created successfully', newUser });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
