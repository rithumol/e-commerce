var db = require('../config/connection')
var collections = require('../config/collection')
const moment = require('moment');
require('mongodb-moment')(moment);
const { ObjectId } = require('mongodb')
const { promise, reject } = require('bcrypt/promises')
var objectId = require('mongodb').ObjectID



module.exports = {
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray().then((products) => {
                resolve(products)
            })
        })
    },
    getAllProductsList: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getWomenProducts: () => {
        return new Promise(async (resolve, reject) => {
            let womenProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({ Category: "Women" }).toArray()
            resolve(womenProducts)
        })
    },
    getMenProducts: () => {
        return new Promise(async (resolve, reject) => {
            let menProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({ Category: "Men" }).toArray()
            resolve(menProducts)
        })
    },
    getKidsProducts: () => {
        return new Promise(async (resolve, reject) => {
            let kidsProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({ Category: "Kids" }).toArray()
            resolve(kidsProducts)
        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    addProduct: (product, images, callback) => {
        product.Images = images
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },
    addCategory: (category, image) => {
        category.Image = image
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).insertOne(category).then((response) => {
                resolve(response)
            })
        })
    },
    updateCategory: (catId, catDetails, image) => {
        return new promise((resolve) => {
            db.get().collection(collections.CATEGORY_COLLECTION).updateOne({ _id: ObjectId(catId) }, {
                $set: {
                    Name: catDetails.Name,
                    Image: image
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    getBannerImages: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).find().toArray().then((images) => {
                resolve(images)
            })
        })
    },
    removeBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).remove({ _id: ObjectId(bannerId) }).then((response) => {
                resolve(response)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) },
                {
                    $set: {
                        Name: proDetails.Name,
                        Category: proDetails.Category,
                        Stock: proDetails.Stock,
                        ActualPrice: proDetails.ActualPrice,
                        DiscountPrice: proDetails.DiscountPrice,
                        Description: proDetails.Description
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).remove({ _id: ObjectId(proId) }).then((response) => {
                resolve(response)
            })
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).remove({ _id: ObjectId(catId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getCategoryDetails: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: ObjectId(catId) }).then((category) => {
                resolve(category)
            })
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    Status: "Blocked"
                }
            }).then((response) => {
                resolve()
            })
        })

    },
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    Status: "Active"
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    updateImages: (id, images) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                $set: {
                    Images: images

                }
            }).then(() => {
                resolve()
            })
        })

    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $project: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        userId: 1,
                        address: 1,
                        userName: 1,
                        paymentMethod: 1,
                        products: 1,
                        totalAmount: 1,
                        status: 1
                    }
                },
                {
                    $sort: { date: -1 }
                }
            ]).toArray()
            resolve(orders)
        })
    },
    getAllOfferPrducts: () => {
        return new Promise(async (resolve, reject) => {
            let offerProducts = await db.get().collection(collections.PROD_OFFER_COLLECTION).find().toArray()
            resolve(offerProducts);
        })
    },
    getAllOfferCategories: () => {
        return new Promise(async (resolve, reject) => {
            let offerCategories = await db.get().collection(collections.CAT_OFFER_COLLECTION).find().toArray()
            resolve(offerCategories)
        })
    },
    statusUpdate: (status, orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        status: status
                    }
                }).then((response) => {
                    resolve(response)
                })

        })
    },
    getUserCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USER_COLLECTION).count().then((userCount) => {
                resolve(userCount)
            })
        })
    },
    getOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.ORDER_COLLECTION).count().then((orderCount) => {
                resolve(orderCount)
            })
        })
    },
    getProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCT_COLLECTION).count().then((productCount) => {
                resolve(productCount)
            })
        })
    },
    getTotalIncome: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "placed" }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray().then((totalIncome) => {
                resolve(totalIncome[0].total)
            })
        })
    },
    getMenProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { Category: "Men" }
                },
                {
                    $count: "totalMenProducts"
                }
            ]).toArray().then((totalMenProducts) => {
                resolve(totalMenProducts[0].totalMenProducts)
            })
        })
    },
    getWomenProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { Category: "Women" }
                },
                {
                    $count: "totalWomenProducts"
                }
            ]).toArray().then((totalWomenProducts) => {
                resolve(totalWomenProducts[0].totalWomenProducts)
            })
        })
    },
    getKidsProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { Category: "Kids" }
                },
                {
                    $count: "totalKidsProducts"
                }
            ]).toArray().then((totalKidsProducts) => {
                resolve(totalKidsProducts[0].totalKidsProducts)
            })
        })
    },

    getActiveUsers: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match: { Status: "Active" }
                },
                {
                    $count: "totalActiveUsers"
                }
            ]).toArray().then((totalActiveUsers) => {
                resolve(totalActiveUsers[0].totalActiveUsers)
            })
        })
    },
    addBanner: (image) => {
        let Image = {}
        Image.Name = image
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).insertOne(Image).then((response) => {
                resolve(response)
            })
        })
    },
    getYearlyIncome: () => {
        return new Promise(async (resolve, reject) => {
            let yearlyIncome = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "delivered" }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y", date: "$date" } },
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray()
            resolve(yearlyIncome)
        })
    },
    getDailyIncome: () => {
        return new Promise(async (resolve, reject) => {
            let dailyIncome = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "delivered" }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                },
                {
                    $limit: 7
                }
            ]).toArray()
            resolve(dailyIncome)
        })
    },
    getMonthlyIncome: () => {
        return new Promise(async (resolve, reject) => {
            let monthlyIncome = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "delivered" }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                        totalAmount: { $sum: "$totalAmount" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: -1 }
                }

            ]).toArray()
            resolve(monthlyIncome)
        })
    },
    getAllDeliveredOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "delivered" }
                },
                {
                    $project: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        userId: 1,
                        address: 1,
                        userName: 1,
                        paymentMethod: 1,
                        products: 1,
                        totalAmount: 1,
                        status: 1
                    }
                },
                {
                    $sort: { _id: -1 }
                }
            ]).toArray()
            resolve(orders)
        })
    },
    addCoupon: (couponData) => {
        couponData.percentage = parseInt(couponData.percentage)

        return new Promise((resolve, reject) => {
            db.get().collection(collections.COUPON_COLLECTION).insertOne(couponData).then(() => {
                resolve()
            })
        })
    },
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collections.COUPON_COLLECTION).find().toArray()
            resolve(coupons)
        })
    },
    deleteCoupon: (cId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.COUPON_COLLECTION).remove({ _id: ObjectId(cId) }).then((response) => {
                resolve(response)
            })
        })
    },
    addCategoryOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            let offerexist = await db.get().collection(collections.CAT_OFFER_COLLECTION).findOne({ offerCategory: data.offerCategory })
            if (offerexist) {
                console.log("Offer exist to this category");
                resolve()
            } else {
                data.startDate = moment(data.startDate).format('YYYY-MM-DD');
                data.endDate = moment(data.endDate).format('YYYY-MM-DD');
                data.percentage = parseInt(data.percentage);
                db.get().collection(collections.CAT_OFFER_COLLECTION).insertOne(data).then((response) => {
                    resolve(response)
                })
            }

        })
    },
    checkCategoryOffer: (todayDate) => {
        console.log('yes i am here');
        let catstartDate = moment(todayDate).format('YYYY-MM-DD');
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collections.CAT_OFFER_COLLECTION).find({ startDate: { $lte: catstartDate } }).toArray()
            if (data.length > 0) {
                await data.map(async (eachData) => {
                    let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ Category: eachData.offerCategory, Offer: { $exists: false } }).toArray()
                    await products.map((data) => {
                        let Price = data.ActualPrice
                        let discount = (((data.ActualPrice) * (eachData.percentage)) / 100);
                        let newPrice = Price - discount;
                        newPrice = newPrice.toFixed()

                        db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(data._id) },
                            {
                                $set: {
                                    DiscountPrice: newPrice,
                                    Offer: true
                                }
                            })

                    })
                })
                resolve()
            } else {
                resolve()
            }
        })
    },
    addProductOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.startDate = moment(data.startDate).format('YYYY-MM-DD');
            data.endDate = moment(data.endDate).format('YYYY-MM-DD');
            data.percentage = parseInt(data.percentage);

            let response = {};
            let proExist = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ Name: data.offerProduct, Offer: { $eq: "true" } })
            if (proExist) {
                console.log('This product already have discount');
                response.exist = true
            } else {
                db.get().collection(collections.PROD_OFFER_COLLECTION).insertOne(data).then((response) => {
                    resolve(response)
                }).catch((err) => {
                    reject(err)
                })
            }
        })
    },
    checkProductOffer: (todayDate) => {
        console.log('Check product offer');
        let offerstartDate = moment(todayDate).format('YYYY-MM-DD');
        console.log("dateeeee", offerstartDate);
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collections.PROD_OFFER_COLLECTION).find({ startDate: { $gte: offerstartDate } }).toArray()
            if (data.length > 0) {
                console.log(data);
                console.log('offer active');
                await data.map(async (eachData) => {
                    console.log("product name:", eachData.offerProduct);
                    let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ Name: eachData.offerProduct, Offer: { $eq: "false" } })
                    console.log("this is the product:", product);
                    if (product) {
                        let percentage = eachData.percentage;
                        let Price = product.ActualPrice;
                        let discount = (((product.ActualPrice) * (eachData.percentage)) / 100);
                        let newPrice = Price - discount;
                        newPrice = newPrice.toFixed()
                        console.log("new Priceeeeeeeee", newPrice);
                        db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(product._id) },
                            {
                                $set: {
                                    DiscountPrice: newPrice,
                                    Discount: percentage,
                                    Offer: "true"
                                }
                            })
                        resolve()
                    } else {
                        resolve()
                    }
                })
            } else {
                console.log("offer not active");
                resolve()
            }
        })
    },
    deleteProductOffer: (offerId) => {
        return new Promise(async (resolve, reject) => {
            let proOffer = await db.get().collection(collections.PROD_OFFER_COLLECTION).findOne({ _id: ObjectId(offerId) })
            let proOfferName = proOffer.offerProduct

            db.get().collection(collections.PROD_OFFER_COLLECTION).remove({ _id: ObjectId(offerId) })
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ Name: proOfferName }, {
                $set: {
                    Offer: "false"
                }
            }).then((response) => {
                resolve(response)
            })
        })
    }
}