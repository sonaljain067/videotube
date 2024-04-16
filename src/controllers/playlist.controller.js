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
    let newPlaylist; 
    try{
        newPlaylist = Playlist.create({
            name, description, user
        })
    } catch(err) {
        throw new ApiError(500, "Some error ocurred while creating playlist!", err) 
    }

    return res.status(201)
    .json(new ApiResponse(200, newPlaylist, "New Playlist created succesfully!"))
})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const { userId } = req.params 

    const user = await User.findById(userId)
    const playlistByUser = await Playlist.find({
        owner: user 
    })

    return res.status(200)
    .json(new ApiResponse(200, playlistByUser, `Playlist created by ${user.username} fetched succesfully!`))

})

const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 

    const fetchPlaylist = await Playlist.findById(playlistId)

    return res.status(200)
    .json(new ApiResponse(200, fetchPlaylist, "Playlist fetched succesfully!"))
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params 

    const videoToPlaylist = await Playlist.updateOne(
        { _id: playlistId },
        { $push: {video: videoId }}
    )

    // TODO: need to check if to push videoid / objectid 

    return res.status(200)
    .json(new ApiResponse(200, videoToPlaylist, "Video added succesfully to playlist!"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const{ playlistId, videoId } = req.params 

    const removevideoFromPlaylist = await Playlist.update(
        { _id: playlistId },
        { $pull: {video: videoId }}
    )

    // TODO: need to check if to push videoid / objectid  

    return res.status(200)
    .json(new ApiResponse(200, removevideoFromPlaylist, "Video removed succesfully from playlist!"))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 


})

const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params 
    const { name, description } = req.body 

    
})

export { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist }