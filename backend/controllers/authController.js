const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

const crypto = require('crypto');
const cloudinary = require('cloudinary');

/**
 * Register a user  => /api/v1/register
 */
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    let result;
    let public_id_default = "avatars/default/default_lxhh71";
    let secure_url_default = "https://res.cloudinary.com/dzlkkma0b/image/upload/v1673905645/avatars/default/default_lxhh71.webp"

    if (req.body.avatar) {
        result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,     
            crop: "scale"
        })
    }
    
    // const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //     folder: "avatars",
    //     width: 150, 
    //     crop: "scale"
    // })

    const { name, email, password } = req.body;

    const html = `
    <h3>Bonjour ${name},</h3>
    
    <div>
        Bienvenue chez SmartKop !<br><br>

        Cet email confirme votre inscription.<br>
        Vous pouvez retourner sur le site en cliquant sur ici <a href="${process.env.FRONTEND_URL}">SmartKop<a/>.<br><br><br>

        À très bientôt !<br>
        L'équipe SmartKop
    </div>
    `
    const user = await User.create({
        name,
        email, 
        password, 
        avatar: {
            public_id: result ? result.public_id : public_id_default,
            url: result ? result.secure_url : secure_url_default,
        }   
    })

    await sendEmail({
        email: email,
        subject: 'Inscription SmartKop',
        html
    })

    sendToken(user, 200, res);

})

/**
 * Login a user  => /api/v1/login
 */
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    
    const { email, password } = req.body;

    // Check if email and password is entered by user
    if (!email || !password) {
        return next(new ErrorHandler('Veuillez entrer votre email et votre mot de passe.', 400))
    }

    // Finding user in database
    const user = await User.findOne({
        email
    }).select('+password')

    if(!user) {
        return next(new ErrorHandler('Adresse email ou mot de passe incorrecte.', 401))
    }

    // Check if password is correct or not (return boolean)
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler('Adresse email ou mot de passe incorrecte.', 401));
    }

    sendToken(user, 200, res);

})

/**
 * Forgot password  => /api/v1/password/forgot
 */
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {

    // Finding user in database
    const user = await User.findOne({
        email: req.body.email
    })

    if(!user) {
        return next(new ErrorHandler('Aucun utilisateur avec cette adresse email.', 404))
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset password url
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    // const resetUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;    

    const html = `
    <h3>Demande de réinitialisation.</h3>

    <div>
        Vous pouvez réinitialiser votre mot de passe en cliquant : <a href="${resetUrl}">Ici</a><br>
        Si vous n'êtes pas à l'origine de cette demande vous pouvez l'ignorer.<br><br>
        
        À très bientôt !<br>
        L'équipe SmartKop
    </div>
    `

    try {

        await sendEmail({
            email: user.email,
            subject: 'SmartKop, récupération de mot de passe.',
            html
        })

        res.status(200).json({
            success: true,
            message: `Email envoyé à : ${user.email}`
        })
        
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500))
    }
})

/**
 * Reset password  => /api/v1/password/reset/:token
 */
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    // Finding user in database with token and make sur that the resetPasswordExpire is greater than date.now()
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if(!user) {
        return next(new ErrorHandler('Token de récupération de mot de passe invalide ou expiré.', 400))
    }

    // compare with resetPasswordToken of the database
    if(req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Les mots de passe ne correspondent pas.', 400))
    }

    // Setup new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);

})

/**
 * Get currently logged in user details  => /api/v1/me
 */
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        user
    })
})

/**
 * Update / Change password  => /api/v1/password/update
 */
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check previous user password 
    const isMatched = await user.comparePassword(req.body.oldPassword);

    if(!isMatched) {
        return next(new ErrorHandler('Ancien mot de passe incorrecte.', 400));
    }

    user.password = req.body.password; 
    await user.save();

    sendToken(user, 200, res);
})

/**
 * Update user profil  => /api/v1/me/update
 */
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    // Update avatar
    if (req.body.avatar && req.body.avatar !== '') {
        const user = await User.findById(req.user.id)

        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        }) 

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

/**
 * Update user cart Items => /api/v1/me/update/cart
 */
exports.updateCart = catchAsyncErrors(async (req, res, next) => {

    const user = req.user._id;
    const cart = JSON.parse(req.body.allCartItems)

    // const cart = req.body.allCartItems;
    // const allCartItems = [
    //     {"product": "63b1e67619e585e27c1f8549"},
    //     {"product": "6399ea7d0e3535fcc76e247f"},
    //     {"product": "6399ea7d0e3535fcc76e2481"}
    // ]

    const loggedInUser = await User.findById(user);

    if (loggedInUser.cartItems.length > 0) { 
        loggedInUser.cartItems = [];
    }
    loggedInUser.cartItems = cart;

    await loggedInUser.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })
    
})


/**
 * Logout a user  => /api/v1/logout
 */
exports.logout = catchAsyncErrors(async (req, res, next) => {
    
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    res.status(200).json({
        success: true,
        message: 'Déconnecté.'
    })

})


// ADMIN ROUTES

/**
 * Get all users  => /api/v1/admin/users
 */
exports.allUsers = catchAsyncErrors(async (req, res, next) => {

    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})


/**
 * Get user details  => /api/v1/admin/user/:id
 */
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`Utilisateur avec l'id : ${req.params.id} non trouvé.`, 404))
    }

    res.status(200).json({
        success: true,
        user
    })

})

/**
 * Update user profil  => /api/v1/admin/user/:id
 */
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true
    })
})


/**
 * Delete user  => /api/v1/admin/user/:id
 */
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`Utilisateur avec l'id : ${req.params.id} non trouvé.`, 404))
    }

    // Remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

    await user.remove();

    res.status(200).json({
        success: true
    })

})