import pool from '../Database/DB.js';

const quizModel = {
  async createQuestion({ quizNumber, question, options, correctAnswer, imageUrl }) {
    await pool.query(
      'INSERT INTO questions (quiz_number, question_text, options, correct_answer, image_url) VALUES (?, ?, ?, ?, ?)',
      [quizNumber, question, JSON.stringify(options), correctAnswer, imageUrl || null]
    );
  },

  async getQuestions(quizNumber) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE quiz_number = ?', [quizNumber]);
    return rows.map(row => ({
      ...row,
      options: row.options ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options) : ['-', '-', '-', '-']
    }));
  },

  async getAllQuestions() {
    const [rows] = await pool.query('SELECT * FROM questions');
    return rows.map(row => ({
      ...row,
      options: row.options ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options) : ['-', '-', '-', '-']
    }));
  },

  async getQuestionById(id) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      options: row.options ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options) : ['-', '-', '-', '-']
    };
  },

  async updateQuestion(id, { quizNumber, question, options, correctAnswer, imageUrl }) {
    // Hapus validasi panjang imageUrl
    await pool.query(
      'UPDATE questions SET quiz_number = ?, question_text = ?, options = ?, correct_answer = ?, image_url = ? WHERE id = ?',
      [quizNumber, question, JSON.stringify(options), correctAnswer, imageUrl || null, id]
    );
  },

  async deleteQuestion(id) {
  try {
    const [result] = await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Soal tidak ditemukan atau sudah dihapus');
    }
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    throw error; // Lempar error agar ditangkap oleh controller
  }
},


};

export default quizModel;