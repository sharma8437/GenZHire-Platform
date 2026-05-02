import express from "express";
import path from "path";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import cors from "cors"
import {serve} from "inngest/express"
import { inngest, functions } from "./lib/inngest.js";
import { clerkMiddleware } from "@clerk/express";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const __dirname = path.resolve();

//middleware
app.use(express.json())
app.use(cors({origin:ENV.CLIENT_URL, credentials:true}))

app.use(clerkMiddleware()); //this will adds auth field to req object if user is logged in 

// server.js - replace your current inngest route with this
app.use("/api/inngest", (req, res, next) => {
  if (!["GET", "POST", "PUT"].includes(req.method.toUpperCase())) {
    return res.status(405).json({ message: "Method not allowed" });
  }
  return serve({ client: inngest, functions })(req, res, next);
});
app.use("/api/chat",chatRoutes)

app.get("/health", (req, res) => {

  res.status(200).json({ message: "api is up and running" });
});






if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}




const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`server is running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("❌Error starting server:", error);
    process.exit(1);
  }
};

startServer();
