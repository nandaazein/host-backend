import express from 'express';
import teacherController from '../Controller/GuruController.js';

const router = express.Router();

router.post('/register', teacherController.register);
router.post('/login', teacherController.login);
router.post('/logout', teacherController.logout);

export default router;