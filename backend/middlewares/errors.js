const ErrorHandler = require('../utils/errorHandler');


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'DEVELOPMENT'){
        res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        })
    }

    if (process.env.NODE_ENV === 'PRODUCTION'){
        // Copy of the error
        let error = {...err}

        error.message = err.message;

        // Wrong Mongoose Object ID Error 
        if (err.name === 'CastError'){
            const message = `Ressource non trouvée. Invalide: ${err.path}`
            error = new ErrorHandler(message, 400)
        }

        // Hanling Mongoose Validation Error
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400)
        }

        // Handling Mongoose duplicate key errors (11000 code error)
        if(err.code === 11000) {
            const message = `${Object.keys(err.keyValue)} déjà enregisté.`;
            error = new ErrorHandler(message, 400)
        }

        // Handling wrong JWT error
        if (err.name === 'JsonWebTokenError') {
            const message = 'Le JSON Web Token est invalide. Réessayer !';
            error = new ErrorHandler(message, 400)
        }

        // Handling Expired JWT error
        if (err.name === 'TokenExpiredError') {
            const message = 'Votre JSON Web Token a expiré. Réessayer !';
            error = new ErrorHandler(message, 400)
        }

        res.status(error.statusCode).json({
            success: false,
            message: error.message || 'Erreur serveur.'
        })
    }
    
}