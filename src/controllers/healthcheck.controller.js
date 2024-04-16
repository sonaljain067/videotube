import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"

// return 200 ok json with message 
const healthCheck = asyncHandler(async(req, res) => {
    return res.status(200)
    .json(new ApiResponse(200, {}, "Application running smoothly!"))

    // TODO: add condition for failure if any error in terminal 
})

export { healthCheck }