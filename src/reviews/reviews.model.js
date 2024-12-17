const mongoose =require('mongoose');

const ReviewSchema=new mongoose.Schema({
     comment:{type:String,required:true},
     rating:{type:Number,required:true},
     productId:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},
     userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true})

const ReviewModel=mongoose.model('Review',ReviewSchema);

module.exports=ReviewModel;