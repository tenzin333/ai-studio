import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDB } from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const signup = async (req: Request, res: Response) => {
  const db =  getDB();
  const { email, password } = req.body;
  
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const hashed = await bcrypt.hash(password, 10);
  
  try {
    const result = await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashed]);
    
    // Generate token immediately after signup
    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: "7d" });
    
    res.status(201).json({ 
      message: "User created successfully",
      token 
    });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
};

export const login = async (req: Request, res: Response) => {
  const db =  getDB();
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  
  res.json({ 
    message: "Login successful",
    token 
  });
};

export const logout = async (req: Request, res: Response) => {
  // Since you're using JWT (stateless authentication), 
  // logout is handled client-side by removing the token
  // The server just confirms the action
  
  res.json({ 
    message: "Logged out successfully" 
  });
};

// Optional: Verify token endpoint (useful for checking if user is still authenticated)
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    
    res.json({ 
      valid: true,
      user: { id: decoded.id, email: decoded.email }
    });
  } catch (err) {
    res.status(401).json({ 
      valid: false,
      message: "Invalid or expired token" 
    });
  }
};