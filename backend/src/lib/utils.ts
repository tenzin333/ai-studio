import jwt from 'jsonwebtoken';

export const generateToken = (userId:String) => {
    const token = jwt.sign({userId} , process.env.JWT_SECRET ?? "",{
      expiresIn: "1h",
    });
    return token;
}