var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');
const multer = require('multer');
const { Db } = require('mongodb');
require('dotenv').config();

let admin_password = process.env.ADMIN_PASSWORD

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

// middleware to check admin loggedin
const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/admin-login');
  }
}

/* GET admin home. */
router.get('/', verifyAdminLogin, async function (req, res, next) {
  let totalProducts = await productHelpers.getProductsCount()
  let menProducts = await productHelpers.getMenProductsCount()
  let womenProducts = await productHelpers.getWomenProductsCount()
  let kidsProducts = await productHelpers.getKidsProductsCount()
  let userCount = await productHelpers.getUserCount()
  let orderCount = await productHelpers.getOrdersCount()
  let totalIncome = await productHelpers.getTotalIncome()
  let activeUsers = await productHelpers.getActiveUsers()
  let response = { userCount, orderCount, totalIncome, activeUsers, totalProducts, menProducts, womenProducts, kidsProducts }

  res.render('admin/admin-home', { admin: true, response });
});


// product listing
router.get('/view-products', (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products });
  })
})

// admin login
const credential = {
  Email: "admin@gmail.com",
  Password: admin_password
}
router.get('/admin-login', (req, res) => {
  res.render('admin/admin-login', { loginError: req.session.loginError });
  req.session.loginError = null;
})

router.post('/admin-login', (req, res) => {
  if (req.body.Email == credential.Email && req.body.Password == credential.Password) {
    req.session.adminLoggedIn = true
    req.session.admin = req.body.Email
    res.redirect('/admin');
  } else {
    req.session.loginError = "Invalid username or password!!";
    res.redirect('/admin/admin-login');
  }
})

// admin logout
router.get('/admin-logout', (req, res) => {
  req.session.admin = null;
  req.session.adminLoggedIn = false;
  res.redirect('/');
})

// add new products
router.get('/add-products', function (req, res) {
  productHelpers.getAllCategory().then((category) => {
    res.render('admin/add-product', { category, admin: true })
  })

})

router.post('/add-products', upload.array('Image', 12), function (req, res) {
  let arrayImages = []
  req.files.forEach(function (files, index, ar) {
    arrayImages.push(req.files[index].filename)
  })
  productHelpers.addProduct(req.body, arrayImages, (id) => {
    res.redirect('/admin/view-products');
  })
})

// edit product
router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  productHelpers.getAllCategory().then((category) => {
    res.render('admin/edit-product', { admin: true, product, category });
  })
})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-products');
  })
})

//edit images
router.get('/edit-images/:id', (req, res) => {
  productHelpers.getProductDetails(req.params.id).then((product) => {
    res.render('admin/edit-images', { admin: true, product });
  })
})

router.post('/edit-images/:id', upload.array('Image', 12), (req, res, next) => {
  let arrayImages = []
  req.files.forEach(function (files, index, ar) {
    arrayImages.push(req.files[index].filename)
  })
  productHelpers.updateImages(req.params.id, arrayImages)
  res.redirect('/admin/view-products');
})

// delete product
router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/view-products');
  })
})

// delete category
router.get('/delete-category/:id', (req, res) => {
  let catId = req.params.id
  productHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/all-category');
  })
})

// Get all users
router.get('/all-users', (req, res) => {
  productHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { admin: true, users });
  })

})

// Get all orders
router.get('/view-orders', (req, res) => {
  productHelpers.getAllOrders().then((orders) => {
    res.render('admin/view-orders', { admin: true, orders });
  })

})

// Get Ordered Proucts
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products', { admin: true, products })
})

// Cancel order
router.get('/delete-order/:id', (req, res) => {
  userHelpers.removeOrder(req.params.id).then(() => {
    res.redirect('/admin/view-orders');
  })
})

// Order status update
router.post('/statusUpdate', (req, res) => {
  let status = req.body.status;
  let orderId = req.body.orderId;
  productHelpers.statusUpdate(status, orderId).then((response) => {
    res.json(response)
  })
})

// block user
router.get('/block-user/:id', (req, res) => {
  productHelpers.blockUser(req.params.id).then(() => {
    res.redirect('/admin/all-users')
  })
})

// unblock user
router.get('/unblock-user/:id', (req, res) => {
  productHelpers.unblockUser(req.params.id).then(() => {
    res.redirect('/admin/all-users')
  })
})

