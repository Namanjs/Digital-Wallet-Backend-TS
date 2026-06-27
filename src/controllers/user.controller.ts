import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import type { login, register, passwordChange } from "../validators/user.validator";
import { loginSchema, passwordChangeSchema, registerSchema } from "../validators/user.validator";
import z, { ZodSafeParseResult } from "zod";
import { UploadApiResponse } from "cloudinary";
import jwt from "jsonwebtoken";
import { DecodeToken } from "../middleware/auth.middleware";

const registerUser = asyncHandler(async (req: Request, res: Response) => {    
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

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const loginCredentials: ZodSafeParseResult<login> = loginSchema.safeParse(req.body);
    
    if(!loginCredentials.success){
        const errors = z.treeifyError(loginCredentials.error);
        throw new ApiError(400, "Bad request", [errors.properties])
    }

    const { identifier, password } = loginCredentials.data;

    const isEmail = z.email().safeParse(identifier).success;

    let user = null;

    if(isEmail){
        const email = identifier;
        user = await User.findOne({email});
    }else{
        const username = identifier;
        user = await User.findOne({username});
    }

    if(!user){
        throw new ApiError(400, "Invalid credentials");
    }

    const passwordCorrect = await user.isPasswordCorrect(password);

    if(!passwordCorrect){
        throw new ApiError(400, "Invalid credentials");
    }

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    if(!accessToken || !refreshToken){
        throw new ApiError(500, "Something went wrong while generating the jwt tokens")
    }

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(401, "Unauthorized access")
    }

    user.refreshToken = "";

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User log out successfully"
            )
        )
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if(!refreshToken){
        throw new ApiError(403, "Refresh Token is missing");
    }

    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as jwt.Secret);

    const user = await User.findById((decodedToken as DecodeToken)._id);

    if(!user){
        throw new ApiError(404, "User associated with refresh token not found");
    }

    if(user.refreshToken !== refreshToken){
        throw new ApiError(401, "Refresh token as been revoked or invalid");
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV == "production"
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access Token refresh successfully"
            )
        )
})

const changeCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
    const validateData: z.ZodSafeParseResult<passwordChange> = passwordChangeSchema.safeParse(req.body);

    if(!validateData.success){
        const errors = z.treeifyError(validateData.error);
        throw new ApiError(400, "Bad request", [errors.properties])
    }

    const { oldPassword, newPassword } = validateData.data;

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(401, "Unauthorized access");
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(400, "Password is wrong")
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password updated successfully")
    )
})

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    )
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser
}