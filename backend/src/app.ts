// src/app.ts
import express from 'express';
import cors from 'cors';
import userRouter from './routes/auth.js';
import generateRouter from './routes/generations.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/checkStatus", (req, res) => res.send('Server is live'));
app.use("/api/auth", userRouter);
app.use("/api/generations", generateRouter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// DO NOT CALL app.listen() HERE!
export default app;