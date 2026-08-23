import { Schema, model } from "mongoose";

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
            enum: {
                values: ["full-time", "part-time", "contract", "internship", "remote"],
                message: "Invalid employment type"
            },
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
            default: 0,
            min: [0, "Experience required cannot be negative"]
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
            enum: {
                values: ["open", "closed", "paused"],
                message: "Job status must be open, closed, or paused"
            },
            default: "open"
        },
        postedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "postedBy employer user ID is required"]
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: true
    }
);

export const Post = model("Post", postSchema);