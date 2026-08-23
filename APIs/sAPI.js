import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../MODELs/userSchema.js';
import { Post } from "../MODELs/postSchema.js";
import { Application } from "../MODELs/applicationSchema.js";
import { verifyToken } from '../Middlewares/tokenVerification.js';
import { allowedRoles } from '../Middlewares/chkAuthorization.js';

export const sRouter = express.Router();

// Helper to set auth cookie
const setAuthCookie = (res, token) => {
    res.cookie("AccessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
};

// 1. Job Seeker Registration
sRouter.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, skills, experience, education } = req.body;
        
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password is required and must be at least 8 characters long"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "jobseeker",
            skills: skills || [],
            experience: experience || 0,
            education: education || ""
        });

        res.status(201).json({
            success: true,
            message: "Job Seeker registered successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 2. Job Seeker Login
sRouter.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "jobseeker") {
            return res.status(403).json({
                success: false,
                message: `Access denied: Login as ${user.role} on the appropriate portal`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const secret = process.env.JWT_SECRET || "job-seeker-project-1";
        const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1d' });

        setAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Job Seeker logged in successfully",
            token,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 3. View Own Profile
sRouter.get('/profile', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }
        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// View Profile by ID (with ownership check)
sRouter.get('/view-profile/:id', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this profile"
            });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 4. Update Own Profile
sRouter.put('/profile', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const { name, email, skills, experience, education } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { name, email, skills, experience, education } },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
});

sRouter.put('/update-profile/:id', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this profile"
            });
        }
        const { name, email, skills, experience, education } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { name, email, skills, experience, education } },
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
});

// 5. View All Available Jobs (status: open)
sRouter.get('/view-jobs', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const { location, employmentType, search } = req.query;
        let query = { status: "open" };

        if (location) query.location = new RegExp(location, 'i');
        if (employmentType) query.employmentType = employmentType;
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { company: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        const jobs = await Post.find(query).populate('postedBy', 'name company email');
        res.status(200).json({
            success: true,
            message: "Available jobs fetched successfully",
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
});

// 6. View Single Job by ID
sRouter.get('/view-jobs/:id', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const job = await Post.findById(req.params.id).populate('postedBy', 'name company email');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Job fetched successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 7. Apply for a Job
sRouter.post('/apply/:jobId', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { coverLetter } = req.body;

        const job = await Post.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found"
            });
        }

        if (job.status !== "open") {
            return res.status(400).json({
                success: false,
                message: `Cannot apply to job: position is currently ${job.status}`
            });
        }

        const existingApp = await Application.findOne({
            job: jobId,
            jobSeeker: req.user.id
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted an application for this job posting"
            });
        }

        const application = await Application.create({
            job: jobId,
            jobSeeker: req.user.id,
            employer: job.postedBy,
            coverLetter: coverLetter || "",
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Job application submitted successfully",
            data: application
        });
    } catch (error) {
        next(error);
    }
});

// 8. View Submitted Applications
sRouter.get('/view-applications', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const applications = await Application.find({ jobSeeker: req.user.id })
            .populate('job', 'title company location salaryRange status employmentType')
            .populate('employer', 'name email')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            message: "Submitted applications fetched successfully",
            count: applications.length,
            data: applications
        });
    } catch (error) {
        next(error);
    }
});

// 9. View Status of Single Application
sRouter.get('/view-applications/:id', verifyToken, allowedRoles('jobseeker'), async (req, res, next) => {
    try {
        const application = await Application.findOne({
            _id: req.params.id,
            jobSeeker: req.user.id
        }).populate('job', 'title company location status');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Application status fetched successfully",
            data: application
        });
    } catch (error) {
        next(error);
    }
});

// 10. Logout
sRouter.post('/logout', verifyToken, allowedRoles('jobseeker'), (req, res) => {
    res.clearCookie("AccessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});