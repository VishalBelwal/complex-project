import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

const generateAccessandrefreshtokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresha and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    //get usr details from frontend
    //valdation-not empty
    //check if user already existed-by mai or username
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object-create entry in db
    //after creation remove password and refresh token fild fom response
    //checkfor user creation
    //then return response otherwise send error

    const { email, userName, fullName, password } = req.body;

    if (
        [fullName, email, userName, password].some(
            (field) => field?.trim() === "" //agar fild hai to use return kar do aur agar return karne ke baad bhi wo empty hai to automaticall true return ho jayega aur agar ek bhi field ne true return kaa matlab wo ield khali tha then
        )
    ) {
        throw new ApiError(400, "All field are required");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User already existed");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    console.log(req.files);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    //uploading file on cloudinary
    const avatar = await uploadonCloudinary(avatarLocalPath);
    const coverImage = await uploadonCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar is required");
    }

    //database entry
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    //removing password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    );

    //checking for user creation
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while regestring the user"
        );
    }

    //returning api response
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    //require data from frontend
    //database query to check if the details entered by the user is correct or not  OR the user alredy registered or not
    //if not regestered then give a message ffor regestration
    //if registered then check the data
    //access and refresh token
    //send cookie
    //if data is correct then login successfully
    //if not then error pass
    const { email, userName, password } = req.body;
    if (!(userName || email)) {
        throw new ApiError(400, "username or email is required");
    }

    ///ya to email dhundlo ya fir username
    const user = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "password incorrect");
    }

    //agar password bhi theek hai then accesss aur refresh token bnao
    //accessed accesstoken and refreshtoken
    const { accessToken, refreshToken } = await generateAccessandrefreshtokens(
        user._id
    );

    //optional
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //now cookie can ionly be modified by the server and not by frontendjmhmff
    const options = {
        httpOnly: true,
        secure: true,
    };

    //sending cookie
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
                    refreshToken,
                },
                "User logged in Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    //cookies clear
    //refresh token reset

    //deleting refresh token from accessing database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggedOut Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshtoken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshtoken) {
        throw new ApiError(401, "Unauthorized Request");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshtoken,
            process.env.REFRESH_TOKEN_SECRET
        );
    
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        if (incomingRefreshtoken !== user?.generateRefreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }
    
        const options = { httpOnly: true, secure: true };
        const {accessToken, newrefreshToken}= await generateAccessandrefreshtokens(user._id)
    
        return res.status(200).cookie("access token", accessToken, options).cookie("refresh Token", newrefreshToken, options)
        .json(
            new ApiResponse(
                200, {
                    accessToken, refreshToken: newrefreshToken
                }, "Access token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message, "invalid Refresh token")
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
