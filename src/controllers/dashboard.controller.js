import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"

import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"


// total -> views, subs, videos, likes 
const getChannelStats = asyncHandler(async(req, res) => {
    const { channelId } = req.params 
    if(!channelId) {
        throw new ApiError(404, "Channel Id is required")
    }
    
    const channelStats = await User.aggregate([
        {
            $match: {
                username: channelId?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos"
            }, 
        }, 
        {
            $unwind: "$channelVideos"
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideos",
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "allVideos._id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                videosCount: {
                    $size: "$allVideos"
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
       
        {
            $group: {
                _id: "$_id",
                totalViews: {$sum: "$channelVideos.views"},
                totalDuration: {$sum: "$channelVideos.duration"},
                subscriberCount: {
                    $addToSet: "$subscriberCount"
                },
                videosCount: {
                    $addToSet: "$videosCount"
                },
                likesCount: {
                    $addToSet: "$likesCount"
                }
            }
        },
        {
            $unwind: "$subscriberCount"
        },
        {
            $unwind: "$videosCount"
        },
        {
            $unwind: "$likesCount"
        }

    ])
    

    return res.status(200)
    .json(new ApiResponse(200, channelStats, "Channel Videos fetched succesfully!!"))
    
})

// all videos by channel 
const getChannelVideos = asyncHandler(async(req, res) => {
    const { channelId } = req.params 
    let owner 
    try{
        owner = await User.find({
            _id: channelId
        })
    } catch(err) {
        throw new ApiError(400, `Some error while fetching owner: ${err}`)
    }
    const videosOfChannel = await User.aggregate([
        {
            $match: {
                _id: owner[0]._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos"
            }
        },
        {
            $project: {
                _id: 0,
                channelVideos: 1
            }
        }
        
    ])

    return res.status(200)
    .json(new ApiResponse(200, videosOfChannel, "Channel Videos fetched succesfully!!"))
    // [0].channelVideos
})


export { getChannelStats, getChannelVideos }

