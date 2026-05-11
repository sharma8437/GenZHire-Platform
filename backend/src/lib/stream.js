import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";


const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if(!apiKey || !apiSecret) {
    console.log(" SteramAPI_KEY and STREAM_API_SECRET are missing ");
    
}

export const chatClient = StreamChat.getInstance(apiKey,apiSecret); // this will we use for chat
export const streamClient = new StreamClient(apiKey,apiSecret) // this will we use for video call and recordings

export const upsertStreamUser = async (userData)=>{

    try {
        await chatClient.upsertUser(userData)
        console.log(`Stream user synced successfully:`, userData);
        
    } catch (error) {
        console.error("Error syncing user to Stream :", error);
    }
        
}


export const deleteStreamUser = async (userId)=>{

    try {
        await chatClient.deleteUsers([userId])
        console.log(`Stream user deleted successfully:`, userId);
        
    } catch (error) {
        console.error("Error deleting user from Stream :", error);
    }
        
}


