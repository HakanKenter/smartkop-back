const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");

/**
 * Checks if user is authenticated or not
 */
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {

    const { token } = req.cookies;
    if(!token) {
        return next(new ErrorHandler('Connectez-vous pour accéder à cette ressource.', 401))
    }

    // Verify if the token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if(!decoded) {
        return next(new ErrorHandler('Token invalide.', 401))
    }

    req.user = await User.findById(decoded.id);

    next();

})

/**
 * Handling users roles
 */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(`Le rôle (${req.user.role}) n'est pas autorisé à accéder à cette ressource.`, 403)
            )
        }
        next()
    }
}