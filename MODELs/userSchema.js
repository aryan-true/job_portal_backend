import { Schema, model } from "mongoose";

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
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"]
        },
        role: {
            type: String,
            enum: {
                values: ["jobseeker", "employer", "admin"],
                message: "Role must be either jobseeker, employer, or admin"
            },
            required: [true, "Role is required"],
            default: "jobseeker"
        },
        skills: [
            {
                type: String,
                trim: true
            }
        ],
        experience: {
            type: Number,
            default: 0,
            min: [0, "Experience cannot be negative"]
        },
        education: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        versionKey: false,
        timestamps: true,
        strict: true,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                return ret;
            }
        },
        toObject: {
            transform: (doc, ret) => {
                delete ret.password;
                return ret;
            }
        }
    }
);

export const User = model("User", userSchema);