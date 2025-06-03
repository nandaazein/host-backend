import express from 'express';
import kkmController from '../Controller/KkmController.js';
import { verifyToken, restrictTo } from '../Middleware/Auth.js';

const router = express.Router();

router.get('/', verifyToken, restrictTo('teacher'), kkmController.getKKMSettings);
router.put('/', verifyToken, restrictTo('teacher'), kkmController.updateKKMSettings);
router.get('/:quizNumber', verifyToken, kkmController.getKKMByQuizNumber);

export default router;