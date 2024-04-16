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
            }, 
        }, 
        {
            $unwind: "$channelVideos"
        },
        {
            $project: {
                duration: "$channelVideos.duration",
                views: "$channelVideos.views",
                _id: 0
            }
        },
        {
            $addFields: {
                totalViews: {
                    $sum: "$views"
                },
                totalDuration: {
                    $sum: "$duration"
                }
            }
        },
        // {
        //     $project: {
        //         // _id: 0,
        //         // channelVideos: 1,
        //         totalDuration: 1, 
        //         totalViews: 1
        //     }
        // },
    ])
    

    return res.status(200)
    .json(new ApiResponse(200, videosOfChannel, "Channel Videos fetched succesfully!!"))
    
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

