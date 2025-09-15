import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/', userController.createUser.bind(userController));
router.post('/login', userController.login.bind(userController));

// Protected routes (require authentication)
router.get('/:id', userController.getUserById.bind(userController));

export default router;
