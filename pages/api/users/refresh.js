import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export default function handler(req, res) {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is missing' });
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const accessToken = jwt.sign(
            { username: decoded.username, role: decoded.role },
            ACCESS_SECRET,
            { expiresIn: '20m' }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}