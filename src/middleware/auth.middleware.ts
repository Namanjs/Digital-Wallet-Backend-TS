import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";

interface DecodeToken extends JwtPayload {
    _id: string
}

const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "");

        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as jwt.Secret);

        const user = await User.findById((decodeToken as DecodeToken)?._id).select("-password -refreshToken");

        if(!user){
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, (error as any)?.message || "Something went wrong while authorizing")
    }
});

export {
     verifyJWT
}