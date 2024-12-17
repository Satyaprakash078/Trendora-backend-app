const jwt = require('jsonwebtoken')
const User= require('../users/user.model')
const JWT_SECRETKEY=process.env.JWT_SECRET_KEY;

const generateToken=async (userId)=>{
    try {
        const user=await User.findById(userId);
        if(!user){
            throw new Error('User not found')
        }

        const token=jwt.sign({userId:user.id,role:user.role},JWT_SECRETKEY,
            {expiresIn:"1h"}
        )   // It takes three arguments: the payload, the secret key, and options.
        return token;
    } catch (error) {
        console.log("Error in generating token",error)
        
    }
}

module.exports=generateToken;