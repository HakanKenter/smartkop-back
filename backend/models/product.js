const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Veuillez sélectionner un nom de produit.'],
        trim: true,
        maxLength: [100, 'Un nom de produit ne peut pas excéder 100 caractères.']
    },
    price: {
        type: Number,
        required: [true, 'Veuillez choisir un prix.'],
        maxLength: [5, "Le prix d'un produit ne peut excéder 5 caractères."],
        default: 0.0
    },
    description: {
        type: String,
        required: [true, 'Veuillez entrer une description.'],
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            },
        }
    ],
    category: {
        type: String,
        required: [true, 'Veuillez sélectionner une catégorie.'],
        enum: {
            values: [
                "Electronique",
                "Appareils photo",
                "Camera",
                "Ordinateur portable",
                "Accessoires",
                "Casques",
                "Ordinateur",
                "Carte graphique",
                "Carte mémoire",
                "USB",
                "Chargeur",
                "LED",
                "Tablette",
                "Smartphone"
            ],
            message: 'Veuillez sélectionner une catégorie correcte.'
        }
    },
    seller: {
        type: String,
        required: [true, 'Veuillez entrer un nom de vendeur.'],
    },
    stock: {
        type: Number,
        required: [true, 'Veuillez choisir un nombre de stock.'],
        maxlength: [5, 'Le nombre en stock ne peut excéder 5 caractères.'],
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: false,
            }
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    deletedAt: {
        type: Date,
        default: null,
    }
})

module.exports = mongoose.model('Product', productsSchema);