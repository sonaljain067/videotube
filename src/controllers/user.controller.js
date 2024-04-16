import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch(err) {
        throw new ApiError(500, err, "Something went wrong while generating access and refresh token!")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend 
    // validation - not empty 
    // check if user already exists: username, email 
    // check for images. check for avatar 
    // upload them to cloudinary, avatar 
    // create user object - create entry in db 
    // remove password & refresh token field from response 
    // check for user creation 
    // return response  

    // get user details from frontend 
    // console.log(req.body)
    const {fullName, username, email, password} = req.body
    

    // validation - not empty 
    // if(fullName === "") {
    //     throw new ApiError(400, "Full Name is required")
    // }

    // check if user already exists: username, email 
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    // console.log(existedUser)
    if(existedUser){
        throw new ApiError(409, "User with email / username already exists!!")
    }
    

    // check for images. check for avatar 
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path 

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path 
    }
    
    // upload them to cloudinary, avatar 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is missing!!")
    }


    // create user object - create entry in db 
    const user = await User.create({
        fullName, 
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
        email, 
        password, 
        username: username.toLowerCase()
    })

    // remove password & refresh token field from response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -watchHistory"
    )

    // check for user creation 
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user!")
    }

    // return response  
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )

    // if(
    //     [fullName, email, password, username].some((field) => field ?.trim() === "")
    // ) {
    //     throw new ApiError(400, "All fields are required!")
    // }
    
    // console.log("username: ", username)


    // res.status(200).json({
    //     message: "Ok"
    // })
})

const loginUser = asyncHandler (async (req, res) => {
    // input of username/email, password from frontend
    const { email, username, password } = req.body 

    // validation - empty string, sql injection 
    if(!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    
    // check user exists or not 
    if(!user) {
        throw new ApiError(404, "User doesn't exist!")
    }

    // email is of password, and password is of email
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password!")
    }
    // if present allow next page access & generate access & refresh token, else show error 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // await User.findByIdAndUpdate(user?.id, {
    //     $set: {
    //         refreshToken
    //     }
    // })

    // send cookies in response 
    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true, 
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User logged in succesfully!"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
            $set: {
                refreshToken: undefined
            }    
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true 
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out succesfully!!!")
    )
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request, missing refresh token!")
    } 

    try{
        const decodedPayload = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedPayload._id)

        if(!user) {
            throw new ApiError(401, "Invalid refresh token, no user found for refresh token!")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true, 
            secure: true 
        }

        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {
                newAccessToken, refreshToken: newRefreshToken
            }, "Access & Refresh Token refreshed succesfully!")
        )
    } catch(err){
        throw new ApiError(401, `Error in refreshing access token: ${err?.message}`)
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword } = req.body 
    const user = await User.findById(req.user?._id)
    const isPasswordCorrectCheck = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrectCheck) {
        throw new ApiError(404, "Invalid old password!")
    }

    if(confirmPassword !== newPassword) {
        throw new ApiError(400, "New & confirm password didn't match!")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password Changed Succesfully!"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200)
    .json(new ApiResponse(
        200, req.user, "Current user fetched succesfully!!"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body 
    if(!fullName && !email) {
        throw new ApiError(400, "Full Name & Email is required when updating!")
    }

    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                fullName, 
                email 
            }
        }, 
        {new: true} // updated information will be returned
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, updatedUserDetails, "Account details updated succesfully!"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!")
    }

    const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath)
    if(!avatarCloudinary.url) {
        throw new ApiError(500, "Error while updating avatar in cloudinary!")
    }

    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                avatar: avatarCloudinary.url 
            }
        },
        {new: true}
    ).select("-password")
    
    // todo: delete old avatar image on cloudinary 
    return res.status(200)
    .json(new ApiResponse(200, updatedUserDetails, "User Avatar updated succesfully!"))
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing while updating!")
    }

    const coverImageCloudinary = uploadOnCloudinary(coverImageLocalPath)
    if(coverImageCloudinary.url === ""){
        throw new ApiError(500, "Error while updating cover image in cloudinary!")
    }

    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                coverImage: coverImageCloudinary.url 
            }
        },
        {new: true}
    )
    // todo: delete old cover image on cloudinary 
    
    return res.status(200)
    .json(new ApiResponse(200, updatedUserDetails, "Cover Image updated succesfully!"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params 

    if(!username?.trim()){
        throw new ApiError(400, "Username is not available!")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                }, 
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true, 
                        else: false 
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1, 
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1, 
                avatar: 1,
                coverImage: 1
            }
        }
    ])
    if(!channel?.length) {
        throw new ApiError(404, "Channel doesn't exist!")
    }

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched succesfully!"))

})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1, 
                                        username: 1, 
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200, user[0].watchHistory, 
        "Watch History fetched succesfully!"
    ))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory }