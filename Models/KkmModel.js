import { DataTypes } from "sequelize";
import { sequelize } from "../Database/DB.js";

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

const kkmModel = {
  async getKKMSettings() {
    try {
      const settings = await KKMSetting.findAll({
        order: [["quiz_number", "ASC"]],
      });
      if (settings.length === 0) {
        return [
          { quiz_number: 1, kkm: 75 },
          { quiz_number: 2, kkm: 75 },
          { quiz_number: 3, kkm: 75 },
          { quiz_number: 4, kkm: 75 },
          { quiz_number: 5, kkm: 75 },
        ];
      }
      return settings;
    } catch (error) {
      console.error("Error in getKKMSettings:", error);
      throw new Error("Gagal mengambil pengaturan KKM");
    }
  },

  async updateKKMSettings(settings) {
    const transaction = await sequelize.transaction();
    try {
      for (const setting of settings) {
        const { quiz_number, kkm } = setting;
        if (isNaN(kkm) || kkm < 0 || kkm > 100) {
          throw new Error(`KKM untuk Kuis ${quiz_number} tidak valid (0-100)`);
        }
        if (![1, 2, 3, 4, 5].includes(quiz_number)) {
          throw new Error(`Nomor kuis ${quiz_number} tidak valid`);
        }
        const existing = await KKMSetting.findOne({
          where: { quiz_number },
          transaction,
        });
        if (existing) {
          await existing.update({ kkm }, { transaction });
        } else {
          await KKMSetting.create({ quiz_number, kkm }, { transaction });
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async getKKMByQuizNumber(quizNumber) {
    try {
      const setting = await KKMSetting.findOne({
        where: { quiz_number: quizNumber },
      });
      return setting?.kkm || 75;
    } catch (error) {
      console.error("Error in getKKMByQuizNumber:", error);
      return 75;
    }
  },
};

export default kkmModel;
