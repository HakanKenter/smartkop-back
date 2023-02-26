const Product = require('../models/product');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

const products = require('../data/products')

// Setting dotenv file
dotenv.config({ path: 'backend/config/config.env' });

connectDatabase();

// Delete all products in Database & Adding products of products.json file 
const seedProducts = async () => {
    try {
        
        // Delete all products
        await Product.deleteMany();
        console.log('Products are deleted');

        // Insert all products of products.json file
        await Product.insertMany(products);
        console.log('All Products are added');

        process.exit();

    } catch (err) {
        console.log(err.message);
        process.exit();
    };
}

seedProducts();