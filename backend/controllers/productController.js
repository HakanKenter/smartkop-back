const Product = require('../models/product');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require('cloudinary');


/**
 * Create new product (ADMIN) => /api/v1/admin/product/new
 * @param Product
 */
exports.newProduct = catchAsyncErrors(async (req, res, next) => {

    let images = []

    // This because if user upload one images it is object, but 
    // for multiple images each one was string
    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    } 

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products'
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product
    })
})
  
/**
 * Get all products  => /api/v1/products?keyword=apple&page=1
 */
exports.getProducts = catchAsyncErrors (async (req, res, next) => {

    const resPerPage = 6;
    const productsCount = await Product.countDocuments();

    if (req.query.resPerPage) {
        delete req.query.resPerPage;
    }

    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()

    let products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    // if (resPerPage > 0) {
        apiFeatures.pagination(resPerPage)
    // }
    products = await apiFeatures.query.clone();

    res.status(200).json({
        success: true,
        productsCount,
        resPerPage,
        filteredProductsCount,
        products
    })
})

/**
 * Get all products  => /api/v1/allproducts (without options)
 */
exports.getAllProducts = catchAsyncErrors (async (req, res, next) => {

    const productsCount = await Product.countDocuments();
    const apiFeatures = new APIFeatures(Product.find(), req.query).filter()

    let products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    products = await apiFeatures.query.clone();

    res.status(200).json({
        success: true,
        productsCount,
        products
    })
})

/**
 * Get asingle product details  => /api/v1/product/:id
 * @param _id
 */
exports.getSingleProduct = catchAsyncErrors (async (req, res, next) => {

    const product = await Product.findOne({
        _id: req.params.id
    })

    if (!product) {
        return next(new ErrorHandler('Produit non trouvé.', 404));
    }

    res.status(200).json({
        success: true,
        product
    })
})

/**
 * Update product  => /api/v1/admin/product/:id
 * @param {String} _id
 * @param {Object} req
 */
exports.updateProduct = catchAsyncErrors (async (req, res, next) => {

    let product = await Product.findById(req.params.id);

    if(!product) {
        return next(new ErrorHandler('Produit non trouvé.', 404));
    }

    let images = []

    // This because if user upload one images it is object, but 
    // for multiple images each one was string
    if (typeof req.body.images === 'string') {
        images.push(req.body.images)
    } else {
        images = req.body.images
    }

    if(images !== undefined) {

        // Deleting images associated with the product
        for (let i = 0; i < product.images.length; i++) {
            const result = await cloudinary.v2.uploader.destroy(product.images[i].public_id)
        }
        // Update new Images
        let imagesLinks = [];
    
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: 'products'
            });
    
            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url
            })
        }
        
        req.body.images = imagesLinks
    }


    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        product
    })
})

/**
 * Delete product  => /api/v1/admin/product/:id
 * @param _id
 */
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Produit non trouvé.', 404));
    }

    // Deleting images associated with the product
    for (let i = 0; i < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(product.images[i].public_id)
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: 'Produit supprimé.'
    })

})

/**
 * Create new review  => /api/v1/review
 */
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body;
    
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )

    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })

})


/**
 * Get Product Review  => /api/v1/reviews
 */
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })

});

/**
 * Delete Product Review  => /api/v1/reviews
 */
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    console.log(product);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})


// _______________________ ADMIN _______________________ //


/**
 * Get all products (ADMIN) => /api/v1/admin/products
 */
exports.getAdminProducts = catchAsyncErrors (async (req, res, next) => {

    const products = await Product.find();

    res.status(200).json({
        success: true,
        products
    })
})
