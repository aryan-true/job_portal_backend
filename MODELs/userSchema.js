import { Schema, model, Types} from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters long"],
            maxlength: [50, "Name cannot exceed 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [10, "Email must be at least 10 characters long"],
            maxlength: [50, "Email cannot exceed 50 characters"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"]
        },
        role: {
            type: String,
            enum: ["jobseeker", "employer", "admin"],
            required: [true, "Role is required"],
            default: "jobseeker"
        },
        skills: [
            {
                type: String,
                trim: true,
                minlength: [1, "Skill cannot be empty"],
                maxlength: [50, "Skill name cannot exceed 50 characters"]
            }
        ],
        experience: {
            type: Number,
            default: 0,
            min: [0, "Experience cannot be negative"]
        },
        education: {
            type: String,
            required: [true, "Education is required"],
            maxlength: [100, "Education cannot exceed 100 characters"]
        },
        appliedJobs: {
            type:[Types.ObjectId],
            ref:"Post",
            default:[]
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: "throw"
    }
)

export const User = model("User", userSchema)