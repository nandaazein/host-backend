import studentModel from "../Models/SiswaModel.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const studentController = {
  async register(req, res) {
    try {
      const {
        nis,
        fullName,
        password,
        confirmPassword,
        class: studentClass,
        token,
      } = req.body;
      console.log("Register request:", {
        nis,
        fullName,
        class: studentClass,
        token,
      });

      if (
        !nis ||
        !fullName ||
        !password ||
        !confirmPassword ||
        !studentClass ||
        !token
      ) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
      }

      await studentModel.register({
        nis,
        name: fullName,
        className: studentClass,
        password,
        confirmPassword,
        token,
      });
      res.status(201).json({ message: "Siswa berhasil terdaftar" });
    } catch (error) {
      console.error("Register error:", error);
      if (
        error.code === "ER_NO_SUCH_TABLE" ||
        error.code === "ER_BAD_FIELD_ERROR"
      ) {
        return res.status(500).json({
          message: "Kesalahan struktur database. Periksa tabel students.",
        });
      }
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async login(req, res) {
    try {
      const { nis, password } = req.body;
      const student = await studentModel.login(nis, password);
      if (!student) {
        return res.status(400).json({ message: "Kredensial tidak valid" });
      }

      const token = jwt.sign(
        { id: student.id, role: student.role, nis: student.nis },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: student.id,
          nis: student.nis,
          fullName: student.full_name,
          class: student.class,
          role: student.role,
          progress: student.progress,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async getAllStudents(req, res) {
    try {
      const students = await studentModel.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Get all students error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async getClasses(req, res) {
    try {
      const classes = await studentModel.getClasses();
      res.json(classes);
    } catch (error) {
      console.error("Get classes error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async updateProgress(req, res) {
    try {
      const { progress } = req.body;
      const { nis } = req.params;
      const student = await studentModel.updateProgress(nis, progress);
      if (!student) {
        return res.status(404).json({ message: "Siswa tidak ditemukan" });
      }
      res.json({ message: "Progres berhasil diperbarui", student });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async updateStudent(req, res) {
    try {
      const { full_name, class: className } = req.body;
      const { nis } = req.params;
      if (!full_name || !className) {
        return res.status(400).json({ message: "Nama dan kelas wajib diisi" });
      }
      const student = await studentModel.updateStudent(nis, {
        full_name,
        class: className,
      });
      if (!student) {
        return res.status(404).json({ message: "Siswa tidak ditemukan" });
      }
      res.json({ message: "Data siswa berhasil diperbarui", student });
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async updateOwnProgress(req, res) {
    try {
      const { progress } = req.body;
      const { id } = req.user;
      const student = await studentModel.findById(id);
      if (!student) {
        return res.status(404).json({ message: "Siswa tidak ditemukan" });
      }
      const updatedStudent = await studentModel.updateProgress(
        student.nis,
        progress
      );
      res.json({
        message: "Progres berhasil diperbarui",
        student: updatedStudent,
      });
    } catch (error) {
      console.error("Update own progress error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async getProgress(req, res) {
    try {
      const { nis } = req.params;
      const progressData = await studentModel.getProgress(nis);
      if (!progressData) {
        return res.status(404).json({ message: "Siswa tidak ditemukan" });
      }
      if (req.user.role !== "teacher" && req.user.nis !== nis) {
        return res.status(403).json({ message: "Akses ditolak" });
      }
      res.json(progressData);
    } catch (error) {
      console.error("Get progress error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async deleteStudent(req, res) {
    try {
      const { nis } = req.params;
      await studentModel.deleteStudent(nis);
      res.json({ message: "Siswa berhasil dihapus" });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async submitScore(req, res) {
    try {
      const { nis } = req.params;
      const scores = req.body;
      await studentModel.submitScore(nis, scores);
      res.json({ message: "Skor berhasil disimpan" });
    } catch (error) {
      console.error("Submit score error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async submitEvaluationScore(req, res) {
    try {
      const { nis } = req.params;
      const { evaluation_score } = req.body;
      if (
        isNaN(evaluation_score) ||
        evaluation_score < 0 ||
        evaluation_score > 100
      ) {
        return res
          .status(400)
          .json({ message: "Skor evaluasi tidak valid (0-100)" });
      }
      const result = await studentModel.submitEvaluationScore(
        nis,
        evaluation_score
      );
      res.json({ message: "Skor evaluasi berhasil disimpan", ...result });
    } catch (error) {
      console.error("Submit evaluation score error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async getScores(req, res) {
    try {
      const { nis } = req.params;
      const scores = await studentModel.getScores(nis);
      if (!scores) {
        return res.status(404).json({ message: "Skor tidak ditemukan" });
      }
      res.json(scores);
    } catch (error) {
      console.error("Get scores error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async getAllScores(req, res) {
    try {
      const scores = await studentModel.getAllScores();
      res.json(scores);
    } catch (error) {
      console.error("Get all scores error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async getDashboardData(req, res) {
    try {
      const { class: className } = req.query;
      const dashboardData = await studentModel.getDashboardData(className);
      res.json(dashboardData);
    } catch (error) {
      console.error("Get dashboard data error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },
};

export default studentController;
