import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { sRouter } from "./APIs/sAPI.js";
import { eRouter } from "./APIs/eAPI.js";
import { aRouter } from "./APIs/aAPI.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// API Routers
app.use('/s-api', sRouter);
app.use('/e-api', eRouter);
app.use('/a-api', aRouter);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Job Portal Backend API is running healthy",
        timestamp: new Date().toISOString()
    });
});

// Handle 404 for unknown endpoints
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}: Route not found`
    });
});

// Centralized Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(`[API Error] ${err.name}: ${err.message}`);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: messages
        });
    }

    // Mongoose Invalid ObjectId Cast Error
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ID format provided for field: ${err.path}`
        });
    }

    // Mongoose Duplicate Key Error (e.g. unique email or duplicate application)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(400).json({
            success: false,
            message: `Duplicate value entered for ${field}. Must be unique.`
        });
    }

    // Default Server Error
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/jobportal";

async function start() {
    try {
        await mongoose.connect(DB_URL);
        console.log(`[MongoDB] Connected to database successfully at ${DB_URL}`);
        
        app.listen(PORT, () => {
            console.log(`[Server] Job Portal Backend running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("[Database Connection Error]", error);
        process.exit(1);
    }
}

// Export app for testing purposes
export { app };

start();