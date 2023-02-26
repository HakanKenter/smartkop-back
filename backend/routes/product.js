const express = require('express');
const router = express.Router();

const { 
    getProducts, 
    newProduct, 
    getSingleProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductReviews,
    deleteReview,
    getAdminProducts,
    getAllProducts
} = require('../controllers/productController');

// middleware for check if user is authenticated
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');


router.route('/products').get(getProducts);
router.route('/allproducts').get(getAllProducts);
router.route('/product/:id').get(getSingleProduct);

// They have exaclty the same route so we can write like this
router.route('/admin/product/:id')
            .put(isAuthenticatedUser, authorizeRoles('admin'), updateProduct)
            .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);


router.route('/review').put(isAuthenticatedUser, createProductReview);
router.route('/reviews').get(isAuthenticatedUser, getProductReviews);
router.route('/reviews').delete(isAuthenticatedUser, deleteReview);


// _____________________ ADMIN  _____________________ //


router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles('admin'), newProduct);

module.exports = router;