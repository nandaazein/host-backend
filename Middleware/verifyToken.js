import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

export const verifyTokenRoute = async (req, res) => {
  console.log("Received request to /api/verify-token");
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("No token provided");
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    console.log("Decoded token:", decoded);
    res.json({ role: decoded.role });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid token" });
  }
};
