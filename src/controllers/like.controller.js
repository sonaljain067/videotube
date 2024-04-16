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
    const flag = ""
    try{
        if(!(video.length > 0)) {
            await Like.create({
                video: mongoose.Types.ObjectId(videoId),
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
        throw new ApiError(500, "Error while liking the video!!")
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, `${flag} video succesfully!` ))
})

// toggle like on comment 
const toggleCommentLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    // TODO: same as above, need to validate its functioning 
})

// toggle like on tweet 
const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params 
    // TODO: same as above, need to validate its functioning 
})

// all liked videos 
const getLikedVideos = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user?._id)
    
    const likedVideosByUser = await Like.find({
        likedBy: user
    })

    return res.status(200)
    .json(new ApiResponse(200, likedVideosByUser, `All videos liked by ${user.username} fetched succesfully!`))

})  

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos }