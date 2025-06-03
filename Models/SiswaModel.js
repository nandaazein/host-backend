import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../Database/DB.js";
import bcrypt from "bcryptjs";

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nis: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "BELUM SELESAI",
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Fixed: Removed single quote
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "student",
    },
    quiz1_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    quiz2_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    quiz3_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    quiz4_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    evaluation_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "students",
    timestamps: true,
  }
);

const Score = sequelize.define(
  "Score",
  {
    nis: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kuis1: {
      type: DataTypes.INTEGER,
    },
    kuis2: {
      type: DataTypes.INTEGER,
    },
    kuis3: {
      type: DataTypes.INTEGER,
    },
    kuis4: {
      type: DataTypes.INTEGER, // Fixed: Changed from DataTypes: INTEGER
    },
    latihan1: {
      type: DataTypes.INTEGER,
    },
    latihan2: {
      type: DataTypes.INTEGER,
    },
    latihan3: {
      type: DataTypes.INTEGER,
    },
    latihan4: {
      type: DataTypes.INTEGER,
    },
    evaluasi_akhir: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "scores",
    timestamps: true,
  }
);

const QuizAttempt = sequelize.define(
  "QuizAttempt",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nis: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quiz_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attempt_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "quiz_attempts",
    timestamps: false,
  }
);

const KKMSetting = sequelize.define(
  "KKMSetting",
  {
    quiz_number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    kkm: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "kkm_settings",
    timestamps: true,
  }
);

Student.hasOne(Score, { foreignKey: "nis", sourceKey: "nis" });
Score.belongsTo(Student, { foreignKey: "nis", targetKey: "nis" });
Student.hasMany(QuizAttempt, { foreignKey: "nis", sourceKey: "nis" });
QuizAttempt.belongsTo(Student, { foreignKey: "nis", targetKey: "nis" });

