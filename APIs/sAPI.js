import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../MODELs/userSchema.js'
import { Post } from "../MODELs/postSchema.js"
import { Application } from "../MODELs/applicationSchema.js"
import { verifyToken } from '../Middlewares/tokenVerification.js'
import { allowedRoles } from '../Middlewares/chkAuthorization.js'

export const sRouter = express.Router()

// Job Seeker Signup
sRouter.post('/register', async (req, res) => {
    const hashPassword = await bcrypt.hash(req.body.password, 10)
    let user = await User.create({
        ...req.body,
        password: hashPassword,
        role: "jobseeker"
    })
    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user
    })
})

// Login
sRouter.post('/login', async (req, res) => {
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

// View Profile
sRouter.get('/profile', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
    }
    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user
    })
})

sRouter.get('/view-profile/:id', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to view this profile"
        })
    }
    let user = await User.findById(req.params.id)
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
    }
    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user
    })
})

// Update Profile
sRouter.put('/profile', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { name: req.body.name, email: req.body.email, experience: req.body.experience, education: req.body.education, skills: req.body.skills } },
        { new: true, runValidators: true }
    )
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
    }
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user
    })
})

sRouter.put('/update-profile/:id', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to update this profile"
        })
    }
    let user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { name: req.body.name, email: req.body.email, experience: req.body.experience, education: req.body.education, skills: req.body.skills } },
        { new: true, runValidators: true }
    )
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
    }
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user
    })
})

// View Available Jobs
sRouter.get('/view-jobs', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let jobs = await Post.find({ status: "open" })
    res.status(200).json({
        success: true,
        message: "Jobs fetched successfully",
        data: jobs
    })
})

// View Single Job
sRouter.get('/view-jobs/:id', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let job = await Post.findById(req.params.id)
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

// Apply for Job
sRouter.post('/apply/:jobId', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let job = await Post.findById(req.params.jobId)
    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found"
        })
    }
    if (job.status === "closed") {
        return res.status(400).json({
            success: false,
            message: "Job is closed"
        })
    }

    let existingApp = await Application.findOne({ job: req.params.jobId, jobSeeker: req.user.id })
    if (existingApp) {
        return res.status(400).json({
            success: false,
            message: "You have already applied for this job"
        })
    }

    let application = await Application.create({
        job: req.params.jobId,
        jobSeeker: req.user.id,
        employer: job.postedBy,
        coverLetter: req.body.coverLetter || "",
        status: "pending"
    })

    res.status(201).json({
        success: true,
        message: "Job applied successfully",
        data: application
    })
})

// View Submitted Applications
sRouter.get('/view-applications', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let applications = await Application.find({ jobSeeker: req.user.id }).populate('job').populate('employer', 'name email')
    res.status(200).json({
        success: true,
        message: "Applications fetched successfully",
        data: applications
    })
})

sRouter.get('/view-applications/:id', verifyToken, allowedRoles('jobseeker'), async (req, res) => {
    let application = await Application.findOne({ _id: req.params.id, jobSeeker: req.user.id }).populate('job')
    if (!application) {
        return res.status(404).json({
            success: false,
            message: "Application not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "Application fetched successfully",
        data: application
    })
})

// Logout
sRouter.post('/logout', verifyToken, allowedRoles('jobseeker'), (req, res) => {
    res.clearCookie("AccessToken")
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    })
})