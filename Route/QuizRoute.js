import express from 'express';
import QuizController from '../Controller/QuizController.js'; // Sesuaikan path jika perlu
import { verifyToken, restrictTo } from '../Middleware/Auth.js';

const router = express.Router();

// Rute untuk operasi kuis (soal)
router.post('/questions', verifyToken, restrictTo('teacher'), QuizController.createQuestion);
router.get('/questions', verifyToken, QuizController.getQuestions);
router.get('/questions/:id', verifyToken, QuizController.getQuestionById);
router.put('/questions/:id', verifyToken, restrictTo('teacher'), QuizController.updateQuestion);
router.delete('/questions/:id', verifyToken, restrictTo('teacher'), QuizController.deleteQuestion);

export default router;