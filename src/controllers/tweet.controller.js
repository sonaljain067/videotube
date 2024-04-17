import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

const createTweet = asyncHandler(async(req, res) => {
    const owner = await User.findById(req.user._id)
    const { content } = req.body 

    if(!content) {
        throw new ApiError(400, "Content is missing!")
    }

    try{
        await Tweet.create({
            content: content, 
            owner: owner
        })
    } catch(err){
        throw new ApiError(500, `Error while creating tweet: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Tweet succesfully created!"))
})

const getUserTweet = asyncHandler(async(req, res) => {
    const owner = await User.findById(req.user._id)

    let userTweets = await Tweet.find({
        owner
    })

    return res.status(200)
    .json(new ApiResponse(200, userTweets, "Tweet fetched succesfully!"))
})

const updateTweet = asyncHandler(async(req, res) => {
    const { content } = req.body 
    const { tweetId } = req.params
    
    if(!content) {
        throw new ApiError(404, "Content is missing!")
    }

    let updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content
            }
        }, 
        {
            new: true
        }
    )

    return res.status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated succesfully!"))
})

const deleteTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params

    try{
        await Tweet.deleteOne({
            _id: tweetId
        })
    } catch(err){
        throw new ApiError(500, `Error while deleting tweet: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted succesfully!"))
})

export { createTweet, getUserTweet, updateTweet, deleteTweet }