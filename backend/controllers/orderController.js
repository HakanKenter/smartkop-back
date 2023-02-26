const Order = require('../models/order');
const Product = require('../models/product');

const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const order = require('../models/order');
const sendEmail = require('../utils/sendEmail');

/**
 * Create a new Order  => /api/v1/order/new
 * @params {Object} params
 */
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const { 
        orderItems,
        shippingInfo,
        itmesPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const user = req.user;
    let allItems = [];

    if (orderItems.length >= 1) {
        orderItems.forEach(item => allItems.push(item.name))
    }

    const html = `
    <h3>Félicitation ${user.name} !</h3>
    
    <div>
        Nous confirmons le paiement de votre commande !<br><br>

        Voici vos articles : <br><br>
        <p style="color: blue">
        ${allItems.join(', ')}
        </p><br>

        Livraison prévue à l'adresse suivante : 
        <span style="color: blue">${shippingInfo.address + ', ' + shippingInfo.city + ' ' + shippingInfo.postalCode + ', ' + shippingInfo.country}</span><br><br>

        Vous pouvez retourner sur le site en cliquant sur ici <a href="${process.env.FRONTEND_URL}">SmartKop<a/>.<br><br><br>

        À très bientôt !<br>
        L'équipe SmartKop
    </div>
    `

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itmesPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    });

    await sendEmail({
        email: user.email,
        subject: 'Achat SmartKop',
        html
    })

    res.status(200).json({
        succes: true,
        order
    })
});


/**
 * Get single order  => /api/v1/order/:id
 * @param id
 */
exports.getSingleOrder = catchAsyncErrors( async(req, res, next) => {   
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if(!order) {
        return next(new ErrorHandler('Aucune commande trouvée avec cet ID.', 404));
    }

    res.status(200).json({
        succes: true,
        order
    })
})

/**
 * Get logged in user orders  => /api/v1/orders/me
 * @param id
 */
exports.myOrders = catchAsyncErrors( async(req, res, next) => {
    const orders = await Order.find({ user: req.user.id })

    res.status(200).json({
        succes: true,
        orders
    })
})

/**
 * Get all orders - ADMIN  => /api/v1/admin/orders
 */
exports.allOrders = catchAsyncErrors( async(req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => totalAmount += order.totalPrice)

    res.status(200).json({
        succes: true,
        totalAmount,
        orders
    })
})

/**
 * Update / Process order - ADMIN  => /api/v1/admin/order/:id
 */
exports.updateOrder = catchAsyncErrors( async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(order.orderStatus === 'Livre') {
        return next(new ErrorHandler('Vous avez déjà livré cette commande', 400));
    }

    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity)
    })

    order.orderStatus = req.body.status,
    order.deliveredAt = Date.now()

    await order.save()

    res.status(200).json({
        success: true
    })
})

// Update stock of the product by it's ID
async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false });
}

/**
 * Delete order  => /api/v1/admin/order/:id
 */
exports.deleteOrder = catchAsyncErrors( async(req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler('Aucune de commande trouvée avec cet ID.', 404));
    }

    await order.remove();

    res.status(200).json({
        success: true
    })

})