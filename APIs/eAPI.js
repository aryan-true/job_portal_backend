import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../MODELs/userSchema.js'
import { Post } from "../MODELs/postSchema.js"
import { Application } from "../MODELs/applicationSchema.js"
import { verifyToken } from '../Middlewares/tokenVerification.js'
import { allowedRoles } from '../Middlewares/chkAuthorization.js'

export const eRouter = express.Router()

// Register as an Employer
eRouter.post('/register', async (req, res) => {
    const hashPassword = await bcrypt.hash(req.body.password, 10)
    let user = await User.create({
        ...req.body,
        password: hashPassword,
        role: "employer"
    })
    res.status(201).json({
        success: true,
        message: "Employer registered successfully",
        data: user
    })
})

// Login
eRouter.post('/login', async (req, res) => {
    let user = await User.findOne({ email: req.body.email })
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.status(200).cookie("AccessToken", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
        return res.json({
            success: true,
            message: "User logged in successfully",
            token: token,
            data: user
        })
    }
    return res.status(401).json({
        success: false,
        message: "Invalid credentials"
    })
})

// Create a new job posting
eRouter.post('/create-job', verifyToken, allowedRoles('employer'), async (req, res) => {
    let job = await Post.create({
        ...req.body,
        postedBy: req.user.id
    })
    res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: job
    })
})

// View their own job postings
eRouter.get('/view-jobs', verifyToken, allowedRoles('employer'), async (req, res) => {
    let jobs = await Post.find({ postedBy: req.user.id })
    res.status(200).json({
        success: true,
        message: "Jobs fetched successfully",
        data: jobs
    })
})

// View a specific job posting
eRouter.get('/view-jobs/:id', verifyToken, allowedRoles('employer'), async (req, res) => {
    let job = await Post.findOne({ _id: req.params.id, postedBy: req.user.id })
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

// Update their own job posting
eRouter.put('/update-job/:id', verifyToken, allowedRoles('employer'), async (req, res) => {
    let job = await Post.findOneAndUpdate(
        { _id: req.params.id, postedBy: req.user.id },
        req.body,
        { new: true, runValidators: true }
    )
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found or not authorized to update"
        })
    }
    res.status(200).json({
        success: true,
        message: "Job updated successfully",
        data: job
    })
})

// Update status of a job posting
eRouter.put('/update-status/:id', verifyToken, allowedRoles('employer'), async (req, res) => {
    let job = await Post.findOneAndUpdate(
        { _id: req.params.id, postedBy: req.user.id },
        { status: req.body.status },
        { new: true, runValidators: true }
    )
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found or not authorized to update status"
        })
    }
    res.status(200).json({
        success: true,
        message: "Job status updated successfully",
        data: job
    })
})

// Delete their own job posting
eRouter.delete('/delete-job/:id', verifyToken, allowedRoles('employer'), async (req, res) => {
    let job = await Post.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id })
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found or not authorized to delete"
        })
    }
    await Application.deleteMany({ job: req.params.id })
    res.status(200).json({
        success: true,
        message: "Job deleted successfully"
    })
})

// View applications received for their jobs
eRouter.get('/view-applications', verifyToken, allowedRoles('employer'), async (req, res) => {
    let applications = await Application.find({ employer: req.user.id }).populate('job').populate('jobSeeker', 'name email skills experience education')
    res.status(200).json({
        success: true,
        message: "Applications fetched successfully",
        data: applications
    })
})

// Update status of an application
eRouter.put('/update-application-status/:id', verifyToken, allowedRoles('employer'), async (req, res) => {
    let application = await Application.findOneAndUpdate(
        { _id: req.params.id, employer: req.user.id },
        { status: req.body.status },
        { new: true, runValidators: true }
    )
    if (!application) {
        return res.status(404).json({
            success: false,
            message: "Application not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "Application status updated successfully",
        data: application
    })
})

// Logout
eRouter.post('/logout', verifyToken, allowedRoles('employer'), (req, res) => {
    res.clearCookie("AccessToken")
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    })
})