import pool from '../Database/DB.js';
import crypto from 'crypto';

const sessionModel = {
  async create(userId, role) {
    const sessionId = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
    
    await pool.query(
      'INSERT INTO sessions (id, user_id, user_role, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, userId, role, expiresAt]
    );
    
    return sessionId;
  },

  async findById(sessionId) {
    const [rows] = await pool.query(
      `SELECT s.user_id, s.user_role, s.expires_at, 
       IF(s.user_role = 'student', st.nis, t.nip) AS identifier
       FROM sessions s
       LEFT JOIN students st ON s.user_role = 'student' AND s.user_id = st.id
       LEFT JOIN teachers t ON s.user_role = 'teacher' AND s.user_id = t.id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [sessionId]
    );
    
    if (rows[0]) {
      return {
        userId: rows[0].user_id,
        role: rows[0].user_role,
        expiresAt: rows[0].expires_at,
        identifier: rows[0].identifier
      };
    }
    return null;
  },


  async delete(sessionId) {
    await pool.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
  },

  async deleteExpiredSessions() {
    await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  },

  async deleteByUserId(userId) {
    await pool.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
  }
};

export default sessionModel;