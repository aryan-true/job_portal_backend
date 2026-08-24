import { Schema, model } from "mongoose"

const applicationSchema = new Schema(
    {
        job: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: [true, "Job is required"]
        },
        jobSeeker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Job seeker is required"]
        },
        employer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Employer is required"]
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "accepted", "rejected"],
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
        timestamps: true
    }
)

applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true })

export const Application = model("Application", applicationSchema)
