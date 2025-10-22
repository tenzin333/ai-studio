import express from "express";
import { authenticate } from "../Middleware/authMiddleware.js";
import { generate, getGenerations } from "../Controller/GenerateController.js";
import { upload } from "../Middleware/upload.js";

const generateRouter = express();

generateRouter.post('/generate',authenticate, upload.single('file'),generate);
generateRouter.get('/getGenerate', authenticate,getGenerations);

export default generateRouter;