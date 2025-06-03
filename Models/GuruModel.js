import { DataTypes } from "sequelize";
import { sequelize } from "../Database/DB.js";
import bcrypt from "bcryptjs";

export const Teacher = sequelize.define(
  "Teacher",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nip: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    school: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "teacher",
    },
  },
  {
    tableName: "teachers",
    timestamps: true,
  }
);

const teacherModel = {
  async findByNIP(nip) {
    return await Teacher.findOne({ where: { nip } });
  },

  async create({ nip, fullName, school, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await Teacher.create({
      nip,
      full_name: fullName,
      school,
      password: hashedPassword,
      role: "teacher",
    });
  },

  async login(nip, password) {
    const teacher = await this.findByNIP(nip);
    if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
      return null;
    }
    return {
      id: teacher.id,
      nip: teacher.nip,
      full_name: teacher.full_name,
      school: teacher.school,
      role: teacher.role,
    };
  },
};

export default teacherModel;
