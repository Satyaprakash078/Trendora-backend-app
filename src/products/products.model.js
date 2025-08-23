 const mongoose =require('mongoose');
 const slugify = require("slugify");

const ProductSchema=new mongoose.Schema({
    name:{type:String,required:true},
    slug: { type: String, unique: true,index: true }, //slug field
    category:String,
    description:String,
    price:{type:Number,required:true},
    oldPrice: Number,
    image: String,
    color:String,
    rating:{type:Number,default:0},
    author:{type:mongoose.Types.ObjectId,ref:"User",required:true}
})

// Middleware: auto-generate slug from name
ProductSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  let slug = slugify(this.name, { lower: true, strict: true });

  // ensure unique slug
  let slugExists = await this.constructor.findOne({ slug });
  let counter = 1;
  while (slugExists) {
    slug = `${slug}-${counter++}`;
    slugExists = await this.constructor.findOne({ slug });
  }

  this.slug = slug;
  next();
});

const ProductModel=mongoose.model('Product',ProductSchema);

module.exports=ProductModel