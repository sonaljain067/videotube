import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async(req, res) => {
    // get channel and user 
    const { channelId } = req.params 
    if(!channelId) {
        throw new ApiError(404, "Channel Id is required")
    }
    const subscriber = await User.findById(req.user?._id)
    
    // search in user's(subscribers)
    const channelDetails = await User.aggregate([
        {
            $match: {
                username: channelId?.toLowerCase()
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
            $addFields: { 
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])
    let flag = ""
    const isSubscribed = channelDetails[0].isSubscribed

    // if channel not exist add it  
    try{
        if(!isSubscribed) {
            if(!subscriber._id.equals(channelDetails[0]._id)){
                await Subscription.create(
                    {
                        subscriber: subscriber._id,
                        channel: channelDetails[0]._id
                    }
                )
                flag = "Subscribed"
            }
            else flag = "You cannot subscribe your account!!"
        } else if(isSubscribed){ // if channel exists, remove it 
            const subscribedChannel = await Subscription.deleteOne({
                subscriber: subscriber._id, channel: channelDetails[0]._id
            })
            console.log(subscribedChannel)
            flag = "Unsubscribed"
        } 
    } catch(err){
        throw new ApiError(400, "Encountered error while subscribing: ", err)
    }
    return res.status(200)
    .json(new ApiResponse(200, {flag}, "Success"))
    
})

// // subscriber list of channel 
const getSubscriptionChannelList = asyncHandler(async(req, res) => {
    // find channel 
    const { channelId } = req.params 
    if(!channelId) {
        throw new ApiError(404, "Channel Id is required")
    }

    // aggregate subscriber of the channel 
    const subscribers = await User.aggregate([
        {
            $match: {
                username: channelId?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        
    ])

    const subscriberList = subscribers[0].subscribers
    const subscriberIds = subscriberList.map(item => item.subscriber)
   
    const subscriberDetails = await User.find({
        '_id': subscriberIds
    })

    const subscriberNames = subscriberDetails.map(item => item.username)

    return res.status(200)
    .json(new ApiResponse(200, subscriberNames, "Channel Subscribed list fetched succesfully!!"))
}) 

// channel list to which user has subscribed 
const getUserSubscribedChannels = asyncHandler(async(req, res) => {
    // fetch user 
    const { subscriberId } = req.params
    if(!subscriberId) {
        throw new ApiError(404, "Subscriber Id is required to get User subscribed channel List")
    }

    // return user's channel 
    const subscribers = await User.aggregate([
        {
            $match: {
                username: subscriberId?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            }
        },
        
    ])

    const channels = subscribers[0].subscribedTo 
    const channelIds = channels.map(item => item.channel)
    console.log(channelIds)

    const channelDetails = await User.find({
        '_id': channelIds
    })

    const channelNames = channelDetails.map(item => item.username)

    return res.status(200)
    .json(new ApiResponse(200, channelNames, "User Subscribed list fetched succesfully!!"))
})


export { toggleSubscription, getUserSubscribedChannels, getSubscriptionChannelList}