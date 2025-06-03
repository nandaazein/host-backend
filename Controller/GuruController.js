import teacherModel from '../Models/GuruModel.js';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const teacherController = {
  async register(req, res) {
    try {
      const { nip, fullName, school, password, confirmPassword } = req.body;

      if (!nip || !fullName || !school || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Kata sandi tidak cocok' });
      }

      const existingTeacher = await teacherModel.findByNIP(nip);
      if (existingTeacher) {
        return res.status(400).json({ message: 'NIP sudah terdaftar' });
      }

      await teacherModel.create({ nip, fullName, school, password });

      res.status(201).json({ message: 'Guru berhasil terdaftar' });
    } catch (error) {
      console.error("Register teacher error:", error);
      res.status(500).json({ message: 'Kesalahan server', error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { nip, password } = req.body;

      if (!nip || !password) {
        return res.status(400).json({ message: 'NIP dan kata sandi wajib diisi' });
      }

      const teacher = await teacherModel.login(nip, password);
      if (!teacher) {
        return res.status(400).json({ message: 'Kredensial tidak valid' });
      }

      const token = jwt.sign(
        { id: teacher.id, role: teacher.role, nip: teacher.nip },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: teacher.id,
          nip: teacher.nip,
          fullName: teacher.full_name,
          school: teacher.school,
          role: teacher.role
        }
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: 'Kesalahan server', error: error.message });
    }
  },

  async logout(req, res) {
    try {
      res.status(200).json({ message: 'Logout berhasil' });
    } catch (error) {
      console.error("Teacher logout error:", error);
      res.status(500).json({ message: 'Kesalahan server', error: error.message });
    }
  }
};

export default teacherController;