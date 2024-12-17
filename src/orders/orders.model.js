const mongoose = require('mongoose');
const orderSchema= new mongoose.Schema({
    OrderId:String,
    products:[{
            productId:{type:String,required:true},
            quantity:{type:Number,required:true},
    }],
    amount:Number,
    email:{type:String,required:true},
    status:{
        type:String,
        enum:['pending','processing','shipped','completed'],
        default:'pending'
    }
    
},{timestamps:true});

const OrderModel=mongoose.model('Order',orderSchema);
module.exports=OrderModel;