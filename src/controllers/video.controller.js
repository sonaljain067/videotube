import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

// get all videos based on query, sort, pagination
// sortBy: 1(asc), -1(desc)
// sortType: title, description, views, duration 
const getAllVideos = asyncHandler(async(req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if(!userId) {
        // get videos of all users 
    }
    let sortList = ["title", "description", "views", "duration"]

    if(!(sortList.includes(sortType))) {
        sortType = "title"
    }

    if(sortBy == null || sortBy == undefined) {
        sortBy = 1
    }

    let dynamicSort = {}
    dynamicSort[sortType] = sortBy
    
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }, 
        {
            $match: {
                $or: [
                    {
                        title: {
                            $regex: query
                        }
                    },
                    {
                        description:{
                            $regex: query
                        }
                    }
                ]
            }
        },
        {
            $sort: dynamicSort
        },
        
    ])

    return res.status(200)
    .json(new ApiResponse(200, videos, "Video fetched succesfully!"))

})

// get video, upload to cloudinary, create video 
const publishAVideo = asyncHandler(async(req, res) => {
    const { title, description } = req.body 
    const videoLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path 


   const owner = await User.findById(req.user?._id)

   console.log(videoLocalPath, thumbnailLocalPath)
   if(!videoLocalPath) {
        throw new ApiError(404, "Video to upload is missing!!")
   }
   if(!thumbnailLocalPath) {
    throw new ApiError(404, "Thumbnail to upload is missing!!")
    }
   
   const uploadVideo = await uploadOnCloudinary(videoLocalPath)
   const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath) 

   if(!uploadVideo){
    throw new ApiError(500, "Video cannot be uploaded to cloudinary!!!")
   } 
   if(!uploadThumbnail){
    throw new ApiError(500, "Thumbnail cannot be uploaded to cloudinary!!!")
   } 

   const video = await Video.create({
    videoFile: uploadVideo.url,
    thumbnail: uploadThumbnail?.url,
    title,
    description,
    owner,
    duration: uploadVideo.duration 
   })

   const createdVideo = await Video.findById(video._id).select(
    "-views -isPublished"
   )

   return res.status(201)
   .json(new ApiResponse(200, createdVideo, "Video uploaded succesfully!"))
})

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params 

    if(!videoId) {
        throw new ApiError(404, "Video Id is required!!") 
    } 

    const video = await Video.findById(videoId)

    return res.status(200)
    .json(new ApiResponse(200, video, "Video fetched succesfully!"))
})

// update video details like title, description, thumbnail 
const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    if(!videoId) {
        throw new ApiError(404, "Video Id is required!!") 
    } 

    const existingVideoDetails = await Video.findById(videoId)

    const { title, description } = req.body 
    if(!title || !description) {
        throw new ApiError(404, "Video details are missing to update!")
    }
    let thumbnailLocalPath, thumbnail, updatedThumbnail 
    
    if(req.file) {
        thumbnailLocalPath = req.file?.path
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        updatedThumbnail = thumbnail?.url
    } else {
        updatedThumbnail = existingVideoDetails.thumbnail
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title, 
        description, 
        thumbnail: updatedThumbnail
    })

    return res.status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated succesfully!"))

})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    if(!videoId) {
        throw new ApiError(404, "Video Id is required!!") 
    } 

    await Video.findByIdAndDelete(videoId) 

    return res.status(200)
    .json(new ApiResponse(200, {}, "Video deleted sucessfully!"))
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params 
    if(!videoId) {
        throw new ApiError(404, "Video Id is required!!") 
    }

    const video =  await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Requested video doesn't exist!!")
    }
    const updatedVideoDetails = await Video.findOneAndUpdate({
        isPublished: !video.isPublished
    })
    
    let flag 
    if(updatedVideoDetails.isPublished) flag = "Published"
    else flag = "Unpublished"
    return res.status(200)
    .json(new ApiResponse(200, updatedVideoDetails, `${flag} succesfully!`))
})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }