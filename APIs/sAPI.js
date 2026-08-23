import express from 'express'
export const sRouter = express.Router()
import {User} from '../MODELs/userSchema.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {verifyToken} from '../Middlewares/tokenVerification.js'
import {allowedRoles} from '../Middlewares/chkAuthorization.js'
import { Post } from "../MODELs/postSchema.js"

//JobSeeker Signup
sRouter.post('/register',async(req,res)=>{
    const hashPassword = await bcrypt.hash(req.body.password,10)
    let user = await User.create({...req.body, password: hashPassword})
    res.status(201).json({
        success:true,
        message: "User created successfully",
        data:user
    })
})

//Login and receive the authentication cookie.
sRouter.post('/login',async(req,res)=>{
    let user = await User.findOne({email:req.body.email})
    if(!user){
        return res.status(404).json({
            success:false,
            message: "User not found"
        })
    }
    if(await bcrypt.compare(req.body.password,user.password)){
        const token = jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:'1d'})
        res.status(200).cookie("AccessToken",token,{httpOnly:true,secure:true})
        return res.json({
            success:true,
            message: "User logged in successfully",
            token: token
        })
    }
    return res.status(401).json({
        success:false,
        message: "Invalid credentials"
    })
})

//view profile
sRouter.get('/view-profile/:id',verifyToken,allowedRoles('jobseeker'),async (req,res)=>{
    if(req.user.id!==req.params.id){
        return res.status(403).json({
            success:false,
            message:"You are not authorized to view this profile"
        })        
    }
    let user = await User.findById(req.params.id)
    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        })
    }
    res.status(200).json({
        success:true,
        message:"Profile fetched successfully",
        data:user
    })
})

//update their own profile.
sRouter.put('/update-profile/:id',verifyToken,allowedRoles('jobseeker'),async(req,res)=>{
    if(req.user.id!==req.params.id){
        return res.status(403).json({
            success:false,
            message:"You are not authorized to update this profile"
        })        
    }
    let user = await User.findByIdAndUpdate(req.params.id,{$set:{name:req.body.name,email:req.body.email,experience:req.body.experience,education:req.body.education,skills:req.body.skills}}, {new:true,runValidators:true})
    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        })
    }
    res.status(200).json({
        success:true,
        message:"Profile updated successfully",
        data:user
    })
})

//View all available jobs
sRouter.get('/view-jobs',verifyToken,allowedRoles('jobseeker'),async(req,res)=>{
    let jobs = await Post.find({status:"open"})
    res.status(200).json({
        success:true,
        message:"Jobs fetched successfully",
        data:jobs
    })
})

//View a single job by ID
sRouter.get('/view-jobs/:id',verifyToken,allowedRoles('jobseeker'),async(req,res)=>{
    let job = await Post.findById(req.params.id)
    if(!job){
        return res.status(404).json({
            success:false,
            message:"Job not found"
        })
    }
    res.status(200).json({
        success:true,
        message:"Job fetched successfully",
        data:job
    })
})

//Apply for a job.
sRouter.post('/apply/:id/post/:pid',verifyToken,allowedRoles('jobseeker'),async(req,res)=>{
    if(req.user.id!=req.params.id){
        return res.status(403).json({
            success:false,
            message:"You are not authorized to apply for this job"
        })
    }
    let user = await User.findById(req.params.id)    
    let job = await Post.findById(req.params.pid)
    if(!job){
        return res.status(404).json({
            success:false,
            message:"Job not found"
        })
    }
    if(job.status=="closed"){
        return res.status(400).json({
            success:false,
            message:"Job is closed"
        })
    }
    if(user.appliedJobs.some(pid => pid.toString() === req.params.pid)){
        return res.status(400).json({
            success:false,
            message:"You have already applied for this job"
        })
    }
    user.appliedJobs.push(req.params.pid)
    await user.save()
    res.status(200).json({
        success:true,
        message:"Job applied successfully",
        data:user
    })
})

//View their submitted applications
sRouter.get('/view-applications',verifyToken,allowedRoles('jobseeker'),async(req,res)=>{
    let user = await User.findById(req.user.id)
    if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        })
    }
    let jobs = await Post.find({_id:{$in:user.appliedJobs}})
    res.status(200).json({
        success:true,
        message:"Applications fetched successfully",
        data:jobs
    })
})

//logout from application
sRouter.post('/logout',verifyToken,allowedRoles('jobseeker'),(req,res)=>{
    res.clearCookie("AccessToken",{httpOnly:true,secure:true})
    res.status(200).json({
        success:true,
        message:"User logged out successfully"
    })
})