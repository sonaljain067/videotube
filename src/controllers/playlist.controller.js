import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"

const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body
    if(!name) {
        throw new ApiError(404, "Name for playlist is missing!")
    }
    if(!description) {
        throw new ApiError(404, "Description for playlist is missing!")
    }
    const user = await User.findById(req.user?._id)
    
    try{
        Playlist.create({
            name: name, 
            description: description, 
            owner: user
        })
    } catch(err) {
        throw new ApiError(500, "Some error ocurred while creating playlist!", err) 
    }

    return res.status(201)
    .json(new ApiResponse(200, {}, "New Playlist created succesfully!"))
})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const { userId } = req.params 
    if(!userId) {
        throw new ApiError(404, "User Id is required!!")
    }

    const user = await User.findById(userId)
    const playlistByUser = await Playlist.find({
        owner: user 
    }).select("-createdAt -updatedAt -__v")

    return res.status(200)
    .json(new ApiResponse(200, playlistByUser, `Playlist created by ${user.username} fetched succesfully!`))

})

const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 

    const fetchPlaylist = await Playlist.find({
        _id: playlistId
    }).select("-updatedAt -createdAt -__v")

    return res.status(200)
    .json(new ApiResponse(200, fetchPlaylist, "Playlist fetched succesfully!"))
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params 

    try{
        await Playlist.findByIdAndUpdate(
            {_id: playlistId}, 
            {
                $push: {
                    videos: videoId
                }
            }
            
        )
    } catch(err) {
        throw new ApiError(500, `Error while adding video to playlist: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Video added succesfully to playlist!"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const{ playlistId, videoId } = req.params 

    try{
        await Playlist.updateOne(
            { _id: playlistId },
            { $pull: {videos: videoId }}
        )
    } catch(err) {
        throw new ApiError(500, `Error while removing video from playlist: ${err}`)
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Video removed succesfully from playlist!"))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 

    try{
        await Playlist.deleteOne({
            _id: playlistId
        })
    } catch(err){
        throw new ApiError(500, `Error while deleting playlist: ${err}`)
    }
    return res.status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted succesfully!"))

})

const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 
    let{ name, description } = req.body 

    let playlist = await Playlist.findById({
        _id: playlistId
    })

    if(name == null || name == undefined || !name) {
        name = playlist.name
    }
    if(description == null || description == undefined || !description) {
        description = playlist.description
    }

    let updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $set: {
                name, description
            }
        
        },
        {
            new: true
        }
    )
    
    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated succesfully!"))
    
})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }