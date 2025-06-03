import express from "express";
import { verifyToken } from "../Middleware/verifyToken.js"; // Ensure path is correct

const router = express.Router();

router.get("/verify-token", verifyToken);

export default router;
