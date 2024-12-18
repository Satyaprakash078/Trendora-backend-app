const express=require('express');
const mongoose = require('mongoose');
const cors=require('cors');
const app=express();
require('dotenv').config();
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser');
const Port=process.env.PORT || 5000;

//middleware setup
app.use(express.json({limit:"25mb"}));
//app.use(express.urlencoded({limit:"25mb"}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors({
    origin: "https://trendora-frontend-plum.vercel.app",
    credentials: true
}))

//image upload
const uploadImage = require('./src/utils/uploadImage')

//all routes
const authRoutes= require('./src/users/user.routes');
const productRoutes=require('./src/products/products.routes')
const reviewRoutes=require('./src/reviews/reviews.routes')
const orderRoutes=require('./src/orders/orders.routes')
const statsRoutes=require('./src/stats/stats.routes')

app.use('/api/auth',authRoutes);
app.use('/api/products',productRoutes);
app.use('/api/reviews',reviewRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/stats',statsRoutes)

main()
.then(()=>console.log('mongodb is connected'))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.DB_URL);
  app.get('/',(req,res)=>{
    res.send('server is running...')
});

}

app.post('/uploadImage',(req,res)=>{
   uploadImage(req.body.image)
   .then((url)=>res.send(url))
   .catch((err)=>{
    console.error("Error in uploadImage:", err); // Log the error for debugging
    res.status(500).send(err);
})
})


app.listen(Port,()=>{
    console.log(`app is listening to ${Port}`)
})