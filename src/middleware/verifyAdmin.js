
const verifyAdmin=(req,res,next)=>{
    if(req.role !== 'admin'){
        return res.status(401).send({success:false,
            message:"You are not authorized to perform this action"})
        
    }
    next();
}
module.exports=verifyAdmin;