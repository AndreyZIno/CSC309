import { authenticate } from '../../lib/authentication';

function handler(req, res) {
    res.status(200).json({ message: 'In protected route', user: req.user} );
}

export default authenticate(handler);