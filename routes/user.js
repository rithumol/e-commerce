var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
var otp = require('../config/otp')
const client = require("twilio")(otp.accountSID, otp.authToken)
const multer = require('multer');
const paypal = require('paypal-rest-sdk');
const { Db } = require('mongodb');
require("dotenv").config();

// paypal config
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

// multer disk-storage
const fileStorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/product-images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '--' + file.originalname)
  }
});
upload = multer({ storage: fileStorageEngine })

// middleware to check user loggedin
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login');
  }
}

/* GET home page. */
router.get('/', async function (req, res) {

  let user = req.session.user
  let cartCount = null

  let products = await productHelpers.getAllProductsList()
  if (user) {
    userid = req.session.user._id

    cartCount = await userHelpers.getCartCount(userid)
    req.session.count = cartCount
    res.render('user/landing-page', { user, cartCount, products });
  } else {
    res.render('user/landing-page', { cartCount, products });
  }
});

// user login
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginError: req.session.loginError });
    req.session.loginError = null
  }

})

// middleware to check a user is blocked
const checkUser = (req, res, next) => {
  userHelpers.userStatus(req.body).then((response) => {

    if (response.status) {
      next()
    } else if (response.block) {
      req.session.loginError = "User is Blocked"
      res.redirect('/login');
    } else {
      req.session.loginError = "Invalid Username and Password"
      res.redirect('/login')
    }
  })
}
const login = (req, res, next) => {

  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/');
    } else {
      req.session.loginError = "Invalid Username or Password";
      res.redirect('/login')
    }
  })
}
router.post('/login', checkUser, login)

// check email
router.post('/check-email', (req, res, next) => {
  userHelpers.signUpCheck(req.body).then((response) => {
    res.json(response);
  })
})

// check mobile
router.post('/check-mobile', (req, res) => {
  userHelpers.checkMobile(req.body).then((response) => {
    res.json(response);
  })
})

// otp login
router.get('/otp-login', (req, res) => {
  res.render('user/mobile', { loginError: req.session.loginError });
})

router.post('/otp-login', async (req, res) => {
  console.log("post otp login");
  console.log(req.body.Mobile);
  const userMobile = req.body.Mobile;
  client
    .verify
    .services(otp.serviceID)
    .verifications
    .create({
      to: `+91${req.body.Mobile}`,
      channel: "sms"
    })
    .then((response) => {
      console.log(response);
      res.render('user/verify-otp', { userMobile });
    })
})

router.post('/verify-otp', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    const userOtp = req.body.otp

    client
      .verify
      .services(otp.serviceID)
      .verificationChecks
      .create({
        to: `+91${req.body.userNumber}`,
        code: userOtp
      }).then(async (response) => {
        let user = await userHelpers.getUserMobileDetails(req.body.userNumber)
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect('/');
      })
  }

})

// user logout
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

// user signup
router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup');
  }
})

router.post('/signup', (req, res) => {

  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = req.body
    res.redirect('/')
  })

})

// view products

router.get('/view-products', async (req, res) => {
  let user = req.session.user
  let today = new Date();
  let cartCount = null
  if (req.session.user) {
    userid = req.session.user._id
    cartCount = await userHelpers.getCartCount(userid)
  }
  await productHelpers.checkProductOffer(today)
  await productHelpers.checkCategoryOffer(today)
  await productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { admin: false, user, products, cartCount });
  })

})
// single product view
router.get('/single-productview/:id', async (req, res) => {

  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    userid = req.session.user._id
    cartCount = await userHelpers.getCartCount(userid)
  }
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('user/single-product', { admin: false, user, product, cartCount });
})

// cart page
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = 0
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }
  res.render('user/cart-page', { user: true, user, products, total });
})

// wishlist page
router.get('/wishlist', verifyLogin, async (req, res) => {
  let products = await userHelpers.getWishlistProducts(req.session.user._id)
  res.render('user/wishlist', { user: req.session.user, products });
})

// add to wishlist
router.get('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  userHelpers.addToWishlist(req.params.id, req.session.user).then((response) => {
    res.json(response);
  })
})

// delete wishlist item
router.get('/delete-wishlistItem/:wishlistid/:prodid', (req, res) => {
  userHelpers.removeWishlistItem(req.params.wishlistid, req.params.prodid).then(() => {
    res.redirect('/wishlist');
  })
})

// add to cart
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user).then((response) => {
    res.json(response);
  })
})

// change product quantity
router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

// delete cart item
router.get('/delete-cartItem/:cartid/:prodid', (req, res) => {
  userHelpers.removeCartItem(req.params.cartid, req.params.prodid).then(() => {
    res.redirect('/cart');
  })
})

// Get user profile
router.get('/user-profile', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let userDetails = await userHelpers.getUserDetails(req.session.user._id)
  res.render('user/user-profile', { user: true, user, userDetails });
})

router.post('/user-profile', (req, res) => {
  userHelpers.updateProfile(req.session.user._id, req.body).then(() => {
    res.redirect('/user-profile');
  })
})

