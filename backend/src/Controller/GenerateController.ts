// server/src/controllers/generationController.ts
import { Request, Response } from "express";
import { getDB, initDB } from "../lib/db";
import { z } from 'zod';

const ACCEPTED_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png"
];

const OVERLOAD_CHANCE = 0.2; // 20% chance of model overload
const GENERATION_DELAY = 1000; // Simulate processing time

const GenerateSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    style: z.string().min(1, "Style is required"),
});

// Simulate model overload
const simulateModelOverload = (): boolean => {
    return Math.random() < OVERLOAD_CHANCE;
};

// Simulate processing delay
const simulateProcessing = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const generate = async (req: Request, res: Response) => {
    try {
        // Check for model overload before processing
        if (simulateModelOverload()) {
            return res.status(503).json({ 
                success: false, 
                message: "MODEL_OVERLOADED",
                error: "The model is currently overloaded. Please try again."
            });
        }

        // Validate text fields from req.body
        const { prompt, style } = GenerateSchema.parse(req.body);
        
        // Get file from multer (req.file, not req.body)
        const file = req.file;
        const user = (req as any).user;

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                message: "File is required" 
            });
        }

        // Validate file type (multer already filtered, but double-check)
        if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: "Only .jpeg, and .png formats are supported" 
            });
        }

        // Simulate AI processing time
        await simulateProcessing(GENERATION_DELAY);

        const db =  getDB();
        const imageUrl = `/uploads/${file.filename}`;
        
        const result = await db.run(
            "INSERT INTO generations (userId, prompt, style, imageUrl, timestamp) VALUES (?, ?, ?, ?, ?)",
            [user.id, prompt, style, imageUrl, new Date().toISOString()]
        );

        const newGen = await db.get(
            'SELECT id, userId,prompt, style, imageUrl, timestamp FROM generations WHERE id=?', 
            [result.lastID]
        );

        res.status(201).json({
            success: true, 
            id: newGen.id,
            userId: newGen.userId,
            prompt: newGen.prompt,
            style: newGen.style,
            imageUrl: newGen.imageUrl,
            timestamp: newGen.timestamp
        });
    } catch (err: any) {
        console.error('Generation error:', err);
        
        // Handle Zod validation errors
        if (err.name === 'ZodError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error',
                errors: err.errors 
            });
        }
        console.log(err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error while generating image' 
        });
    }
};

export const getGenerations = async(req: Request, res: Response) => {
    try {   
        const db =  getDB();
        const user = (req as any).user;
        const limit = Number(req.query.limit) || 5;
        
        if (limit < 1 || limit > 50) {
            return res.status(400).json({ 
                success: false, 
                message: 'Limit must be between 1 and 50' 
            });
        }
        console.log("user id ", user)
        const results = await db.all(
            "SELECT * FROM generations WHERE userId = ? ORDER BY timestamp DESC LIMIT ?", 
            [user.id as Number, limit]
        );

        return res.status(200).json(results);
    } catch (err) {
        console.error('Fetch generations error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error while fetching generated data' 
        });
    }
};