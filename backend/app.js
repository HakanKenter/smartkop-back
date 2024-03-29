const express = require('express');
const cors = require('cors');
const app = express();

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const path = require('path');

const errorMiddleware = require('./middlewares/errors');

// app.use(cors());
app.use(cors({ 
    origin: "https://smart-kop.com",
    // origin: "http://localhost:3000",
    credentials: true
}));

// Setting up config file
// if(process.env.NODE_ENV !== 'PRODUCTION') require('dotenv').dotenv.config({ path: 'backend/config/config.env' });
dotenv.config({ path: 'backend/config/config.env' });

// Usefull for upload images with big payload
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static(__dirname + '/public/'));

/******************************************************************************/
/******************************   Import routes   *****************************/


const products = require('./routes/product');
const auth = require('./routes/auth');
const payment = require('./routes/payment');
const order = require('./routes/order');


/******************************************************************************/
/******************************    Use routes    ******************************/

app.use('/api/v1', products)
app.use('/api/v1', auth)
app.use('/api/v1', payment)
app.use('/api/v1', order)

// if(process.env.NODE_ENV === 'PRODUCTION') {
//     // console.log((path.join(__dirname)))
//     app.use(express.static(path.join(__dirname, '../frontend/build')))

//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
//     })
// }

/******************************************************************************/
/****************************** Use middleswares ******************************/

// Middleware to handle errors
app.use(errorMiddleware);


module.exports = app