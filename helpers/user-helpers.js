var db = require('../config/connection')
var collections = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
var objectId = require('mongodb').ObjectID
const collection = require('../config/collection')
const { response } = require('express')
const moment = require('moment');
//const Razorpay = require('razorpay');
//var rp = require('request-promise');
require("dotenv").config();


const Razorpay=require('razorpay')
const { resolve } = require('path')
const { reject } = require('bcrypt/promises')
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
  });


module.exports = {
    // signUpCheck: (Email) => {
    //     let response = {}
    //     return new Promise(async(resolve,reject) => {
    //         let email = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: Email.Email})
    //         if(email) {
    //             console.log('same email');
    //             response.status = true
    //             resolve(response)
    //         } else {
    //             console.log('no same email');
    //             resolve({ status:false })
    //         }
    //     })
    // },
    signUpCheck:(Details)=>{
        Email=Details.email
        console.log("entered email"+ Email);
        return new Promise(async(resolve,reject)=>{
            let email = await db.get().collection(collections.USER_COLLECTION).findOne({Email:Email})
            
            if(email){
                console.log('same email');
                response.status=true;
                resolve(response)
            }else{
                console.log('no same email');
                response.status=false;
                resolve(response)
            }
        })
    },
    checkMobile:(Details)=>{
        Mobile=Details.mobile
        console.log(Mobile);
        return new Promise(async(resolve,reject)=>{
            let mobile = await db.get().collection(collections.USER_COLLECTION).findOne({Mobile:Mobile})

            if(mobile){
                console.log('same number');
                response.status=true;
                resolve(response)
            }else{
                console.log('no same number');
                response.status=false;
                resolve(response)
            }
        })
    },
    doSignUp: (userData) => {
        return new Promise(async(resolve,reject)=>{
            userData.Password = await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
                console.log(data);
            })
        })
    },
    doLogin: (userData) => {
        console.log(userData.Email)
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: userData.Email })
            console.log(user);
            if (user){
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if(status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        response.status=false;
                        resolve({status:false})
                    }
                })
            } else {
                console.log('login failed');
                
                resolve({status:false})
            }
        })
    },
    changePassword:(data)=>{
        return new Promise(async(resolve,reject)=>{
            console.log("user Email:",data.Email);
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({Email:data.Email});
            if(user){
                console.log("user present");
                bcrypt.compare(data.cpassword, user.Password).then(async(status)=>{
                    if(status) {
                        console.log("password changed");
                        let Password = await bcrypt.hash(data.npassword,10)
                        db.get().collection(collections.USER_COLLECTION).updateOne({Email:data.Email},{
                            $set: {
                                Password : Password
                            }
                        }).then(()=>{
                            resolve({status:true})
                        })
                    }else{
                        console.log("current password is incorrect");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("user not present");
            }
        })
    },
    addToCart:(proId,user)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            obj = {}
            let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(user._id)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:ObjectId(user._id),'products.item':ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    
                    }).then((response)=>{
                        obj.success = true
                        resolve(obj)
                    })
                }else{

                
                db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectId(user._id)},{
            
                        $push:{products:proObj}
                    
                }).then((response)=>{
                    obj.success = true
                    resolve(obj)
                })
            }
            }else{
                let cartObj={
                    user:ObjectId(user._id),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    obj.success = true
                    resolve(obj)
                })
            }
        })
    },
    addToWishlist:(proId,user)=>{
        let proObj={
            item:ObjectId(proId),
           
        }
        return new Promise(async(resolve,reject)=>{
            obj = {}
            let userWishlist=await db.get().collection(collections.WISHLIST_COLLECTION).findOne({user:ObjectId(user._id)})
            if(userWishlist) {
                console.log("Wishlist exist");
                let proExist=userWishlist.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist != -1) {
                    obj.exist = true;
                    resolve(obj)
                }else{

                
                    db.get().collection(collections.WISHLIST_COLLECTION).updateOne({user:ObjectId(user._id)},{
                
                            $push:{products:proObj}
                        
                    }).then((response)=>{
                        obj.success = true;
                        resolve(obj)
                    })
                }
            }else {
                let cartObj={
                    user:ObjectId(user._id),
                    products:[proObj]
                }
                db.get().collection(collections.WISHLIST_COLLECTION).insertOne(cartObj).then((response)=>{
                    obj.success = true;
                    resolve(obj)
                })
            }
           
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

               
            ]).toArray()
            
            resolve(cartItems)
        })
    },
    getWishlistProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let wishlistItems=await db.get().collection(collections.WISHLIST_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

               
            ]).toArray()
            
            resolve(wishlistItems)
        })
    },
    changeProductQuantity:(details)=>{
        count=parseInt(details.count)
        quantity=parseInt(details.quantity)

        return new Promise(async(resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                    $pull:{products:{item:ObjectId(details.product)}}
                    
                }).then((response)=>{
                    console.log('item removed');
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':count}
                
                }).then((response)=>{
                    resolve({status:true})
                })
            }
           
        })
    },
    removeCartItem:(cartId,prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION)
            .updateOne({_id:ObjectId(cartId)},
            {
                $pull:{products:{item:ObjectId(prodId)}}
                
            }).then((response)=>{
                console.log('item removed');
                resolve(true)
            })
        })
    },
    removeWishlistItem:(wishlistId,prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.WISHLIST_COLLECTION)
            .updateOne({_id:ObjectId(wishlistId)},
            {
                $pull:{products:{item:ObjectId(prodId)}}
                
            }).then((response)=>{
                console.log('item removed');
                resolve(true)
            })
        })
    },
    getTotalAmount:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
               
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                       
                    }
                },
               
               
                   {
                       $group:{
                           _id:null,
                           total:{$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.ActualPrice' }]}}
                       }
                   }

               
            ]).toArray()
            console.log(total);
            
            resolve(total[0].total)
        })
    },
    placeOrder:(order,products,total,address,user)=>{
        // let date = new Date()
        // todaydate = moment(date).format('DD-MM-YYYY')
        let Address = address[0]
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1",Address.Address)
        return new Promise((resolve,reject)=>{
            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",order,products,total,address);
            console.log("###########################",Address.Address.Mobile);
            let status=order.paymentMethod==='COD'?'placed':'pending'
            let orderObj={
                address:{
                    mobile:Address.Address.Mobile,
                    address:Address.Address.Address,
                    pincode:Address.Address.Pincode
                },
                userId:ObjectId(order.userId),
                userName:user.Name,
                paymentMethod:order.paymentMethod,
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collections.CART_COLLECTION).remove({user:ObjectId(order.userId)})
                resolve(response.insertedId)
                console.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",response.insertedId);
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            // let orders=await db.get().collection(collections.ORDER_COLLECTION).find({userId:ObjectId(userId)}).sort({date:-1}).toArray()
            // console.log(orders);
            // resolve(orders)
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {userId:ObjectId(userId)}
                },
                {
                    $project:{
                        date:{ $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        userId:1,
                        address:1,
                        userName:1,
                        paymentMethod:1,
                        products:1,
                        totalAmount:1,
                        status:1
                    }
                },
                {
                     $sort : { date : -1 } 
                }
            ]).toArray()
            console.log(":::::::::::::::::::::::",orders);
            resolve(orders)
        })
    },
    getOrders:()=>{
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $project:{
                        date:{ $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        userId:1,
                        address:1,
                        userName:1,
                        paymentMethod:1,
                        products:1,
                        totalAmount:1,
                        status:1
                    }
                },
                {
                     $sort : { date : -1 } 
                }
            ]).toArray()
            console.log(":::::::::::::::::::::::",orders);
            resolve(orders)
        })
    },
    getUserMobilenumber:(mobile)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user=await db.get().collection(collections.USER_COLLECTION).find({Mobile:mobile}).toArray()
            if(user){
                response.user = user
                response.status=true
                resolve(response)
            }else{
                resolve({status:false})
            }
          
        })
    },
    removeOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).remove({ _id: ObjectId(orderId) }).then((response) => {
                console.log(response);
                resolve(response) 
            })
        })
    },
    returnProduct:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
                $set: {
                    status:"returned"
                }
            }).then(()=>{
                resolve()
            })
          
        })
    },
    userStatus: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                if (user.Status == "Active") {
                    console.log("Active User");
                    response.status = true
                    resolve(response)
                } else {
                    console.log("Blocked user");
                    response.block = true;
                    resolve(response)
                }
            } else {
                console.log('no user');
                resolve({ status: false })
            }
        })
    },
    getCartCount:(userId)=>{
        console.log("userid at userhelpers:",userId);
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(cart){
                console.log("cart is present");
                let count=cart.products.length
                console.log("cart count: ",count);
                resolve(count)
            }else{
                console.log("no cart");
                resolve()
            }
        })
    },
    getUserMobileDetails:(mobile)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collections.USER_COLLECTION).findOne({Mobile:mobile})
            // console.log(user);
            resolve(user)
        })
    },
    getOneUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({_id:ObjectId(userId)})
            console.log(user);
            resolve(user)
        })
    },
    addAddress:(userId,Data)=>{
        console.log("###############",userId);
        console.log("@@@@@@@@@@@@@",Data);
        let address = {
            Address_id:new ObjectId(),
            Name:Data.Name,
            City:Data.City,
            Address:Data.Address,
            Pincode:Data.Pincode,
            Mobile:Data.Mobile
        }
        return new Promise((resolve,reject)=>{

            db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $push:{Address:address}
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    getDeliveryAddress:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({_id:ObjectId(userId)})
            console.log("!!!!!!!!!!!!!!!!!!!",user);
            resolve(user)
        })
    },
    getOneAddress:(userId,addressId)=>{
        return new Promise(async(resolve,reject)=>{
            let address = await db.get().collection(collections.USER_COLLECTION).aggregate([{
                $match:{
                    _id:ObjectId(userId)
                }
            },
            {
                $unwind:"$Address"
            },
            {
                $match:{"Address.Address_id":ObjectId(addressId)}
            },
            {
                $project:{_id:0,Address:1}
            }
        ]).toArray()
        console.log("$$$$$$$$$$$$$$$$$",address);
        resolve(address)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderProducts=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log("%%%%%%%%%%%%%%%",orderProducts);
            resolve(orderProducts)
        })
    },
    generateRazorpay:(orderId,total)=>{
        console.log("order id:",orderId);
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total * 100,
                currency:"INR",
                receipt: ""+ orderId
            };
            instance.orders.create(options, function(err,order){
                if(err){
                    console.log(err)
                }else{
                    console.log("new orderrrrrrrrrrrrr",order);
                    resolve(order)
                }
               
            });

               
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto  = require('crypto');
            let hmac = crypto.createHmac('sha256','TWZvFmyvt2iuYr4MCxwg6ied')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getUserDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collections.USER_COLLECTION).findOne({_id:ObjectId(userId)}).then((user)=>{
                console.log("##############",user);
                resolve(user)
            })
           
        })
    },
    updateProfile:(userId,details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
            {
                $set:{
                    Name:details.Name,
                    Email:details.Email,
                    Mobile:details.Mobile
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    addProfilePhoto:(userId,image)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
            {
                $set:{
                    Image:image
                }
            }).then(()=>{
                resolve()
        })
       
        })
    },
    getUserAddress:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let address=  await db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(userId)}
                },
                {
                    $project:{_id:1,Address:1}
                   
                },
                {
                    $unwind:'$Address'
                }
            ]).toArray()
            console.log(address)
            resolve(address)
        })
    },
    deleteAddress:(userId,adId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userId)},
            {
                $pull:{Address:{
                    Address_id:ObjectId(adId)
                }}
            }).then((response)=>{
                console.log('Address removed');
                resolve(response)
            })
        })
    },
    updateOneAddress:(userId,adId,address)=>{
        console.log(address.Name);
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.USER_COLLECTION).updateOne({_id:ObjectId(userId),"Address.Address_id":ObjectId(adId)},
            {
                $set:{
                    "Address.$.Name":address.Name,
                    "Address.$.City":address.City,
                    "Address.$.Address":address.Address,
                    "Address.$.Pincode":address.Pincode,
                    "Address.$.Mobile":address.Mobile
                }
            }).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    couponValidate:(data,userId)=>{
        console.log("jdhsjkhhekudjdhfj",userId);
        var couponData = data;
        console.log("fdjfhdjhdghjdkf",couponData);

        return new Promise(async(resolve,reject)=>{
            obj = {}
                let date = new Date()
                date = moment(date).format('YYYY-MM-DD')
                let coupon = await db.get().collection(collections.COUPON_COLLECTION).findOne({coupon:couponData.Coupon})
                if(coupon) {
                    // console.log("...................",coupon);
                    //     let users = coupon.users
                    //     console.log(">>>>>>>>>>>>>>>>>>",users);
                    //     let userCheck = users.includes(userId)
                    //     console.log("user already used",userCheck);
                    //     if(userCheck) {
                    //         obj.couponUsed = true;
                    //         console.log("response of usercheck",obj);
                    //         resolve(obj)
                    //     }else {
                   
                            if(date <= coupon.endDate) {
                                console.log("yyyy",data);


                                let total = parseInt(couponData.Total)
                                let percentage = parseInt(coupon.percentage)
                                let newPrice = ((total * percentage)/100).toFixed()
                                obj.total = total - newPrice
                                obj.success = true
                                console.log("object",obj);
                                resolve(obj)
                            }else{
                                obj.couponExpired = true
                                console.log("coupon expired");
                                resolve(obj)
                            }
                        
                }else{
                    obj.invalidCoupon = true
                    console.log("Invalid Coupon");
                    resolve(obj)
                }
        })
    }
    
   
}