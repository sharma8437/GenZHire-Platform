import express from "express";
import path from "path";
import { ENV } from "./lib/env.js";

const app = express();

const __dirname = path.resolve();


app.get("/health", (req, res) => {
  res.status(200).json({message: "api is up and runing"});
});

app.get("/book", (req, res) => {
  res.status(200).json({message: "book api"});
});


//make our app ready for production
if(ENV.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  })
}
  

app.listen(ENV.PORT, () => {
  console.log(`server is running on port ${ENV.PORT}`);
});
