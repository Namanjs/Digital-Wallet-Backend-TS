import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import type { register } from "../validators/user.validator";
import { registerSchema } from "../validators/user.validator";
import z, { ZodSafeParseResult } from "zod";
import { UploadApiResponse } from "cloudinary";

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    
    const validateData: ZodSafeParseResult<register> = registerSchema.safeParse(req.body);

    if(!validateData.success){
        const errors = z.treeifyError(validateData.error);
        throw new ApiError(400, "Bad request", [errors.properties])
    }

    const { username, email, fullName, password, balance } = validateData.data;

    const isDuplicate = await User.findOne({
        $or: [{ email }, { username }]
    });

    if(isDuplicate){
        throw new ApiError(409, "User with email or username already exist.")
    }

    const avatarLocalFilePath = (req.files as any)?.avatar?.[0]?.path;

    let avatar: UploadApiResponse | null = null;

    if (avatarLocalFilePath) {
        avatar = await uploadOnCloudinary(avatarLocalFilePath);

        if(!avatar?.url){
            throw new ApiError(500, "Something went wrong while uploading the avatar file or the file is not an image")
        }
    }
    
    const user = await User.create({
        username: username,
        email: email,
        fullName: fullName || "",
        avatar: avatar?.url || "https://api.dicebear.com/7.x/identicon/svg",
        password: password,
        balance: balance
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    };

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
});

export {
    registerUser
}