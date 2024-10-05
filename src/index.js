import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});
const port = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log(error);
            throw error;
        });

        app.listen(port, () => {
            console.log(`Server running at Port: http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAIL!!!: ", err);
    });

/*
import express from "express";
const app = express();

//iife  by this method we are not using the function connectDB
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`APP listening on port http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
})();
*/
