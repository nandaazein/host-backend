import express from "express";
import { verifyTokenRoute } from "../Middleware/verifyToken.js";

const router = express.Router();

router.get("/verify-token", verifyTokenRoute);

export default router;
