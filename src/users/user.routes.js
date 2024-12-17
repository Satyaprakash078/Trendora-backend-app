const express=require('express');
const User = require('./user.model');
const generateToken = require('../middleware/generateToken');
const router=express.Router();

//register endpoint
    router.post('/register',async (req,res)=>{
        try {
            const {email,username,password}=req.body;
            const user=new User({email,username,password});
            await user.save();
            res.status(201).send({message:"user registered successfully!"})
        } catch (error) {
            console.log("Error in register user",error)
            res.status(500).send({message: error})
        }
    })

//login endpoint
    router.post('/login',async (req,res)=>{
        const {email,password}=req.body;
        try {
            const user=await User.findOne({email});
            if(!user){
                return res.status(404).send({message:"User not found!"})
            }
            const isMatch=await user.comparePassword(password);
            if(!isMatch){
                return res.status(401).send({message:"Invalid password!"})
            }
            const token=await generateToken(user._id);
            res.cookie('token',token,{
            httpOnly:true,
            secure:true,
            sameSite:'None'

            })
            
            res.status(200).send({message:'logged in successfully',token,user:{
                _id:user._id,
                username:user.username,
                email:user.email,
                role:user.role,
                profileImage:user.profileImage,
                bio:user.bio,
                profession:user.profession
            }})
        } catch (error) {
            console.log("Error in loged in user",error)
            res.status(500).send({message: error})
        }
    })
    //logout endpoint
    router.post('/logout',(req,res)=>{
        res.clearCookie('token');
        res.status(200).send({message:'Logged out successfully'})
    })

    //delete a user endpoint
    router.delete('/users/:id',async (req,res)=>{
        try {
            const {id} =req.params;
            const user=await User.findByIdAndDelete(id);
            if(!user){
                return res.status(404).send({message:"User not found!"})
            }
            res.status(200).send({message:'User deleted successfully'})
        } catch (error) {
            console.log("Error in delete user",error)
            res.status(500).send({message: error})
        }
    })
    //get all users
    router.get('/users',async (req,res)=>{
        try {
            const users=await User.find({},'id email role').sort({createdAt:-1});
            res.status(200).send(users)
        } catch (error) {
            console.log("Error in fetching users",error)
            res.status(500).send({message: error});
        }
    })
    //update user role
    router.put('/users/:id',async (req,res)=>{
        try {
            
            const {id} =req.params;
            const {role} =req.body;
            const user=await User.findByIdAndUpdate(id,{role},{new:true})
            if(!user){
                return res.status(404).send({message:"User not found!"})
            }
            res.status(200).send({message:'User role updated successfully'})
        } catch (error) {
            console.log("Error in update user role",error)
            res.status(500).send({message: error});
        }
    })
    //update user profile
    router.patch('/edit-profile',async (req,res)=>{
        try {
            const {userId,username,email,profileImage,profession,bio}=req.body;
            if(!userId){
                return res.status(401).send({message:'userId is required!'})
            }
            const user=await User.findById(userId);
            if(!user){
                return res.status(404).send({message:'User not found!'})
            }
            //update profile
            if(username !== undefined) user.username=username;
            if(email !== undefined) user.email=email;
            if(profileImage !== undefined) user.profileImage=profileImage
            if(bio!== undefined) user.bio=bio;

            await user.save();
            res.status(200).send({message:'Profile updated successfully',user:{
                _id:user._id,
                username:user.username,
                email:user.email,
                role:user.role,
                profileImage:user.profileImage,
                bio:user.bio,
                profession:user.profession
            }})

            //either try above approach or below

            // const user=await User.findByIdAndUpdate(userId,{username,email,profileImage,profession,bio},{new:true})
            // res.status(200).send({message:'Profile updated successfully',user})
        } catch (error) {
            console.log("Error in update user profile",error)
            res.status(500).send({message: error});
        }
    })
module.exports=router;