import { Router } from 'express';

import StudentsController from './app/controllers/StudentsController';
import SessionController from './app/controllers/SessionController';
import PlansController from './app/controllers/PlansController';
import EnrollmentsController from './app/controllers/EnrollmentsController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.get('/', (req, res) => {
  res.send('hello world');
});

routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);
// Students routes
routes.post('/students', StudentsController.store);
routes.put('/students/:id', StudentsController.update);
// Plans routes
routes.get('/plans', PlansController.index);
routes.post('/plans', PlansController.store);
routes.put('/plans/:id', PlansController.update);
routes.delete('/plans/:id', PlansController.delete);
// Enrollments routes
routes.get('/enrollments', EnrollmentsController.index);
routes.post('/enrollments', EnrollmentsController.store);
export default routes;
