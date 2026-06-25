import express, {Request, Response} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error.middleware";
import { userRoutes } from "./routes/user.routes";

export const app = express();

app.use(cors({
    origin: "*",
    // credentials: true
}));

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
    res.send("App is running.")
});

app.use('/users', userRoutes)

app.use(errorHandler);