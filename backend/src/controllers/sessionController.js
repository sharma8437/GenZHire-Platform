import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res
        .status(400)
        .json({
          message: "Problem description and difficulty level are required",
        });
    }
    //genrate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    //create session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    //create stream video call

    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    //chat message
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({
      success: true,
      session: session,
    });

    //to do
  } catch (error) {
    console.log("Error in createSession controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.log("Error in getActiveSessions controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    //getb session where user is host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participants: userId }],
    })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name profileImage email clerkId")
      .populate("participants", "name profileImage email clerkId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.log("Error in getSessionById controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if(session.status !== "active")
      return res.status(400).json({message:"Session is no longer active"});

    //session is already full
    if (session.participants) {
      return res.status(400).json({ message: "Session is already full" });
    }

    if(session.host.toString() === userId.toString()){
      return res.status(409).json({message:"Host cannot join their own session as participant"});
    }

    session.participants = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.log("Error in joinSession controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;

    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    //check if user is host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to end session" });
    }

    //check if session is already ended
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already ended" });
    }

 

    //delete the stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    //delete the stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

       session.status = "completed";
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.log("Error in endSession controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
