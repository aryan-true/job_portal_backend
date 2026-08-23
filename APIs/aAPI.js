import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../MODELs/userSchema.js';
import { Post } from '../MODELs/postSchema.js';
import { Application } from '../MODELs/applicationSchema.js';
import { verifyToken } from '../Middlewares/tokenVerification.js';
import { allowedRoles } from '../Middlewares/chkAuthorization.js';

export const aRouter = express.Router();

// Helper to set auth cookie
const setAuthCookie = (res, token) => {
    res.cookie("AccessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });
};

// 1. Admin Registration (or initial admin creation)
aRouter.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, adminKey } = req.body;

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
            role: "admin"
        });

        res.status(201).json({
            success: true,
            message: "Admin account registered successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 2. Admin Login
aRouter.post('/login', async (req, res, next) => {
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
                message: "Admin user not found"
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin role required"
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
            message: "Admin logged in successfully",
            token,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 3. View All Registered Users
aRouter.get('/view-users', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "All users fetched successfully",
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

// 4. View User by ID
aRouter.get('/view-user/:id', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 5. Update User Status / Role
aRouter.put('/update-status/:id', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const { role } = req.body;
        if (role && !["jobseeker", "employer", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// 6. Delete User
aRouter.delete('/delete-user/:id', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Clean up user posts and applications
        await Post.deleteMany({ postedBy: req.params.id });
        await Application.deleteMany({ $or: [{ jobSeeker: req.params.id }, { employer: req.params.id }] });

        res.status(200).json({
            success: true,
            message: "User and associated data deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

// 7. View All Job Postings Platform-Wide
aRouter.get('/view-jobs', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const jobs = await Post.find().populate('postedBy', 'name email company').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "All platform job postings fetched successfully",
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
});

// 8. View Job Posting by ID
aRouter.get('/view-job/:id', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const job = await Post.findById(req.params.id).populate('postedBy', 'name email company');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Job posting fetched successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
});

// 9. Delete Job Posting (Admin override / content moderation)
aRouter.delete('/delete-job/:id', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const job = await Post.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job posting not found"
            });
        }

        await Application.deleteMany({ job: req.params.id });

        res.status(200).json({
            success: true,
            message: "Job posting removed by administrator"
        });
    } catch (error) {
        next(error);
    }
});

// 10. Review Platform Applications Overview
aRouter.get('/view-applications', verifyToken, allowedRoles('admin'), async (req, res, next) => {
    try {
        const applications = await Application.find()
            .populate('job', 'title company location status')
            .populate('jobSeeker', 'name email')
            .populate('employer', 'name email')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            message: "Platform applications review data fetched successfully",
            count: applications.length,
            data: applications
        });
    } catch (error) {
        next(error);
    }
});

// 11. Admin Logout
aRouter.post('/logout', verifyToken, allowedRoles('admin'), (req, res) => {
    res.clearCookie("AccessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.status(200).json({
        success: true,
        message: "Admin logged out successfully"
    });
});