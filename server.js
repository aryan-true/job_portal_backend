import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import { sRouter } from "./APIs/sAPI.js"
import { eRouter } from "./APIs/eAPI.js"
import { aRouter } from "./APIs/aAPI.js"

dotenv.config()

const app = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())

// API Routers
app.use('/s-api', sRouter)
app.use('/e-api', eRouter)
app.use('/a-api', aRouter)

// Error Handler
app.use((err, req, res, next) => {
    console.log(`Error Occured: ${err.message}`)
    res.status(500).json({
        message: err.message || "Something went wrong"
    })
})

async function start() {
    try {
        await mongoose.connect(process.env.DB_URL)
        console.log("Database connected")
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

start()