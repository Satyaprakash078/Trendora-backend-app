// scripts/addSlugs.js
const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config({ path: "../../.env" });

const ProductModel = require("../products/products.model");

async function addSlugs() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB");

    const products = await ProductModel.find();
    for (let product of products) {
      if (!product.slug) {
        let slug = slugify(product.name, { lower: true, strict: true });

        // ensure unique
        let slugExists = await ProductModel.findOne({ slug });
        let counter = 1;
        while (slugExists) {
          slug = `${slug}-${counter++}`;
          slugExists = await ProductModel.findOne({ slug });
        }

        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { slug } }
        );
        
        console.log(`✅ Added slug for: ${product.name} → ${product.slug}`);
      }
    }

    console.log(" Slug migration complete");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

addSlugs();
