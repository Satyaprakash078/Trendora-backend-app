const cloudinary = require('cloudinary').v2;

 const cloud_name=process.env.CLOUDINARY_CLOUD_NAME;
 const api_key=process.env.CLOUDINARY_API_KEY;
 const api_secret=process.env.CLOUDINARY_API_SECRET;
cloudinary.config({ 
    cloud_name: cloud_name, 
    api_key: api_key, 
    api_secret: api_secret
  });

  const opts= {
    overwrite:true,
    invalidate:true,
    resource_type:'auto'
  }


module.exports=(image)=>{
    return  new Promise((resolve,reject)=>{
        cloudinary.uploader.upload(image,opts,(err,result)=>{
            if(result && result.secure_url){
               // console.log(result.secure_url)
               return resolve(result.secure_url)
            }
            console.log(err.message)
            return reject({message:err.message})
        })
    })
}