import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";   //accessing users browser cookie from server basically performing crud operation with cookies

const app = express();
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        Credential: true,
    })
); //for middleware and cofigurations

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //passing nested objects on more level
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)    ///sort of middleware used to call router


export { app };
