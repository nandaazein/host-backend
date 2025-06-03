import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../Database/DB.js";
import crypto from "crypto";
import { Student } from "./SiswaModel.js";
import { Teacher } from "./GuruModel.js";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "sessions",
    timestamps: false,
  }
);

const sessionModel = {
  async create(userId, role) {
    const sessionId = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await Session.create({
      id: sessionId,
      user_id: userId,
      user_role: role,
      expires_at: expiresAt,
    });
    return sessionId;
  },

  async findById(sessionId) {
    const session = await Session.findOne({
      where: {
        id: sessionId,
        expires_at: { [Sequelize.Op.gt]: new Date() },
      },
      include: [
        {
          model: Student,
          attributes: ["nis"],
          required: false,
          where: { id: sequelize.col("Session.user_id") },
        },
        {
          model: Teacher,
          attributes: ["nip"],
          required: false,
          where: { id: sequelize.col("Session.user_id") },
        },
      ],
    });
    if (session) {
      return {
        userId: session.user_id,
        role: session.user_role,
        expiresAt: session.expires_at,
        identifier: session.Student?.nis || session.Teacher?.nip,
      };
    }
    return null;
  },

  async delete(sessionId) {
    await Session.destroy({ where: { id: sessionId } });
  },

  async deleteExpiredSessions() {
    await Session.destroy({
      where: { expires_at: { [Sequelize.Op.lte]: new Date() } },
    });
  },

  async deleteByUserId(userId) {
    await Session.destroy({ where: { user_id: userId } });
  },
};

export default sessionModel;