const studentModel = {
  async findByNIS(nis) {
    return await Student.findOne({ where: { nis } });
  },

  async findById(id) {
    return await Student.findByPk(id);
  },

  async register({ nis, name, className, password, confirmPassword, token }) {
    if (password !== confirmPassword) {
      throw new Error("Kata sandi tidak cocok");
    }
    if (token !== "123") {
      throw new Error("Token tidak valid");
    }
    const existingStudent = await this.findByNIS(nis);
    if (existingStudent) {
      throw new Error("NIS sudah terdaftar");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await Student.create({
      nis,
      full_name: name,
      class: className,
      password: hashedPassword,
      status: "BELUM SELESAI",
      progress: 0,
      role: "student",
    });
  },

  async login(nis, password) {
    const student = await this.findByNIS(nis);
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
      return await Student.findAll({
        attributes: ["nis", "full_name", "class", "status", "progress"],
      });
    } catch (error) {
      console.error("Error in getAllStudents:", error);
      throw error;
    }
  },

  async getClasses() {
    const students = await Student.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("class")), "class"]],
      order: [["class", "ASC"]],
    });
    return students.map((row) => row.class);
  },

  async updateProgress(nis, progress) {
    if (isNaN(progress) || progress < 0) {
      throw new Error("Progres tidak valid (harus angka positif)");
    }
    const student = await Student.findOne({ where: { nis } });
    if (!student) {
      throw new Error("Siswa tidak ditemukan");
    }
    const currentProgress = student.progress || 0;
    const newProgress = Math.min(currentProgress + progress, 100);
    const status = newProgress >= 100 ? "SELESAI" : "BELUM SELESAI";
    await student.update({ progress: newProgress, status });
    return await Student.findOne({
      where: { nis },
      attributes: ["nis", "full_name", "class", "status", "progress"],
    });
  },

  async updateStudent(nis, { full_name, class: className }) {
    await Student.update({ full_name, class: className }, { where: { nis } });
    return await Student.findOne({
      where: { nis },
      attributes: ["nis", "full_name", "class", "status", "progress"],
    });
  },

  async getProgress(nis) {
    const student = await Student.findOne({
      where: { nis },
      attributes: ["progress"],
    });
    return student || { progress: 0 };
  },

  async deleteStudent(nis) {
    const student = await this.findByNIS(nis);
    if (!student) {
      throw new Error("Siswa tidak ditemukan");
    }
    await Student.destroy({ where: { nis } });
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

    const transaction = await sequelize.transaction();
    try {
      const student = await Student.findOne({ where: { nis }, transaction });
      if (!student) {
        throw new Error("Siswa tidak ditemukan");
      }

      if (kuis1 !== undefined) {
        await QuizAttempt.create(
          { nis, quiz_number: 1, score: kuis1 },
          { transaction }
        );
      }
      if (kuis2 !== undefined) {
        await QuizAttempt.create(
          { nis, quiz_number: 2, score: kuis2 },
          { transaction }
        );
      }
      if (kuis3 !== undefined) {
        await QuizAttempt.create(
          { nis, quiz_number: 3, score: kuis3 },
          { transaction }
        );
      }
      if (kuis4 !== undefined) {
        await QuizAttempt.create(
          { nis, quiz_number: 4, score: kuis4 },
          { transaction }
        );
      }

      const currentScore = await Score.findOne({ where: { nis }, transaction });
      const kkmSettings = await KKMSetting.findAll({
        where: { quiz_number: [1, 2, 3, 4] },
        transaction,
      });
      const kkmMap = kkmSettings.reduce(
        (acc, row) => {
          acc[row.quiz_number] = row.kkm;
          return acc;
        },
        { 1: 70, 2: 70, 3: 70, 4: 70 }
      );

      const newScores = {
        kuis1:
          kuis1 !== undefined
            ? Math.max(kuis1, currentScore?.kuis1 || 0)
            : currentScore?.kuis1,
        kuis2:
          kuis2 !== undefined
            ? Math.max(kuis2, currentScore?.kuis2 || 0)
            : currentScore?.kuis2,
        kuis3:
          kuis3 !== undefined
            ? Math.max(kuis3, currentScore?.kuis3 || 0)
            : currentScore?.kuis3,
        kuis4:
          kuis4 !== undefined
            ? Math.max(kuis4, currentScore?.kuis4 || 0)
            : currentScore?.kuis4,
        latihan1,
        latihan2,
        latihan3,
        latihan4,
        evaluasi_akhir,
      };

      let progressToAdd = 0;
      const quizUpdates = {};
      for (let i = 1; i <= 4; i++) {
        const scoreKey = `kuis${i}`;
        const completedKey = `quiz${i}_completed`;
        const newScore = newScores[scoreKey];
        if (
          newScore !== undefined &&
          newScore >= kkmMap[i] &&
          student[completedKey] === 0
        ) {
          progressToAdd += 20;
          quizUpdates[completedKey] = 1;
        }
      }

      if (currentScore) {
        await currentScore.update(newScores, { transaction });
      } else {
        await Score.create({ nis, ...newScores }, { transaction });
      }

      if (progressToAdd > 0) {
        const newProgress = Math.min(student.progress + progressToAdd, 100);
        const status = newProgress >= 100 ? "SELESAI" : "BELUM SELESAI";
        await student.update(
          { progress: newProgress, status, ...quizUpdates },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async submitEvaluationScore(nis, score) {
    const transaction = await sequelize.transaction();
    try {
      const student = await Student.findOne({ where: { nis }, transaction });
      if (!student) {
        throw new Error("Siswa tidak ditemukan");
      }

      const currentScore = await Score.findOne({ where: { nis }, transaction });
      const kkmSetting = await KKMSetting.findOne({
        where: { quiz_number: 5 },
        transaction,
      });
      const kkm = kkmSetting?.kkm || 75;

      if (score > (currentScore?.evaluasi_akhir || 0)) {
        if (currentScore) {
          await currentScore.update({ evaluasi_akhir: score }, { transaction });
        } else {
          await Score.create({ nis, evaluasi_akhir: score }, { transaction });
        }
      }

      if (score >= kkm && student.evaluation_completed === 0) {
        const newProgress = Math.min(student.progress + 20, 100);
        const status = newProgress >= 100 ? "SELESAI" : "BELUM SELESAI";
        await student.update(
          { progress: newProgress, status, evaluation_completed: 1 },
          { transaction }
        );
      }

      await transaction.commit();
      return { score: Math.max(score, currentScore?.evaluasi_akhir || 0), kkm };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getScores(nis) {
    try {
      const score = await Score.findOne({ where: { nis } });
      const kkmSettings = await KKMSetting.findAll({
        where: { quiz_number: [1, 2, 3, 4, 5] },
      });
      const kkmMap = kkmSettings.reduce(
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
      return { ...score?.dataValues, kkm: kkmMap };
    } catch (error) {
      console.error("Error in getScores:", error);
      throw new Error("Gagal mengambil skor siswa");
    }
  },

  async getQuizAttempts(nis) {
    try {
      const attempts = await QuizAttempt.findAll({
        where: { nis },
        include: [
          {
            model: KKMSetting,
            attributes: ["kkm"],
            where: { quiz_number: sequelize.col("QuizAttempt.quiz_number") },
            required: false,
          },
        ],
        order: [["attempt_time", "DESC"]],
      });
      return attempts.map((row) => ({
        quizNumber: row.quiz_number,
        score: row.score || 0,
        attemptTime: row.attempt_time,
        kkm: row.KKMSetting?.kkm || 75,
      }));
    } catch (error) {
      console.error("Error in getQuizAttempts:", error);
      throw new Error("Gagal mengambil riwayat kuis");
    }
  },

  async getAllScores() {
    try {
      const students = await Student.findAll({
        include: [{ model: Score, required: false }],
        attributes: ["nis", "full_name", "class"],
      });
      const kkmSettings = await KKMSetting.findAll({
        where: { quiz_number: [1, 2, 3, 4, 5] },
      });
      const kkmMap = kkmSettings.reduce(
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
      return students.map((student) => ({
        nis: student.nis,
        full_name: student.full_name,
        class: student.class,
        latihan1: student.Score?.latihan1 || 0,
        latihan2: student.Score?.latihan2 || 0,
        latihan3: student.Score?.latihan3 || 0,
        latihan4: student.Score?.latihan4 || 0,
        kuis1: student.Score?.kuis1 || 0,
        kuis2: student.Score?.kuis2 || 0,
        kuis3: student.Score?.kuis3 || 0,
        kuis4: student.Score?.kuis4 || 0,
        evaluasi_akhir: student.Score?.evaluasi_akhir || 0,
        kkm: kkmMap,
      }));
    } catch (error) {
      console.error("Error in getAllScores:", error);
      throw new Error("Gagal mengambil semua skor");
    }
  },

async getDashboardData(className) {
  try {
    const where = className && className !== 'Semua kelas' ? { class: className } : {};

    // Count total students
    const totalStudents = await Student.count({ where });

    // Count completed students (progress >= 100)
    const completedStudents = await Student.count({
      where: { ...where, progress: { [Sequelize.Op.gte]: 100 } },
    });

    // Calculate average scores
    const avgScores = await Student.findAll({
      where,
      include: [{ model: Score, required: false }],
      attributes: [
        [sequelize.fn('AVG', sequelize.col('Score.kuis1')), 'kuis1'],
        [sequelize.fn('AVG', sequelize.col('Score.kuis2')), 'kuis2'],
        [sequelize.fn('AVG', sequelize.col('Score.kuis3')), 'kuis3'],
        [sequelize.fn('AVG', sequelize.col('Score.kuis4')), 'kuis4'],
        [sequelize.fn('AVG', sequelize.col('Score.evaluasi_akhir')), 'evaluasi'],
      ],
      raw: true,
    });

    const averageScores = {
      kuis1: Math.round(avgScores[0].kuis1 || 0),
      kuis2: Math.round(avgScores[0].kuis2 || 0),
      kuis3: Math.round(avgScores[0].kuis3 || 0),
      kuis4: Math.round(avgScores[0].kuis4 || 0),
      evaluasi: Math.round(avgScores[0].evaluasi || 0),
    };

    // Hardcoded highest and lowest scores (as per frontend)
    const highestScores = {
      kuis1: { student: 'N/A', score: 0 },
      kuis2: { student: 'N/A', score: 0 },
      kuis3: { student: 'N/A', score: 0 },
      kuis4: { student: 'N/A', score: 0 },
      evaluasi: { student: 'N/A', score: 0 },
    };

    const lowestScores = {
      kuis1: { student: 'N/A', score: 0 },
      kuis2: { student: 'N/A', score: 0 },
      kuis3: { student: 'N/A', score: 0 },
      kuis4: { student: 'N/A', score: 0 },
      evaluasi: { student: 'N/A', score: 0 },
    };

    return {
      totalStudents,
      completedStudents,
      averageScores,
      highestScores,
      lowestScores,
    };
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    throw new Error('Gagal mengambil data dashboard');
  }
}
};

export default studentModel;
