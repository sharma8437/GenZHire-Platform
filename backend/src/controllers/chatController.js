import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    //use clerkId from the for stream chat request object (added by protectRoute middleware)
    const token = chatClient.createToken(req.user.clerkId);

    return res.status(200).json({
      success: true,
      token,
      userId: req.user.clerkId,
      userName: req.user.name,
      userImage: req.user.image,
    });
  } catch (error) {
    console.error("Error getting stream token:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
