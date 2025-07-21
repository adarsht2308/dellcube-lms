import express from 'express';
import { imageProxy } from '../controllers/imageProxyController.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

// All routes here are protected
router.use(isAuthenticated);

router.get('/', imageProxy);

export default router; 