import { Router } from 'express'
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js"

const router = Router(); 

router.use(verifyJWT); // apply verifyJWT middleware to all routes in this file 
router.route("/video/:videoId").get(getVideoComments).post(addComment);
router.route("/comment/:commentId").delete(deleteComment).patch(updateComment)

export default router