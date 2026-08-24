import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../MODELs/userSchema.js'
import { Post } from '../MODELs/postSchema.js'
import { Application } from '../MODELs/applicationSchema.js'
import { verifyToken } from '../Middlewares/tokenVerification.js'
import { allowedRoles } from '../Middlewares/chkAuthorization.js'

export const aRouter = express.Router()

// Admin Signup / Register
aRouter.post('/register', async (req, res) => {
    const hashPassword = await bcrypt.hash(req.body.password, 10)
    let user = await User.create({
        ...req.body,
        password: hashPassword,
        role: "admin"
    })
    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: user
    })
})

// Admin Login
aRouter.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email })
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Admin user not found"
        })
    }
    if (user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin role required"
        })
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.status(200).cookie("AccessToken", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
        return res.json({
            success: true,
            message: "Admin logged in successfully",
            token: token,
            data: user
        })
    }
    return res.status(401).json({
        success: false,
        message: "Invalid credentials"
    })
})

// View all registered users
aRouter.get('/view-users', verifyToken, allowedRoles('admin'), async (req, res) => {
    let users = await User.find()
    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: users
    })
})

// View a user by ID
aRouter.get('/view-user/:id', verifyToken, allowedRoles('admin'), async (req, res) => {
    let user = await User.findById(req.params.id)
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user
    })
})

// Update user role / status
aRouter.put('/update-status/:id', verifyToken, allowedRoles('admin'), async (req, res) => {
    let user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user
    })
})

// Delete a user
aRouter.delete('/delete-user/:id', verifyToken, allowedRoles('admin'), async (req, res) => {
    let user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    await Post.deleteMany({ postedBy: req.params.id })
    await Application.deleteMany({ $or: [{ jobSeeker: req.params.id }, { employer: req.params.id }] })
    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    })
})

// View all job postings
aRouter.get('/view-jobs', verifyToken, allowedRoles('admin'), async (req, res) => {
    let jobs = await Post.find().populate('postedBy', 'name email')
    res.status(200).json({
        success: true,
        message: "All jobs fetched successfully",
        data: jobs
    })
})

// View a job posting by ID
aRouter.get('/view-job/:id', verifyToken, allowedRoles('admin'), async (req, res) => {
    let job = await Post.findById(req.params.id).populate('postedBy', 'name email')
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "Job fetched successfully",
        data: job
    })
})

// Remove inappropriate or invalid job postings
aRouter.delete('/delete-job/:id', verifyToken, allowedRoles('admin'), async (req, res) => {
    let job = await Post.findByIdAndDelete(req.params.id)
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found"
        })
    }
    await Application.deleteMany({ job: req.params.id })
    res.status(200).json({
        success: true,
        message: "Job deleted successfully by admin"
    })
})

// View all applications platform-wide
aRouter.get('/view-applications', verifyToken, allowedRoles('admin'), async (req, res) => {
    let applications = await Application.find().populate('job').populate('jobSeeker', 'name email').populate('employer', 'name email')
    res.status(200).json({
        success: true,
        message: "Applications fetched successfully",
        data: applications
    })
})

// Admin Logout
aRouter.post('/logout', verifyToken, allowedRoles('admin'), (req, res) => {
    res.clearCookie("AccessToken")
    res.status(200).json({
        success: true,
        message: "Admin logged out successfully"
    })
})