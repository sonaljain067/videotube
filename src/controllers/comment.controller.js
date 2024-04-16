import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    const { page = 1, limit = 10} = req.query 

    const allVideoComments = await Comment.find({
        video: videoId
    })

    return res.status(200)
    .json(new ApiResponse(200, allVideoComments, "Video's comment fetched succesfully!"))
    //TODO after checking allVideoComments format 

})

const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    const { content } = req.body 

    if(!videoId){
        throw new ApiError(404, "Video Id is required to add comment!")
    }

    if(!content){
        throw new ApiError(404, "No comment added!")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "No video exists with requested video Id")
    }
    const owner = await User.findById(req.user?._id)

    const createdComment = await Comment.create({
        content, 
        video, 
        owner
    })

    return res.status(201)
    .json(new ApiResponse(200, createdComment, "Comment to the video added succesfully!!"))

    // TODO: filter out & send only required fields
})

const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params 

    const { content } = req.body 

    if(!commentId){
        throw new ApiError(404, "Comment Id is required to update it!")
    }

    if(!content){
        throw new ApiError(404, "No comment added to update it!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            }
        }, 
        {
            new: true
        })
    if(updatedComment == null || updatedComment == undefined || !updatedComment) {
        throw new ApiError(400, "No such comment exists to update!")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedComment, "Comment to the video updated succesfully!!"))
})

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params 

    if(!commentId){
        throw new ApiError(404, "Comment Id is required to update it!")
    }

    try{
        await Comment.deleteOne({
            _id: commentId
        })
    } catch(err) {
        throw new ApiError(500, `Some error occur while deleting comment: ${err}`)
    }
    

    return res.status(200)
    .json(new ApiResponse(200, {}, "Comment to the video deleted succesfully!!"))
})

export { getVideoComments, addComment, updateComment, deleteComment }