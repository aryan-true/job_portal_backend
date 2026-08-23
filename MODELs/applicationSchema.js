import { Schema, model } from "mongoose";

const applicationSchema = new Schema(
    {
        job: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: [true, "Job reference is required"]
        },
        jobSeeker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Job seeker reference is required"]
        },
        employer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Employer reference is required"]
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "reviewed", "accepted", "rejected"],
                message: "Status must be pending, reviewed, accepted, or rejected"
            },
            default: "pending"
        },
        coverLetter: {
            type: String,
            trim: true,
            default: ""
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: true
    }
);

// Prevent duplicate applications by the same job seeker for the same job
applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });

export const Application = model("Application", applicationSchema);
