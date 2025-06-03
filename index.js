import express from "express";
import cors from "cors";
import { config } from "dotenv";
import studentRoutes from "./Route/SiswaRoute.js";
import teacherRoutes from "./Route/GuruRoute.js";
import quizRoutes from "./Route/QuizRoute.js";
import kkmRoutes from "./Route/KkmRoute.js";
import apiRoutes from "./Route/apiRoutes.js";
import teacherModel from "./Models/GuruModel.js";
import studentModel from "./Models/SiswaModel.js";
import kkmModel from "./Models/KkmModel.js";
import quizModel from "./Models/QuizModel.js";
import DB from "./Database/DB.js";
const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/kkm", kkmRoutes);
app.use("/api", apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

try {
  await DB.authenticate();
  await GuruModel.sync();
  await SiswaModel.sync();
  await KkmModel.sync();
  await QuizModel.sync();
} catch (error) {
  console.error(error);
}

// Start server after database sync
const PORT = process.env.PORT || 5000;
syncDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
