import { DataTypes } from "sequelize";
import { sequelize } from "../Database/DB.js";

const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quiz_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    correct_answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT("long"), // Maps to MySQL LONGTEXT (4GB)
      allowNull: true,
    },
  },
  {
    tableName: "questions",
    timestamps: false,
  }
);

const quizModel = {
  async createQuestion({
    quizNumber,
    question,
    options,
    correctAnswer,
    imageUrl,
  }) {
    await Question.create({
      quiz_number: quizNumber,
      question_text: question,
      options,
      correct_answer: correctAnswer,
      image_url: imageUrl || null,
    });
  },

  async getQuestions(quizNumber) {
    const questions = await Question.findAll({
      where: { quiz_number: quizNumber },
    });
    return questions.map((row) => ({
      ...row.dataValues,
      options: row.options || ["-", "-", "-", "-"],
    }));
  },

  async getAllQuestions() {
    const questions = await Question.findAll();
    return questions.map((row) => ({
      ...row.dataValues,
      options: row.options || ["-", "-", "-", "-"],
    }));
  },

  async getQuestionById(id) {
    const question = await Question.findByPk(id);
    if (!question) return null;
    return {
      ...question.dataValues,
      options: question.options || ["-", "-", "-", "-"],
    };
  },

  async updateQuestion(
    id,
    { quizNumber, question, options, correctAnswer, imageUrl }
  ) {
    await Question.update(
      {
        quiz_number: quizNumber,
        question_text: question,
        options,
        correct_answer: correctAnswer,
        image_url: imageUrl || null,
      },
      { where: { id } }
    );
  },

  async deleteQuestion(id) {
    try {
      const deleted = await Question.destroy({ where: { id } });
      if (deleted === 0) {
        throw new Error("Soal tidak ditemukan atau sudah dihapus");
      }
    } catch (error) {
      console.error("Error in deleteQuestion:", error);
      throw error;
    }
  },
};

export default quizModel;
