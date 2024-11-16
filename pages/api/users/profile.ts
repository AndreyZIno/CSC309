import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer, { StorageEngine } from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import { Request } from 'express';

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.ACCESS_SECRET as string;

// Configure Multer storage
const storage: StorageEngine = multer.diskStorage({
  destination: './public/avatars',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const runMulter = (req: NextApiRequest & Request): Promise<void> => {
    return new Promise((resolve, reject) => {
      upload.single('avatar')(req, {} as any, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
        await runMulter(req as NextApiRequest & Request);
    } catch (err) {
      return res.status(500).json({ error: 'Error uploading avatar' });
    }

    const { password, phone }: { password?: string; phone?: string } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization token missing' });

    let decoded: any;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const updateData: { password?: string; phone?: string; avatar?: string } = {};

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (phone) {
      updateData.phone = phone;
    }
    if ((req as any).file) {
      updateData.avatar = `/avatars/${(req as any).file.filename}`;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { email: decoded.email },
        data: updateData,
      });
      return res.status(200).json({ message: 'Profile updated', updatedUser });
    } catch (err) {
      return res.status(500).json({ error: 'Error updating profile' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
