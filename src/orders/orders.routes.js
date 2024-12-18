const express = require('express');
const OrderModel = require('./orders.model');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const router=express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// create checkout session
router.post('/create-checkout-session',async(req,res)=>{
    const {products}=req.body;
        
    try {
        const lineItems = products.map((product) => {
            const productPriceWithTax = Math.round(product.price * 100 * (1 + 0.05)); // Price including 5% tax
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: productPriceWithTax, // Price in cents including tax
                },
                quantity: product.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types : ['card'],
            line_items : lineItems,
            mode: 'payment',
            success_url: `https://trendora-frontend-plum.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://trendora-frontend-plum.vercel.app/cancel`,
           
        })
        res.json({id:session.id})
    } catch (error) {
        console.log("Error in creating checkout session",error);
        res.status(500).send({message:"Error in creating checkout session"})
    }
});

 //confirm payment
 router.post('/confirm-payment',async(req,res)=>{
    const {session_id}=req.body;

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id,{
            expand: ['line_items','payment_intent']
        });
        const paymentIntentId = session.payment_intent.id;
        let order= await OrderModel.findOne({OrderId: paymentIntentId});
        if(!order){
            const lineItems= session.line_items.data.map((item)=>({
                productId: item.price.product,
                quantity: item.quantity
            }));

            const amount= session.amount_total / 100 ;
            order= new OrderModel({
                OrderId: paymentIntentId,
                amount,
                products : lineItems,
                email: session.customer_details.email,
                status: session.payment_intent.status === 'succeeded' ? 'pending' : 'failed'
            })
        }else{
            order.status = session.payment_intent.status === 'succeeded' ? 'pending' : 'failed'
        }
        await order.save();
        res.json({order});

    } catch (error) {
        console.log("Error in confirming payment",error);
        res.status(500).send({message:"Error in confirming payment"})
    }
 })
  //get order details by email
  router.get('/:email',async (req,res)=>{
    const email = req.params.email;
    if(!email){
        return res.status(400).send({messgae:"Email is required"})
    }
    try {
        const orders= await OrderModel.find({email:email});
        if(orders.length === 0 || !orders){
            return res.status(400).send({order:0,messgae:"No orders found for this email"})
        }
        res.status(200).send({orders})
    } catch (error) {
        console.log("Error in fetching orders by email",error);
        res.status(500).send({messgae:"Error in fetching orders by email"})
    }
  })

  //get order by id
  router.get('/order/:id',async (req,res)=>{
      try {
          const order= await OrderModel.findById(req.params.id);
          if(! order){
            return res.status(400).send({messgae:"Order not found"})
          }
          res.status(200).send(order)
      } catch (error) {
        console.log("Error in fetching orders by id",error);
        res.status(500).send({messgae:"Error in fetching orders by id"})
      }
  })
  //get all orders
   router.get('/',async (req,res)=>{
    try {
         const orders= await OrderModel.find().sort({createdAt:-1});
         if(orders.length === 0){
            return res.status(404).send({message:"No orders found",orders:[]})
         }
         res.status(200).send(orders)
    } catch (error) {
        console.log("Error in fetching all orders",error);
        res.status(500).send({messgae:"Error in fetching all orders"})
    }
   })
  // update order status
  router.patch('/update-order-status/:id',async (req,res)=>{
     const {id}=req.params;
     const {status} =req.body;
     if(! status){
        return res.status(400).send({messgae:"Status is required"})
     }
     try {
         const updatedOrder= await OrderModel.findByIdAndUpdate(id,{
            status,
            updatedAt: new Date(),
         },
         {new : true, runValidators :true}
        );
        if(! updatedOrder){
            return res.status(400).send({messgae:"Order not found"})
        }
        res.status(200).json({message:"Updated successfully",order:updatedOrder})

     } catch (error) {
        console.log("Error in updating  order status",error);
        res.status(500).send({messgae:"Error in updating  order status"})
     }
  })
  //delete a order
  router.delete('/delete-order/:id',async (req,res)=>{
    const {id}=req.params;
    try {
         const deleteOrder = await OrderModel.findByIdAndDelete(id);
         if(! deleteOrder){
            return res.status(400).send({messgae:"Order not found"})
         }
         res.status(200).json({message:"Order deleted successfully",order:deleteOrder})
    } catch (error) {
        console.log("Error in deleting a order",error);
        res.status(500).send({messgae:"Error in updatdeleting a order"})
    }
  })
 module.exports=router;