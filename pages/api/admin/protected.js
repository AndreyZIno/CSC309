import { authorizeAdmin } from '../../../lib/authentication';

function handler(req, res) {
    res.status(200).json({ message: 'In admin protected route', user: req.user} );
}

export default authorizeAdmin(handler);