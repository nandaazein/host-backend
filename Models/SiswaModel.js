import pool from "../Database/DB.js";
import bcrypt from "bcryptjs";

const studentModel = {
  async findByNIS(nis) {
    const [rows] = await pool.query("SELECT * FROM students WHERE nis = ?", [
      nis,
    ]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  async register({ nis, name, className, password, confirmPassword, token }) {
    if (password !== confirmPassword) {
      throw new Error("Kata sandi tidak cocok");
    }
    if (token !== "123") {
      throw new Error("Token tidak valid");
    }
    const existingStudent = await studentModel.findByNIS(nis);
    if (existingStudent) {
      throw new Error("NIS sudah terdaftar");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const status = "BELUM SELESAI";
    const progress = 0;
    const role = "student";
    await pool.query(
      "INSERT INTO students (nis, full_name, class, password, status, progress, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nis, name, className, hashedPassword, status, progress, role]
    );
  },

  async login(nis, password) {
    const student = await studentModel.findByNIS(nis);
    if (!student || !(await bcrypt.compare(password, student.password))) {
      return null;
    }
    return {
      id: student.id,
      nis: student.nis,
      full_name: student.full_name,
      class: student.class,
      role: student.role,
      progress: student.progress,
    };
  },

  async getAllStudents() {
    try {
      const [rows] = await pool.query(
        "SELECT nis, full_name, class, status, progress FROM students"
      );
      return rows;
    } catch (error) {
      console.error("Error in getAllStudents:", error);
      throw error;
    }
  },

  async getClasses() {
    const [rows] = await pool.query(
      "SELECT DISTINCT class FROM students ORDER BY class"
    );
    return rows.map((row) => row.class);
  },

  async updateProgress(nis, progress) {
    if (isNaN(progress) || progress < 0) {
      throw new Error("Progres tidak valid (harus angka positif)");
    }

    const [currentRows] = await pool.query(
      "SELECT progress FROM students WHERE nis = ?",
      [nis]
    );
    if (!currentRows[0]) {
      throw new Error("Siswa tidak ditemukan");
    }
    const currentProgress = currentRows[0].progress || 0;
    const newProgress = currentProgress + progress;
    const finalProgress = Math.min(newProgress, 100);
    const status = finalProgress >= 100 ? "SELESAI" : "BELUM SELESAI";

    await pool.query(
      "UPDATE students SET progress = ?, status = ? WHERE nis = ?",
      [finalProgress, status, nis]
    );

    const [rows] = await pool.query(
      "SELECT nis, full_name, class, status, progress FROM students WHERE nis = ?",
      [nis]
    );
    return rows[0];
  },

  async updateStudent(nis, { full_name, class: className }) {
    await pool.query(
      "UPDATE students SET full_name = ?, class = ? WHERE nis = ?",
      [full_name, className, nis]
    );
    const [rows] = await pool.query(
      "SELECT nis, full_name, class, status, progress FROM students WHERE nis = ?",
      [nis]
    );
    return rows[0];
  },

  async getProgress(nis) {
    const [rows] = await pool.query(
      "SELECT progress FROM students WHERE nis = ?",
      [nis]
    );
    return rows[0] ? rows[0] : { progress: 0 };
  },

  async deleteStudent(nis) {
    const student = await studentModel.findByNIS(nis);
    if (!student) {
      throw new Error("Siswa tidak ditemukan");
    }
    await pool.query("DELETE FROM students WHERE nis = ?", [nis]);
  },

  async submitScore(nis, scores) {
    const {
      kuis1,
      kuis2,
      kuis3,
      kuis4,
      latihan1,
      latihan2,
      latihan3,
      latihan4,
      evaluasi_akhir,
    } = scores;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Log quiz attempt if kuis1-4 is provided
      if (kuis1 !== undefined) {
        await connection.query(
          "INSERT INTO quiz_attempts (nis, quiz_number, score) VALUES (?, ?, ?)",
          [nis, 1, kuis1]
        );
      }
      if (kuis2 !== undefined) {
        await connection.query(
          "INSERT INTO quiz_attempts (nis, quiz_number, score) VALUES (?, ?, ?)",
          [nis, 2, kuis2]
        );
      }
      if (kuis3 !== undefined) {
        await connection.query(
          "INSERT INTO quiz_attempts (nis, quiz_number, score) VALUES (?, ?, ?)",
          [nis, 3, kuis3]
        );
      }
      if (kuis4 !== undefined) {
        await connection.query(
          "INSERT INTO quiz_attempts (nis, quiz_number, score) VALUES (?, ?, ?)",
          [nis, 4, kuis4]
        );
      }

      // Ambil data skor saat ini dan status kuis
      const [scoreRows] = await connection.query(
        "SELECT kuis1, kuis2, kuis3, kuis4 FROM scores WHERE nis = ?",
        [nis]
      );
      const [studentRows] = await connection.query(
        "SELECT progress, quiz1_completed, quiz2_completed, quiz3_completed, quiz4_completed FROM students WHERE nis = ?",
        [nis]
      );

      if (!studentRows[0]) {
        throw new Error("Siswa tidak ditemukan");
      }

      const currentScores = scoreRows[0] || {};
      const currentProgress = studentRows[0].progress || 0;
      const quizCompleted = {
        1: studentRows[0].quiz1_completed || 0,
        2: studentRows[0].quiz2_completed || 0,
        3: studentRows[0].quiz3_completed || 0,
        4: studentRows[0].quiz4_completed || 0,
      };

      // Ambil KKM untuk kuis 1-4
      const [kkmRows] = await connection.query(
        "SELECT quiz_number, kkm FROM kkm_settings WHERE quiz_number IN (1, 2, 3, 4)"
      );
      const kkmMap = kkmRows.reduce(
        (acc, row) => {
          acc[row.quiz_number] = row.kkm;
          return acc;
        },
        { 1: 70, 2: 70, 3: 70, 4: 70 }
      );

      // Tentukan skor baru (ambil yang tertinggi) dan periksa progres
      const newScores = {
        kuis1:
          kuis1 !== undefined
            ? Math.max(kuis1, currentScores.kuis1 || 0)
            : currentScores.kuis1,
        kuis2:
          kuis2 !== undefined
            ? Math.max(kuis2, currentScores.kuis2 || 0)
            : currentScores.kuis2,
        kuis3:
          kuis3 !== undefined
            ? Math.max(kuis3, currentScores.kuis3 || 0)
            : currentScores.kuis3,
        kuis4:
          kuis4 !== undefined
            ? Math.max(kuis4, currentScores.kuis4 || 0)
            : currentScores.kuis4,
        latihan1,
        latihan2,
        latihan3,
        latihan4,
        evaluasi_akhir,
      };

      let progressToAdd = 0;
      const quizUpdates = {};

      // Periksa setiap kuis untuk progres
      for (let i = 1; i <= 4; i++) {
        const scoreKey = `kuis${i}`;
        const completedKey = `quiz${i}_completed`;
        const newScore = newScores[scoreKey];
        if (
          newScore !== undefined &&
          newScore >= kkmMap[i] &&
          quizCompleted[i] === 0
        ) {
          progressToAdd += 20;
          quizUpdates[completedKey] = 1;
        }
      }

      // Perbarui skor di tabel scores
      if (scoreRows[0]) {
        await connection.query(
          `UPDATE scores 
           SET kuis1 = COALESCE(?, kuis1), 
               kuis2 = COALESCE(?, kuis2), 
               kuis3 = COALESCE(?, kuis3), 
               kuis4 = COALESCE(?, kuis4), 
               latihan1 = COALESCE(?, latihan1), 
               latihan2 = COALESCE(?, latihan2), 
               latihan3 = COALESCE(?, latihan3), 
               latihan4 = COALESCE(?, latihan4), 
               evaluasi_akhir = COALESCE(?, evaluasi_akhir),
               updated_at = CURRENT_TIMESTAMP
           WHERE nis = ?`,
          [
            newScores.kuis1,
            newScores.kuis2,
            newScores.kuis3,
            newScores.kuis4,
            newScores.latihan1,
            newScores.latihan2,
            newScores.latihan3,
            newScores.latihan4,
            newScores.evaluasi_akhir,
            nis,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO scores (nis, kuis1, kuis2, kuis3, kuis4, latihan1, latihan2, latihan3, latihan4, evaluasi_akhir)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nis,
            newScores.kuis1,
            newScores.kuis2,
            newScores.kuis3,
            newScores.kuis4,
            newScores.latihan1,
            newScores.latihan2,
            newScores.latihan3,
            newScores.latihan4,
            newScores.evaluasi_akhir,
          ]
        );
      }

      // Perbarui progres dan status kuis di tabel students
      if (progressToAdd > 0) {
        const newProgress = Math.min(currentProgress + progressToAdd, 100);
        const status = newProgress >= 100 ? "SELESAI" : "BELUM SELESAI";
        let updateQuery = "UPDATE students SET progress = ?, status = ?";
        const queryParams = [newProgress, status];

        Object.keys(quizUpdates).forEach((key, index) => {
          updateQuery += `, ${key} = ?`;
          queryParams.push(quizUpdates[key]);
        });

        updateQuery += " WHERE nis = ?";
        queryParams.push(nis);

        await connection.query(updateQuery, queryParams);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async submitEvaluationScore(nis, score) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current score and progress
      const [scoreRows] = await connection.query(
        "SELECT evaluasi_akhir FROM scores WHERE nis = ?",
        [nis]
      );
      const [studentRows] = await connection.query(
        "SELECT progress, evaluation_completed FROM students WHERE nis = ?",
        [nis]
      );

      if (!studentRows[0]) {
        throw new Error("Siswa tidak ditemukan");
      }

      const currentScore = scoreRows[0]?.evaluasi_akhir || 0;
      const currentProgress = studentRows[0].progress || 0;
      const evaluationCompleted = studentRows[0].evaluation_completed || 0;

      // Store the highest score
      if (score > currentScore || !scoreRows[0]) {
        if (scoreRows[0]) {
          await connection.query(
            "UPDATE scores SET evaluasi_akhir = ?, updated_at = CURRENT_TIMESTAMP WHERE nis = ?",
            [score, nis]
          );
        } else {
          await connection.query(
            "INSERT INTO scores (nis, evaluasi_akhir) VALUES (?, ?)",
            [nis, score]
          );
        }
      }

      // Get KKM for quiz 5
      const [kkmRows] = await connection.query(
        "SELECT kkm FROM kkm_settings WHERE quiz_number = ?",
        [5]
      );
      const kkm = kkmRows[0]?.kkm || 75;

      // Update progress if score >= KKM and not previously completed
      if (score >= kkm && evaluationCompleted === 0) {
        const newProgress = Math.min(currentProgress + 20, 100);
        const status = newProgress >= 100 ? "SELESAI" : "BELUM SELESAI";
        await connection.query(
          "UPDATE students SET progress = ?, status = ?, evaluation_completed = 1 WHERE nis = ?",
          [newProgress, status, nis]
        );
      }

      await connection.commit();
      return { score: Math.max(score, currentScore), kkm };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getScores(nis) {
    try {
      const [scoreRows] = await pool.query(
        "SELECT nis, kuis1, kuis2, kuis3, kuis4, latihan1, latihan2, latihan3, latihan4, evaluasi_akhir, created_at, updated_at FROM scores WHERE nis = ?",
        [nis]
      );
      const [kkmRows] = await pool.query(
        "SELECT quiz_number, kkm FROM kkm_settings WHERE quiz_number IN (1, 2, 3, 4, 5)"
      );
      const kkmMap = kkmRows.reduce(
        (acc, row) => {
          if (row.quiz_number === 5) {
            acc["evaluasi_akhir"] = row.kkm;
          } else {
            acc[`kuis${row.quiz_number}`] = row.kkm;
          }
          return acc;
        },
        { kuis1: 75, kuis2: 75, kuis3: 75, kuis4: 75, evaluasi_akhir: 75 }
      );
      const scores = scoreRows[0] || {};
      return { ...scores, kkm: kkmMap };
    } catch (error) {
      console.error("Error in getScores:", error);
      throw new Error("Gagal mengambil skor siswa");
    }
  },

  async getQuizAttempts(nis) {
    try {
      const [rows] = await pool.query(
        `SELECT qa.quiz_number, qa.score, qa.attempt_time, k.kkm
         FROM quiz_attempts qa
         LEFT JOIN kkm_settings k ON qa.quiz_number = k.quiz_number
         WHERE qa.nis = ?
         ORDER BY qa.attempt_time DESC`,
        [nis]
      );
      return rows.map((row) => ({
        quizNumber: row.quiz_number,
        score: row.score || 0,
        attemptTime: row.attempt_time,
        kkm: row.kkm || 75,
      }));
    } catch (error) {
      console.error("Error in getQuizAttempts:", error);
      throw new Error("Gagal mengambil riwayat kuis");
    }
  },

  async getAllScores() {
    try {
      const [rows] = await pool.query(
        "SELECT st.nis, st.full_name, st.class, s.latihan1, s.latihan2, s.latihan3, s.latihan4, s.kuis1, s.kuis2, s.kuis3, s.kuis4, s.evaluasi_akhir FROM students st LEFT JOIN scores s ON st.nis = s.nis"
      );
      const [kkmRows] = await pool.query(
        "SELECT quiz_number, kkm FROM kkm_settings WHERE quiz_number IN (1, 2, 3, 4, 5)"
      );
      const kkmMap = kkmRows.reduce(
        (acc, row) => {
          if (row.quiz_number === 5) {
            acc["evaluasi_akhir"] = row.kkm;
          } else {
            acc[`kuis${row.quiz_number}`] = row.kkm;
          }
          return acc;
        },
        { kuis1: 75, kuis2: 75, kuis3: 75, kuis4: 75, evaluasi_akhir: 75 }
      );
      return rows.map((row) => ({ ...row, kkm: kkmMap }));
    } catch (error) {
      console.error("Error in getAllScores:", error);
      throw new Error("Gagal mengambil semua skor");
    }
  },

  async getDashboardData(className) {
    try {
      const queryParams =
        className && className !== "Semua kelas" ? [className] : [];
      const classFilter =
        className && className !== "Semua kelas" ? "WHERE st.class = ?" : "";

      // Total Students
      const [totalStudentsRows] = await pool.query(
        `SELECT COUNT(*) as total FROM students st ${classFilter}`,
        queryParams
      );
      const totalStudents = totalStudentsRows[0].total || 0;

      // Completed Students
      const [completedStudentsRows] = await pool.query(
        `SELECT COUNT(*) as completed FROM students st ${classFilter} ${
          classFilter ? "AND" : "WHERE"
        } st.progress >= 100`,
        queryParams
      );
      const completedStudents = completedStudentsRows[0].completed || 0;

      // Average Scores
      const [avgScoresRows] = await pool.query(
        `SELECT 
          AVG(s.kuis1) as kuis1,
          AVG(s.kuis2) as kuis2,
          AVG(s.kuis3) as kuis3,
          AVG(s.kuis4) as kuis4,
          AVG(s.evaluasi_akhir) as evaluasi
        FROM students st
        LEFT JOIN scores s ON st.nis = s.nis
        ${classFilter}`,
        queryParams
      );
      const averageScores = {
        kuis1: Math.round(avgScoresRows[0].kuis1 || 0),
        kuis2: Math.round(avgScoresRows[0].kuis2 || 0),
        kuis3: Math.round(avgScoresRows[0].kuis3 || 0),
        kuis4: Math.round(avgScoresRows[0].kuis4 || 0),
        evaluasi: Math.round(avgScoresRows[0].evaluasi || 0),
      };

      // Highest Scores
      const [highestScoresRows] = await pool.query(
        `SELECT 
          MAX(s.kuis1) as kuis1, 
          MAX(s.kuis2) as kuis2, 
          MAX(s.kuis3) as kuis3, 
          MAX(s.kuis4) as kuis4, 
          MAX(s.evaluasi_akhir) as evaluasi_akhir,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis1 = MAX(s.kuis1) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis1_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis2 = MAX(s.kuis2) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis2_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis3 = MAX(s.kuis3) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis3_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis4 = MAX(s.kuis4) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis4_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.evaluasi_akhir = MAX(s.evaluasi_akhir) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as evaluasi_student
        FROM students st
        LEFT JOIN scores s ON st.nis = s.nis
        ${classFilter}`,
        className && className !== "Semua kelas"
          ? [className, className, className, className, className]
          : []
      );
      const highestScores = highestScoresRows[0]
        ? {
            kuis1: {
              student: highestScoresRows[0].kuis1_student || "N/A",
              score: highestScoresRows[0].kuis1 || 0,
            },
            kuis2: {
              student: highestScoresRows[0].kuis2_student || "N/A",
              score: highestScoresRows[0].kuis2 || 0,
            },
            kuis3: {
              student: highestScoresRows[0].kuis3_student || "N/A",
              score: highestScoresRows[0].kuis3 || 0,
            },
            kuis4: {
              student: highestScoresRows[0].kuis4_student || "N/A",
              score: highestScoresRows[0].kuis4 || 0,
            },
            evaluasi: {
              student: highestScoresRows[0].evaluasi_student || "N/A",
              score: highestScoresRows[0].evaluasi_akhir || 0,
            },
          }
        : {
            kuis1: { student: "N/A", score: 0 },
            kuis2: { student: "N/A", score: 0 },
            kuis3: { student: "N/A", score: 0 },
            kuis4: { student: "N/A", score: 0 },
            evaluasi: { student: "N/A", score: 0 },
          };

      // Lowest Scores
      const [lowestScoresRows] = await pool.query(
        `SELECT 
          MIN(s.kuis1) as kuis1, 
          MIN(s.kuis2) as kuis2,
          MIN(s.kuis3) as kuis3,
          MIN(s.kuis4) as kuis4,
          MIN(s.evaluasi_akhir) as evaluasi_akhir,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis1 = MIN(s.kuis1) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis1_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis2 = MIN(s.kuis2) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis2_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis3 = MIN(s.kuis3) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis3_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.kuis4 = MIN(s.kuis4) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as kuis4_student,
          (SELECT st2.full_name FROM students st2 JOIN scores s2 ON st2.nis = s2.nis WHERE s2.evaluasi_akhir = MIN(s.evaluasi_akhir) ${
            classFilter ? "AND st2.class = ?" : ""
          } LIMIT 1) as evaluasi_student
        FROM students st
        LEFT JOIN scores s ON st.nis = s.nis
        ${classFilter}`,
        className && className !== "Semua kelas"
          ? [className, className, className, className, className]
          : []
      );
      const lowestScores = lowestScoresRows[0]
        ? {
            kuis1: {
              student: lowestScoresRows[0].kuis1_student || "N/A",
              score: lowestScoresRows[0].kuis1 || 0,
            },
            kuis2: {
              student: lowestScoresRows[0].kuis2_student || "N/A",
              score: lowestScoresRows[0].kuis2 || 0,
            },
            kuis3: {
              student: lowestScoresRows[0].kuis3_student || "N/A",
              score: lowestScoresRows[0].kuis3 || 0,
            },
            kuis4: {
              student: lowestScoresRows[0].kuis4_student || "N/A",
              score: lowestScoresRows[0].kuis4 || 0,
            },
            evaluasi: {
              student: lowestScoresRows[0].evaluasi_student || "N/A",
              score: lowestScoresRows[0].evaluasi_akhir || 0,
            },
          }
        : {
            kuis1: { student: "N/A", score: 0 },
            kuis2: { student: "N/A", score: 0 },
            kuis3: { student: "N/A", score: 0 },
            kuis4: { student: "N/A", score: 0 },
            evaluasi: { student: "N/A", score: 0 },
          };

      return {
        totalStudents,
        completedStudents,
        averageScores,
        highestScores,
        lowestScores,
      };
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      throw new Error("Gagal mengambil data dashboard");
    }
  },
};

export default studentModel;
