import kkmModel from "../Models/KkmModel.js";

const kkmController = {
  async getKKMSettings(req, res) {
    try {
      const settings = await kkmModel.getKKMSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get KKM settings error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },

  async updateKKMSettings(req, res) {
    try {
      const { kkmValues } = req.body; // Expect {1: 70, 2: 70, 3: 70, 4: 70, 5: 70}
      if (!kkmValues || typeof kkmValues !== "object") {
        return res
          .status(400)
          .json({ message: "KKM values harus berupa objek" });
      }
      const settings = Object.keys(kkmValues).map((quiz_number) => ({
        quiz_number: parseInt(quiz_number),
        kkm: parseInt(kkmValues[quiz_number]),
      }));
      if (
        settings.length !== 5 ||
        settings.some(
          (s) =>
            isNaN(s.kkm) ||
            s.kkm < 0 ||
            s.kkm > 100 ||
            ![1, 2, 3, 4, 5].includes(s.quiz_number)
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Harus menyertakan KKM valid untuk 4 kuis dan evaluasi akhir",
          });
      }
      await kkmModel.updateKKMSettings(settings);
      res.json({ message: "Pengaturan KKM berhasil diperbarui" });
    } catch (error) {
      console.error("Update KKM settings error:", error);
      res.status(500).json({ message: error.message || "Kesalahan server" });
    }
  },

  async getKKMByQuizNumber(req, res) {
    try {
      const { quizNumber } = req.params;
      const parsedQuizNumber = parseInt(quizNumber);
      if (
        isNaN(parsedQuizNumber) ||
        ![1, 2, 3, 4, 5].includes(parsedQuizNumber)
      ) {
        return res.status(400).json({ message: "Nomor kuis tidak valid" });
      }
      const kkm = await kkmModel.getKKMByQuizNumber(parsedQuizNumber);
      res.json({ quiz_number: parsedQuizNumber, kkm });
    } catch (error) {
      console.error("Get KKM by quiz number error:", error);
      res
        .status(500)
        .json({ message: "Kesalahan server", error: error.message });
    }
  },
};

export default kkmController;
