const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    //get token
    const token = req.header('x-auth-token');

    // check if token exist
    if (!token) {
        return res.status(401).json({msg: 'No token, authorization denied'})
    }

    // verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({msg: 'Token is invalid, authorization denied'})
    }
}