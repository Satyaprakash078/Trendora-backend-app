const express=require('express');
const ProductModel = require('./products.model');
const ReviewModel = require('../reviews/reviews.model');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

module.exports = function (redis) {
const router=express.Router();

//create a product
 router.post('/create-product',async (req,res)=>{
    try {
        const newproduct=new ProductModel({...req.body});
        const savedProduct=await newproduct.save();
        //calculate rating/review
        const reviews=await ReviewModel.find({productId:savedProduct._id})
        if(reviews.length >0){
            const totalRating = reviews.reduce((acc,review)=>
            acc+review.rating,0);
            const averageRating = totalRating/reviews.length;
            savedProduct.rating=averageRating;
            await savedProduct.save();
        }
        // clear product caches
            await redis.del("all_products");

        res.status(201).send(savedProduct);
    } catch (error) {
        console.log("Failled to create new roduct",error);
        res.status(500).send({message:"Failled to create new roduct"})
    }
 })
  //get all products
  router.get('/',async (req,res)=>{
    try {
        //  try cache first
            const cachedProducts = await redis.get("all_products");
            if (cachedProducts) {
                console.log(" Serving products from cache");
                return res.status(200).send(JSON.parse(cachedProducts));
            }

         const {category,color,minPrice,maxPrice,page=1,limit=10}=req.query;
         let filter={};
         if(category && category !== "all"){
            filter.category=category;
         }
         if(color && color !== "all"){
            filter.color=color;
         }
         if(minPrice && maxPrice){
            const min=parseFloat(minPrice);
            const max=parseFloat(maxPrice);
            if(! isNaN(min) && !isNaN(max)){
                filter.price = { $gte: min, $lte: max };
            }
         }
         
         const skip=(parseInt(page)-1) * parseInt(limit);
         const totalProducts= await ProductModel.countDocuments(filter);
         const totalPages=Math.ceil(totalProducts /parseInt(limit));
         const products=await ProductModel.find(filter)
                                        .skip(skip)
                                        .limit(parseInt(limit))
                                        .populate('author',"email")
                                        .sort({createdAt:-1})

         const response= {products,totalPages,totalProducts};

         //  save to cache (30 sec expiry)
            await redis.set("all_products", JSON.stringify(response), "EX", 30);

            res.status(200).send(response);

    } catch (error) {
        console.log("Failled in feching products",error);
        res.status(500).send({message:"Failled in feching products"})
    }
  })
  //get a single product
  router.get('/:slug',async (req,res)=>{
    try {
      //  console.log("Product ID:", req.params.id);
        const { slug } = req.params;
       if (!slug || slug === 'undefined') {
             return res.status(400).send({ message: "Product slug is required" });
        }
        // check cache
            const cachedProduct = await redis.get(`product_${slug}`);
            if (cachedProduct) {
                console.log(" Serving product from cache");
                return res.status(200).send(JSON.parse(cachedProduct));
            }
        const product = await ProductModel.findOne({ slug }).populate('author',"username email");
        if(!product){
            return res.status(404).send({message:"Product not found"})
        }
       const reviews = await ReviewModel.find({ productId: product._id }).populate("userId","username email");
         const response = { product, reviews };
        // cache for 1 min
           await redis.set(`product_${slug}`, JSON.stringify(response), "EX", 60);
            
       console.log(reviews)
        res.status(200).send(response);

    } catch (error) {
        console.log("Failled in fetching the product",error);
        res.status(500).send({message:"Failled in fetching the product"})
    }
  })
  //Update a product
  router.patch('/update-product/:id',verifyToken,verifyAdmin,async (req,res)=>{
  
    try {
        const productId=req.params.id;
        const updateProduct=await ProductModel.findByIdAndUpdate(productId,{...req.body},
            {new:true});

        if(!updateProduct){
            return res.status(404).send({message:"Product not found"})
        }
        //  clear caches
            await redis.del("all_products");
            await redis.del(`product_${productId}`);

        res.status(200).send(
            {message:"Product updated successfully",updateProduct})
    } catch (error) {
        console.log("Failled in updating the product",error);
        res.status(500).send({message:"Failled in updating the product"})
    }
  })
  //delete a product
  router.delete('/:id',async (req,res)=>{
    try {
         const productId=req.params.id;
         const deleteProduct=await ProductModel.findByIdAndDelete(productId);
         if(!deleteProduct){
            return res.status(404).send({message:"Product not found"})
         }
         //delete reviews  related to tht product
         await ReviewModel.deleteMany({productId});
         // clear caches
            await redis.del("all_products");
            await redis.del(`product_${productId}`);

         res.status(200).send({message:"Product deleted successfully"})
    } catch (error) {
        console.log("Failled in deleting the product",error);
        res.status(500).send({message:"Failled in deleting the product"})
    }
  })
  //get related products
  router.get('/related-products/:id',async (req,res)=>{
    try {
        const {id}=req.params;
        if(!id){
            return res.status(404).send({message:"Product id is required"})
        }
        const product=await ProductModel.findById(id);
        if(!product){
            return res.status(404).send({message:"Product not found"})
        }
        //creating a regular expression for filtering names
        const titleRegex= new RegExp(
            product.name
            .split(" ")
            .filter((word)=>word.length>1)
            .join("|"),
            "i"
        );
        //except the curent product ,get its similar products
        const relatedProducts=await ProductModel.find({
            _id:{$ne: id}, //exclude the current prodcut
            $or: [
                {name: {$regex: titleRegex}}, //match the similar name
                {category:product.category}, //match the same category
            ],
        });
       res.status(200).send(relatedProducts)
    } catch (error) {
        console.log("Failled in getting the related products",error);
        res.status(500).send({message:"Failled in getting the related products"})
    }
  })
  return router;
 
}