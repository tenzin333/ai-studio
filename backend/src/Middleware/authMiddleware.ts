import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ success: false, message: 'No token' });
    }

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed' });
    }
}