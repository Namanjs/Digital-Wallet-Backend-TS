import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';

export interface IUser extends Document {
    username: string;
    email: string;
    avatar: string;
    fullName: string;
    password: string;
    refreshToken: string;
    balance: number;
    accountVersion: number;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
};

const userSchema: Schema<IUser> = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    avatar: {
        type: String,
        default: "https://api.dicebear.com/7.x/identicon/svg"
    },
    fullName: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: [true, "Password is required."]
    },
    refreshToken: {
        type: String
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
        min: [0, "Money cannot be negative."]
    },
    accountVersion: {
        type: Number,
        default: 0
    }
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt"
    }
});

userSchema.pre<IUser>("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function (): string {
    const options: SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "7d") as StringValue
    };
    return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email
    }, process.env.ACCESS_TOKEN_SECRET as string, options);
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET as string, {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "10d") as StringValue
    });
}

export const User = mongoose.model<IUser>("User", userSchema);