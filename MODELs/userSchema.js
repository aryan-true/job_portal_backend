import { Schema, model } from "mongoose"

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
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
                trim: true
            }
        ],
        experience: {
            type: Number,
            default: 0
        },
        education: {
            type: String,
            default: ""
        }
    },
    {
        versionKey: false,
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password
                return ret
            }
        },
        toObject: {
            transform: (doc, ret) => {
                delete ret.password
                return ret
            }
        }
    }
)

export const User = model("User", userSchema)