// change profile photo
router.post('/edit-photo', upload.single('Image'), (req, res) => {
  let image = req.file.filename;
  userHelpers.addProfilePhoto(req.session.user._id, image).then(() => {
    res.redirect('/user-profile');
  })
})

// view address
router.get('/view-address', async (req, res) => {
  let address = await userHelpers.getUserAddress(req.session.user._id)
  res.render('user/view-address', { user: true, address, user: req.session.user });
})

// change password
router.get('/change-password', verifyLogin, (req, res) => {
  res.render('user/change-password', { user: true, user: req.session.user, smessage: req.session.pcs, fmessage: req.session.pcf });
  req.session.pcs = "";
  req.session.pcf = "";
})

router.post('/change-password', (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    if (response.status) {
      req.session.pcs = "Password Changed Successfully";
      res.redirect('/change-password');
    } else {
      req.session.pcf = "Current Password is incorrect";
      res.redirect('/change-password');
    }
  })
})

// delete address
router.get('/delete-address/:id', (req, res) => {
  userHelpers.deleteAddress(req.session.user._id, req.params.id).then(() => {
    res.redirect('/view-address');
  })
})

// edit address
router.get('/edit-address/:id', async (req, res) => {
  let address = await userHelpers.getOneAddress(req.session.user._id, req.params.id)
  let Address = address[0];
  res.render('user/edit-address', { Address, user: true, user: req.session.user });
})

router.post('/edit-address/:id', (req, res) => {
  userHelpers.updateOneAddress(req.session.user._id, req.params.id, req.body).then(() => {
    res.redirect('/view-address');
  })
})

// check out page
router.get('/check-out', verifyLogin, async (req, res) => {
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let userAddress = await userHelpers.getDeliveryAddress(req.session.user._id)
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  res.render('user/check-out', { total, products, user, userAddress, cartCount });
})

router.post('/check-out', async (req, res) => {
  console.log("api call");
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = req.body.Total
  let address = await userHelpers.getOneAddress(req.body.userId, req.body.address)
  let user = await userHelpers.getOneUser(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice, address, user).then((orderId) => {
    req.session.orderId = orderId;
    if (req.body['paymentMethod'] == 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['paymentMethod'] == 'PAYPAL') {
      let price = parseInt(totalPrice);

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "https://ecart.life/success",
          "cancel_url": "https://ecart.life/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "Red Sox Hat",
              "sku": "001",
              "price": "5.00",
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": "5.00"
          },
          "description": "Hat for the best team ever"
        }]
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              let link = payment.links[i].href;
              link = link.toString()
              res.json({ paypal: true, url: link })
            }
          }
        }
      });

    }
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }

  })

  router.get('/success', verifyLogin, (req, res) => {
    userHelpers.changePaymentStatus(req.session.orderId).then(() => {
      res.render('user/order-success');
    })

  })
  router.get('/cancel', (req, res) => res.send('Cancelled'));

  // verify payment
  router.post('/verify-payment', (req, res) => {
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
        res.json({ status: true })
      })
    }).catch((err) => {
      res.json({ status: false, errMsg: '' })
    })
  })

  // order success page
  router.get('/order-success', (req, res) => {
    let user = req.session.user
    res.render('user/order-success', { user })
  })
})

// view user orders
router.get('/orders', verifyLogin, async (req, res) => {
  let user = req.session.user._id
  let orders = await userHelpers. getUserOrders(user)
  res.render('user/view-orders', { user: req.session.user, orders })
})

// view order products
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})

// delete order
router.get('/delete-order/:id', (req, res) => {
  userHelpers.removeOrder(req.params.id).then(() => {
    res.redirect('/orders');
  })
})

// return order
router.get('/return-order/:id', (req, res) => {
  userHelpers.returnProduct(req.params.id).then(() => {
    res.redirect('/orders');
  })
})

// add address
router.get('/add-address', verifyLogin, (req, res) => {
  res.render('user/add-address', { user: true, user: req.session.user });
})

router.post('/add-address', verifyLogin, (req, res) => {
  let user = req.session.user._id;
  userHelpers.addAddress(user, req.body).then((response) => {
    res.redirect('/check-out');
  })
})

// go back
router.get('/go-back', (req, res) => {
  res.redirect('/check-out');
})

// Apply coupon
router.post('/couponApply', verifyLogin, (req, res) => {
  let id = req.session.user._id;
  userHelpers.couponValidate(req.body, id).then((response) => {
    res.json(response);
  })
})

// get women products
router.get('/womenProducts', async (req, res) => {
  let products = await productHelpers.getWomenProducts()
  res.render('user/womenPage', { products, user: req.session.user });
})

// get men products
router.get('/menProducts', async (req, res) => {
  let products = await productHelpers.getMenProducts()
  res.render('user/menPage', { products, user: req.session.user });
})

// get kids products
router.get('/kidsProducts', async (req, res) => {
  let products = await productHelpers.getKidsProducts()
  res.render('user/kidsPage', { products, user: req.session.user });
})


module.exports = router;
