import express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import cors from "cors";
import { processFile } from "./fileProcessor.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
//const backendUrl = process.env.BACKEND_URL;
const frontendUrl = process.env.FRONTEND_URL;
//const port = 3001;
const port = process.env.PORT;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable CORS
app.use(
  cors({
    origin: [`${frontendUrl}`],
    // origin: ["http://localhost:3000"], //removed env port for convenience
    methods: ["POST", "GET"],
    credentials: true,
  })
);

// Set up multer for file uploads
const upload = multer({ dest: "temp-uploads/" }); // Temporary storage

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const uploadedFilePath = join(__dirname, req.file.path);

  try {
    const result = processFile(uploadedFilePath);
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Clean up temporary file
    fs.unlink(uploadedFilePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  }
});

app.get("/", (req, res) => {
  res.send("Project is running");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
