const jwt = require('jsonwebtoken')
const JWT_SECRETKEY=process.env.JWT_SECRET_KEY;

const verifyToken=(req,res,next)=>{
    try {
        const token=req.cookies.token;
      //  const token=req.headers['authorization']?.split(' ')[1];
      
        if(!token){
            return res.status(401).json({message:"No token provided"})
        }
        const decoded=jwt.verify(token,JWT_SECRETKEY);
        if(!decoded){
            return res.status(401).json({message:"Invalid token or not matched"})
        }
        req.userId=decoded.userId;
        req.role=decoded.role;
        next();
    } catch (error) {
        console.log("Error while verifying token",error);
        res.status(401).json({message:"Error while verifying token"})

    }
}
module.exports=verifyToken;