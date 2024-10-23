import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_SECRET;

export function verifyJWT(req) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    return jwt.verify(token, ACCESS_SECRET);
}

export function authenticate(handler) {
    return async (req, res) => {
        try {
            req.user = verifyJWT(req);
            return await handler(req, res);
        } catch (error) {
            return res.status(401).json({ error: 'Unauthorized access' });
        }
    };
}

export function authorizeAdmin(handler) {
    return authenticate(async (req, res) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        return await handler(req, res);
    });
}