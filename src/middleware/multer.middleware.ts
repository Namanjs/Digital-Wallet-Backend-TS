import { Request } from "express";
import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.diskStorage({
    destination: function (
        _req: Request,
        _file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ) {
        cb(null, "./public/temp");
    },
    filename: function (
        _req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
    ) {
        // Create a unique suffix using the current timestamp and a random number
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({
    storage,
    limits: {
        // fileSize limits the size of the uploaded file (2MB = 2 * 1024 * 1024)
        fileSize: 2 * 1024 * 1024,
    },
});

export { upload };