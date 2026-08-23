import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../MODELs/userSchema.js';
import { Post } from "../MODELs/postSchema.js";
import { Application } from "../MODELs/applicationSchema.js";
import { verifyToken } from '../Middlewares/tokenVerification.js';
import { allowedRoles } from '../Middlewares/chkAuthorization.js';

export const eRouter = express.Router();

// Helper to set auth cookie
const setAuthCookie = (res, token) => {
    res.cookie("AccessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });
};

// 1. Employer Registration
eRouter.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, company } = req.body;

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
            role: "employer",
            education: company ? `Company: ${company}` : ""
        });

        res.status(201).json({
            success: true,
            message: "Employer registered successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 2. Employer Login
eRouter.post('/login', async (req, res, next) => {
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

        if (user.role !== "employer") {
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
            message: "Employer logged in successfully",
            token,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 3. Create a Job Posting
eRouter.post('/create-job', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const job = await Post.create({
            ...req.body,
            postedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Job posting created successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 4. View Own Job Postings
eRouter.get('/view-jobs', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const jobs = await Post.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "Employer job postings fetched successfully",
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
});

// 5. View Specific Job Posting
eRouter.get('/view-jobs/:id', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const job = await Post.findOne({ _id: req.params.id, postedBy: req.user.id });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found or you are not authorized to view it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Job details fetched successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 6. Update Own Job Posting
eRouter.put('/update-job/:id', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        // Prevent modifying postedBy
        const updateData = { ...req.body };
        delete updateData.postedBy;

        const job = await Post.findOneAndUpdate(
            { _id: req.params.id, postedBy: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found or not authorized to update"
            });
        }

        res.status(200).json({
            success: true,
            message: "Job posting updated successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 7. Update Job Status (open, closed, paused)
eRouter.put('/update-status/:id', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!["open", "closed", "paused"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Must be 'open', 'closed', or 'paused'"
            });
        }

        const job = await Post.findOneAndUpdate(
            { _id: req.params.id, postedBy: req.user.id },
            { status },
            { new: true, runValidators: true }
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found or not authorized to update"
            });
        }

        res.status(200).json({
            success: true,
            message: "Job status updated successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 8. Delete Own Job Posting
eRouter.delete('/delete-job/:id', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const job = await Post.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found or not authorized to delete"
            });
        }

        // Also clean up associated applications
        await Application.deleteMany({ job: req.params.id });

        res.status(200).json({
            success: true,
            message: "Job posting and associated applications deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

// 9. View Applications Received for Employer's Jobs
eRouter.get('/view-applications', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const applications = await Application.find({ employer: req.user.id })
            .populate('job', 'title location status')
            .populate('jobSeeker', 'name email skills experience education')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            message: "Applications received fetched successfully",
            count: applications.length,
            data: applications
        });
    } catch (error) {
        next(error);
    }
});

// 10. Update Status of an Application (pending, reviewed, accepted, rejected)
eRouter.put('/update-application-status/:id', verifyToken, allowedRoles('employer'), async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status. Allowed: pending, reviewed, accepted, rejected"
            });
        }

        const application = await Application.findOneAndUpdate(
            { _id: req.params.id, employer: req.user.id },
            { status },
            { new: true, runValidators: true }
        ).populate('job', 'title').populate('jobSeeker', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found or you are not authorized to update it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            data: application
        });
    } catch (error) {
        next(error);
    }
});

// 11. Logout
eRouter.post('/logout', verifyToken, allowedRoles('employer'), (req, res) => {
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