import pool from '../Database/DB.js';
import bcrypt from 'bcryptjs';

const teacherModel = {
  async findByNIP(nip) {
    const [rows] = await pool.query('SELECT * FROM teachers WHERE nip = ?', [nip]);
    return rows[0];
  },

  async create({ nip, fullName, school, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'teacher';
    await pool.query(
      'INSERT INTO teachers (nip, full_name, school, password, role) VALUES (?, ?, ?, ?, ?)',
      [nip, fullName, school, hashedPassword, role]
    );
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
      role: teacher.role
    };
  }
};

export default teacherModel;