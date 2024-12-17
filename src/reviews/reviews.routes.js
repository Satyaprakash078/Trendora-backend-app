const express=require('express');
const ReviewModel = require('./reviews.model');
const ProductModel = require('../products/products.model');
const router=express.Router();

// post a new review
 router.post('/post-review',async(req,res)=>{
    try {
        const {comment,rating,productId,userId}= req.body;
        if(!comment || !rating || !productId || !userId){
            return res.status(400).send({messgae:"All fiels are required"})
        }
        const existingReview= await ReviewModel.findOne({productId,userId});
        if(existingReview){
            //updtae it
            existingReview.comment=comment;
            existingReview.rating=rating;
            await existingReview.save();
            console.log(existingReview.rating)
        }else{
            //creating a new review
            const newReview=new ReviewModel({
                comment,rating,productId,userId
            });
            await newReview.save();
        }
        //calculate avg rating
        const reviews=await ReviewModel.find({productId})
        if(reviews.length >0){
            const totalRating = reviews.reduce((acc,review)=>
            acc+review.rating,0);
            const averageRating = totalRating/reviews.length;
            const product=await ProductModel.findById(productId);
            if(product){
                product.rating=averageRating;
                await product.save({validateBeforeSave:false});
            }else{
                return res.status(404).send({message:"Product not found"})
            }
        }
        res.status(200).send({message:"Review added successfully",reviews:reviews})
    } catch (error) {
        console.log("Error in adding a review",error);
        res.status(500).send({messgae:"Failed to add a review"})
    }
 })
 //get total reviews count
 router.get('/total-reviews',async(req,res)=>{
    try {
        const  totalReviews=await ReviewModel.countDocuments({});
        res.status(200).send({totalReviews})
    } catch (error) {
        console.log("Error in getting total review",error);
        res.status(500).send({messgae:"Error in getting total review"})
    }
 });
  //get reviews by userid
  router.get('/:userId',async(req,res)=>{
    const {userId}=req.params;
    if(!userId){
        return res.status(400).send({message:"user id is required"})
    }
    console.log(userId)
    try {
        const  reviews=await ReviewModel.find({userId:userId}).sort({createdAt:-1});
        if(reviews.length===0){
            return res.status(404).send({message:"No reviews found for this user"})
        }
        res.status(200).send({reviews});
        
    } catch (error) {
        console.log("Error in getting review by user",error);
        res.status(500).send({messgae:"Error in getting review by user"})
    }
  })
 module.exports=router; 