import {requireAuth} from "@clerk/express"
import User from "../models/User.js"


export const protectRoute = [
    requireAuth(),
    async(req,res,next)=>{
        try {
            const clerkId = req.auth().userId;
            
            if(!clerkId) return res.status(401).json({success:false, message:"Unauthorized - invalid token"})


                //find the user in db by the clerkId 
                const user = await User.findOne({clerkId})

                if(!user) return res.status(404).json({success:false, message:"User not found"})

                    //attatch the user to the request object
                req.user = user;
                next()
            
         
            
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            return res.status(500).json({success:false, message:"Internal server error"})
        }
    }
]
