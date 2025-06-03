import sessionModel from '../Models/SessionModel.js';
import cron from 'node-cron';
import pool from '../Database/DB.js';

// Jalankan setiap hari jam 3 pagi
const cleanupJob = cron.schedule('0 3 * * *', async () => {
  try {
    const [result] = await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    console.log(`Session cleaner: ${result.affectedRows} session kadaluarsa dihapus`);
  } catch (error) {
    console.error('Error session cleaner:', error);
  }
});

// Jalankan juga saat server start
(async () => {
  try {
    const [result] = await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
    console.log(`Startup cleanup: ${result.affectedRows} session kadaluarsa dihapus`);
  } catch (error) {
    console.error('Error startup session cleanup:', error);
  }
})();

export default cleanupJob;