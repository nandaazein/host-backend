import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

export const verifyToken = async (req, res) => {
  console.log("Received request to /api/verify-token"); // Debug log
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("No token provided"); // Debug log
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    console.log("Decoded token:", decoded); // Debug log
    res.json({ role: decoded.role });
  } catch (error) {
    console.error("Token verification error:", error); // Debug log
    res.status(400).json({ message: "Invalid token" });
  }
};
