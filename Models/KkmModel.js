import pool from "../Database/DB.js";

const kkmModel = {
  async getKKMSettings() {
    try {
      const [rows] = await pool.query(
        "SELECT quiz_number, kkm FROM kkm_settings ORDER BY quiz_number"
      );
      if (rows.length === 0) {
        // Return default KKM values for quizzes 1-5
        return [
          { quiz_number: 1, kkm: 75 },
          { quiz_number: 2, kkm: 75 },
          { quiz_number: 3, kkm: 75 },
          { quiz_number: 4, kkm: 75 },
          { quiz_number: 5, kkm: 75 },
        ];
      }
      return rows;
    } catch (error) {
      console.error("Error in getKKMSettings:", error);
      throw new Error("Gagal mengambil pengaturan KKM");
    }
  },

  async updateKKMSettings(settings) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const setting of settings) {
        const { quiz_number, kkm } = setting;
        if (isNaN(kkm) || kkm < 0 || kkm > 100) {
          throw new Error(`KKM untuk Kuis ${quiz_number} tidak valid (0-100)`);
        }
        if (![1, 2, 3, 4, 5].includes(quiz_number)) {
          throw new Error(`Nomor kuis ${quiz_number} tidak valid`);
        }
        const [existing] = await connection.query(
          "SELECT id FROM kkm_settings WHERE quiz_number = ?",
          [quiz_number]
        );
        if (existing.length > 0) {
          await connection.query(
            "UPDATE kkm_settings SET kkm = ?, updated_at = CURRENT_TIMESTAMP WHERE quiz_number = ?",
            [kkm, quiz_number]
          );
        } else {
          await connection.query(
            "INSERT INTO kkm_settings (quiz_number, kkm) VALUES (?, ?)",
            [quiz_number, kkm]
          );
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getKKMByQuizNumber(quizNumber) {
    try {
      const [rows] = await pool.query(
        "SELECT kkm FROM kkm_settings WHERE quiz_number = ?",
        [quizNumber]
      );
      return rows[0] ? rows[0].kkm : 75; // Default KKM
    } catch (error) {
      console.error("Error in getKKMByQuizNumber:", error);
      return 75; // Fallback to default
    }
  },
};

export default kkmModel;
