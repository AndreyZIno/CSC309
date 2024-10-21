import { PrismaClient } from '@prisma/client';
import { authorizeAdmin } from '../../../lib/authentication';

const prisma = new PrismaClient();

export default authorizeAdmin(async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);
        
        const comments = await prisma.comment.findMany({
            skip,
            take,
            include: {
                _count: {
                    select: { reports: true },
                },
                user: { select: { firstName: true, lastName: true } },
                blogPost: true,
                replies: true,
            },
            // ChatGPT way of sorting the number of reports in descending order
            orderBy: {
                reports: { _count: 'desc' },
            },
        });

        res.status(200).json(comments);

    } catch (error) {
        res.status(500).json({ error: 'Could not fetch reported comments' });
    }
});
