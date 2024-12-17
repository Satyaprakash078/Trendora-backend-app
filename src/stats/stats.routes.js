const express = require("express");
const User = require("../users/user.model");
const OrderModel = require("../orders/orders.model");
const ReviewModel = require("../reviews/reviews.model");
const ProductModel = require("../products/products.model");
const router = express.Router();
  
//user stats by email
 router.get("/user-stats/:email",async (req,res)=>{
     const {email}= req.params
     if(! email){
        return res.status(400).json({message:"Email is required"})
     }
     try {
        const user= await User.findOne({email: email});
       /// console.log(user)
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        //sum of all payments for tht specific user
        const totalPayments = await OrderModel.aggregate([
            {$match :{email:email}},
            {
                $group:{_id:null, totalAmount:{$sum:"$amount"}}
            }
        ])
        const totalPaymentsAmount= totalPayments.length >0 ? totalPayments[0].totalAmount : 0
        //get total review 
        const totalReviews = await ReviewModel.countDocuments({userId:user._id});
        
        //total purchased products
        const purchasedProductsIds= await OrderModel.distinct("products.productId",{email:email});
        const totalPurchasedProducts= purchasedProductsIds.length;

        res.status(200).send({
            totalPayments: totalPaymentsAmount.toFixed(2),
            totalReviews,
            totalPurchasedProducts
        })
     } catch (error) {
        console.log("Error in fetching user stats by email",error)
        res.status(500).send({message:"Error in fetching user stats by email"})
     }
 })

  //admin stats
  router.get("/admin-stats",async (req,res)=>{
     try {
        const totalOrders= await OrderModel.countDocuments();
        const totalUsers= await User.countDocuments();
        const totalReviews= await ReviewModel.countDocuments();
        const totalProducts= await ProductModel.countDocuments();

        //calculate total earnings
        const totalEarnings= await OrderModel.aggregate([
            {
                $group:{
                    _id:null,
                    totalAmount:{$sum:"$amount"}
                }
            }
        ])
        const totalEarningAmount= totalEarnings.length >0 ? totalEarnings[0].totalAmount : 0;
        
        //if hav to show monthly earning
        const monthlyEarnings= await OrderModel.aggregate([
            {
                $group:{
                    _id:{month:{$month: "$createdAt"}, year:{$year:"$createdAt"}},
                    monthlyAmount:{$sum:"$amount"}
                }
            },
            {
                $sort:{"_id.year":1,"_id.month":1}
            }
        ])

        //formate monthly earnings
        const formattedMonthlyEarnings= monthlyEarnings.map((item)=>({
            month:item._id.month,
            year: item._id.year,
            earnings:item.monthlyAmount.toFixed(2)
        }))
        res.status(200).json({
            totalOrders,
            totalUsers,
            totalReviews,
            totalProducts,
            totalEarningAmount,
            formattedMonthlyEarnings
        })
     } catch (error) {
        console.log("Error in fetching admin stats",error)
        res.status(500).send({message:"Error in fetching admin stats"})
     }
  })

module.exports=router;