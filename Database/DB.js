import { Sequelize } from "sequelize";
import { config } from "dotenv";

config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql", // Using mysql dialect for compatibility with your mysql2 setup
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10, // Matches your connectionLimit
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);
