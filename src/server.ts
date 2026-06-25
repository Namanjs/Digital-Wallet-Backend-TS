import { app } from './app';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const port = Number(process.env.PORT) || 8000;
const mongoUri = process.env.MONGO_URI;

mongoose   
    .connect(mongoUri as string)
    .then((): void => {
        console.log("Connect to MongoDB");

        app.listen(port, (): void => {
            console.log(`Server is running on port http://localhost:${port}`);
        });
    })
    .catch((error: Error):void => {
        console.error("Error connecting to MongoDB: ", error);
        process.exit(1);
    })
