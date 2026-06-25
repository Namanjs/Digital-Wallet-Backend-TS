import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        if (!localFilePath) {
            console.error("Cloudinary upload error: Local file path is missing.");
            return null;
        };

        if (!fs.existsSync(localFilePath)) {
            console.error("Cloudinary upload error: File does not exist at path:", localFilePath);
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error: any) {
        console.error("Cloudinary upload error:", error.message);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file deleted on error:", localFilePath);
        }
        return null;
    }
};

export { uploadOnCloudinary };