// get all categories
router.get('/all-category', (req, res) => {
  productHelpers.getAllCategory().then((category) => {
    res.render('admin/view-category', { category, admin: true })
  })
})

// Add new category
router.get('/add-category', (req, res) => {
  res.render('admin/add-category', { admin: true });
})

router.post('/add-category', upload.single('Image'), (req, res) => {
  let image = req.file.filename;
  productHelpers.addCategory(req.body, image).then((response) => {
    res.redirect('/admin/all-category');
  })
})

// edit category
router.get('/edit-category/:id', async (req, res) => {
  let category = await productHelpers.getCategoryDetails(req.params.id)
  res.render('admin/edit-category', { category, admin: true });
})

router.post('/edit-category/:id', upload.single('Image'), (req, res, next) => {
  let image = req.file.filename;
  productHelpers.updateCategory(req.params.id, req.body, image).then(() => {
    res.redirect('/admin/all-category');
  })
})

// banner management
router.get('/add-banner', (req, res) => {
  productHelpers.getBannerImages().then((images) => {
    res.render('admin/banner', { admin: true, images });
  })
})

router.post('/add-banner', upload.single('Image'), (req, res) => {
  let image = req.file.filename;
  productHelpers.addBanner(image).then((response) => {
    res.redirect('/admin/add-banner');
  })
})

router.get('/delete-banner/:id', (req, res) => {
  productHelpers.removeBanner(req.params.id).then(() => {
    res.redirect('/admin/add-banner');
  })
})

// Get chart Details
router.get('/getChartData', async (req, res) => {
  let yearlyIncome = await productHelpers.getYearlyIncome()
  let yearlySale = [];
  yearlyIncome.map((item) => {
    yearlySale.push(item.totalAmount);
  })
  let year = [];
  yearlyIncome.map((item) => {
    year.push(item._id);
  })
  let monthlyIncome = await productHelpers.getMonthlyIncome()
  let monthlySale = [];
  monthlyIncome.map((item) => {
    monthlySale.push(item.totalAmount);
  })
  let month = [];
  monthlyIncome.map((item) => {
    month.push(item._id);
  })
  let dailyIncome = await productHelpers.getDailyIncome()
  let dailySale = [];
  dailyIncome.map((item) => {
    dailySale.push(item.totalAmount);
  })
  let date = [];
  dailyIncome.map((item) => {
    date.push(item._id);
  })
  res.json({ yearlySale, year, monthlySale, month, dailySale, date })

})

// sales report
router.get('/order-report', (req, res) => {
  productHelpers.getAllDeliveredOrders().then((orders) => {
    res.render('admin/report', { admin: true, orders });
  })
})

// coupon management
router.get('/addCoupon', (req, res) => {
  res.render('admin/coupon', { admin: true });
})

router.post('/addCoupon', (req, res) => {
  productHelpers.addCoupon(req.body).then(() => {
    res.redirect('/admin/viewCoupon');
  })
})

router.get('/viewCoupon', (req, res) => {
  productHelpers.getCoupon().then((coupons) => {
    res.render('admin/view-coupon', { admin: true, coupons });
  })
})

router.get('/delete-coupon/:id', (req, res) => {
  console.log(req.params.id);
  productHelpers.deleteCoupon(req.params.id).then((response) => {
    res.redirect('/admin/viewCoupon');
  })
})

// add product offer
router.get('/add-productoffer', async (req, res) => {
  let offerProducts = await productHelpers.getAllOfferPrducts()
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/product-offer', { admin: true, products, offerProducts });
  })
})

router.post('/add-productoffer', (req, res) => {
  let data = req.body
  productHelpers.addProductOffer(data).then(() => {
    res.redirect('/admin/add-productoffer');
  })
})

// delete product offer
router.get('/delete-productOffer/:id', (req, res) => {
  productHelpers.deleteProductOffer(req.params.id).then((response) => {
    res.redirect('/admin/add-productoffer');
  })
})


// add category offer
router.get('/add-categoryoffer', async (req, res) => {
  let offerCategories = await productHelpers.getAllOfferCategories()
  productHelpers.getAllCategory().then((category) => {
    res.render('admin/category-offer', { admin: true, category, offerCategories });
  })
})

router.post('/add-categoryoffer', (req, res) => {
  let data = req.body
  productHelpers.addCategoryOffer(data).then(() => {
    res.redirect('/admin/add-categoryoffer');
  })
})

module.exports = router;
