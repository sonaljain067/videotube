import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"


// toggle like on video 
const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    const user = await User.findById(req.user?._id)

    const video = await Like.find({
        video: videoId, likedBy: user 
    })
    let flag = ""
    try{
        if(!(video.length > 0 && user != video.owner)) {
            await Like.create({
                video: new mongoose.Types.ObjectId(videoId),
                likedBy: user
            })
            flag = "Liked"
        } else {
            await Like.deleteOne({
                video: videoId, likedBy: user 
            })
            flag = "Unliked"
        }
    } catch(err) {
        throw new ApiError(500, `Error while liking / unliking the video!!: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, `${flag} video succesfully!` ))
})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params

    const user = await User.findById(req.user?._id)

    const comment = await Like.find({
        comment: commentId, likedBy: user 
    })
    let flag = ""
    try{
        if(!(comment.length > 0)) {
            await Like.create({
                comment: new mongoose.Types.ObjectId(commentId),
                likedBy: user
            })
            flag = "Liked"
        } else {
            await Like.deleteOne({
                comment: commentId, likedBy: user 
            })
            flag = "Unliked"
        }
    } catch(err) {
        throw new ApiError(500, `Error while liking / unliking the comment!!: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, `${flag} comment succesfully!` ))
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params 
    // TODO: need to validate its functioning after finishing tweets controller

    const user = await User.findById(req.user?._id)

    const tweet = await Like.find({
        tweet: tweetId, likedBy: user 
    })
    let flag = ""
    try{
        if(!(tweet.length > 0)) {
            await Like.create({
                tweet: new mongoose.Types.ObjectId(commentId),
                likedBy: user
            })
            flag = "Liked"
        } else {
            await Like.deleteOne({
                tweet: tweetId, likedBy: user 
            })
            flag = "Unliked"
        }
    } catch(err) {
        throw new ApiError(500, `Error while liking / unliking the tweet!!: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, `${flag} tweet succesfully!` ))
})

// all liked videos by user
const getLikedVideos = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user?._id)
    
    const likedVideosByUser = await Like.find({
        likedBy: user,
        video: {$exists: true}
    })

    return res.status(200)
    .json(new ApiResponse(200, likedVideosByUser, `All videos liked by ${user.username} fetched succesfully!`))

})  

const getLikedComments = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user?._id)
    
    const likedCommentsByUser = await Like.find({
        likedBy: user,
        comment: {$exists: true}
    })

    return res.status(200)
    .json(new ApiResponse(200, likedCommentsByUser, `All comments liked by ${user.username} fetched succesfully!`))

})  

const getLikedTweets = asyncHandler(async(req, res) => {
    // TODO: need to validate its functioning after finishing tweets controller
    const user = await User.findById(req.user?._id)
    
    const likedTweetsByUser = await Like.find({
        likedBy: user,
        tweet: {$exists: true}
    })

    return res.status(200)
    .json(new ApiResponse(200, likedTweetsByUser, `All tweets liked by ${user.username} fetched succesfully!`))

})  

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos, getLikedTweets, getLikedComments }