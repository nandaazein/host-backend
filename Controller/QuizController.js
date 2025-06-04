import quizModel from "../Models/QuizModel.js";
import path from "path";
import fs from "fs";

const QuizController = {
  async createQuestion(req, res) {
    try {
      const { quizNumber, question, options, correctAnswer } = req.body;
      // imageUrl sekarang akan dihasilkan dari file upload
      let imageUrl = null;

      if (!quizNumber || !question || !options || !correctAnswer) {
        return res
          .status(400)
          .json({ message: "Semua field wajib diisi kecuali gambar" });
      }

      if (!Array.isArray(options) || options.length !== 4) {
        return res
          .status(400)
          .json({ message: "Opsi harus berupa array dengan 4 elemen" });
      }

      // Cek jika file gambar ada
      if (req.file) {
        // Simpan path relatif sebagai URL gambar
        imageUrl = "/uploads/" + req.file.filename;
      }

      await quizModel.createQuestion({
        quizNumber,
        question,
        options,
        correctAnswer,
        imageUrl,
      });

      res.status(201).json({ message: "Soal berhasil ditambahkan" });
    } catch (error) {
      console.error("Create question error:", error);
      if (error.status === 413) {
        return res.status(413).json({
          message:
            "Ukuran data terlalu besar. Gunakan gambar dengan ukuran lebih kecil.",
        });
      }
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async getQuestions(req, res) {
    try {
      const { quizNumber } = req.query;
      if (!quizNumber) {
        const questions = await quizModel.getAllQuestions();
        return res.json(questions);
      }
      const questions = await quizModel.getQuestions(quizNumber);
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async getQuestionById(req, res) {
    try {
      const { id } = req.params;
      const question = await quizModel.getQuestionById(id);
      if (!question) {
        return res.status(404).json({ message: "Soal tidak ditemukan" });
      }
      res.json(question);
    } catch (error) {
      console.error("Get question by id error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const { quizNumber, question, options, correctAnswer } = req.body;
      let imageUrl = null;

      if (!quizNumber || !question || !options || !correctAnswer) {
        return res
          .status(400)
          .json({ message: "Semua field wajib diisi kecuali gambar" });
      }
      if (!Array.isArray(options) || options.length !== 4) {
        return res
          .status(400)
          .json({ message: "Opsi harus berupa array dengan 4 elemen" });
      }

      // Cek file gambar baru jika ada
      if (req.file) {
        imageUrl = "/uploads/" + req.file.filename;
      } else {
        // Jika tidak ada file baru, gunakan imageUrl lama dari body (asumsi frontend mengirimkan kembali URL lama)
        imageUrl = req.body.imageUrl || null;
      }

      await quizModel.updateQuestion(id, {
        quizNumber,
        question,
        options,
        correctAnswer,
        imageUrl,
      });
      res.json({ message: "Soal berhasil diperbarui" });
    } catch (error) {
      console.error("Update question error:", error);
      if (error.status === 413) {
        return res.status(413).json({
          message:
            "Ukuran data terlalu besar. Gunakan gambar dengan ukuran lebih kecil.",
        });
      }
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      const question = await quizModel.getQuestionById(id);
      if (!question) {
        return res.status(404).json({ message: "Soal tidak ditemukan" });
      }

      // Jika ada gambar, hapus file gambarnya juga untuk bersih
      if (question.image_url) {
        const filepath = path.join(
          process.cwd(),
          "uploads",
          path.basename(question.image_url)
        );
        fs.unlink(filepath, (err) => {
          if (err) {
            console.warn("Gagal menghapus file gambar:", err.message);
          }
        });
      }

      await quizModel.deleteQuestion(id);
      res.json({ message: "Soal berhasil dihapus" });
    } catch (error) {
      console.error("Delete question error:", error);
      res
        .status(500)
        .json({ message: "Gagal menghapus soal", error: error.message });
    }
  },
};

export default QuizController;
