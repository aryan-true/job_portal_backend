import { Schema, model } from "mongoose"

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true
        },
        company: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true
        },
        employmentType: {
            type: String,
            enum: ["full-time", "part-time", "contract", "internship", "remote"],
            required: [true, "Employment type is required"],
            default: "full-time"
        },
        salaryRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 }
        },
        requiredSkills: [
            {
                type: String,
                trim: true
            }
        ],
        experienceRequired: {
            type: Number,
            default: 0
        },
        postedDate: {
            type: Date,
            default: Date.now
        },
        applicationDeadline: {
            type: Date
        },
        status: {
            type: String,
            enum: ["open", "closed", "paused"],
            default: "open"
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: "throw"
    }
)

export const Post = model("Post", postSchema)