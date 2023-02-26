const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Veuillez entrer votre nom.'],
        maxLength: [30, 'Votre nom ne peut excéder 30 caractères.']
    },
    email: {
        type: String,
        required: [true, 'Veuillez entrer votre email.'],
        unique: true,
        validate: [validator.isEmail, 'Veuillez entrer une adresse email valide.']
    },
    password: {
        type: String,
        required: [true, 'Veuillez saisir votre mot de passe.'],
        minlength: [6, 'Le mot de passe doit contenir au minimum 6 caractères.'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    cartItems: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: false
            },
            quantity: {
                type: Number,
                required: false,
            }
        }
    ],
    role: {
        type: String,
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date

})

// Encrypting password before saving user
userSchema.pre('save', async function(next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }
    
    user.password = await bcrypt.hash(user.password, 10);
})

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Return JWT token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Set token expire time (30 minutes)
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken
}

module.exports = mongoose.model('User', userSchema);