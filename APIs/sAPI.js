import express from 'express'
export const sRouter = express.Router()
import {User} from '../MODELs/userSchema.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {verifyToken} from '../Middlewares/tokenVerification.js'
import {allowedRoles} from '../Middlewares/chkAuthorization.js'

//JobSeeker Signup
sRouter.post('/register',async(req,res)=>{
    const hashPassword = await bcrypt.hash(req.body.password,10)
    let user = await User.create(req.body)
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
sRouter.get('/view-profile',verifyToken,allowedRoles('jobseeker'),(req,res)=>{
    
})

//update their own profile.
sRouter.put('/update-profile',verifyToken,allowedRoles('jobseeker'),(req,res)=>{
    
})

//View all available jobs
sRouter.get('/view-jobs',(req,res)=>{
    
})

//View a single job by ID
sRouter.get('/view-jobs/:id',(req,res)=>{
    
})

//Apply for a job.
sRouter.post('/apply/:id',(req,res)=>{
    
})

//View their submitted applications
sRouter.get('/view-applications',(req,res)=>{
    
})

//logout from application
sRouter.post('/logout',(req,res)=>{
    
})