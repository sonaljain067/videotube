import { Router } from "express"
import { toggleSubscription, getSubscriptionChannelList, getUserSubscribedChannels } from "../controllers/subscriber.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/c/:channelId").get(getSubscriptionChannelList).post(toggleSubscription)

router.route("/u/:subscriberId").get(getUserSubscribedChannels)

export default router 
