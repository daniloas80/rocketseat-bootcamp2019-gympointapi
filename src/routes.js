import { Router } from 'express';

import StudentsController from './app/controllers/StudentsController';
import SessionController from './app/controllers/SessionController';
import PlansController from './app/controllers/PlansController';
import EnrollmentsController from './app/controllers/EnrollmentsController';
import CheckinsController from './app/controllers/CheckinsController';
import HelpOrdersController from './app/controllers/HelpOrdersController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.get('/', (req, res) => {
  res.send('hello world');
});

routes.post('/sessions', SessionController.store);
// Checkins routes
routes.post('/students/:id/checkins', CheckinsController.store);
routes.get('/students/:id/checkins', CheckinsController.index);
// HelpOrders routes
routes.get('/students/:id/help-orders', HelpOrdersController.index);
routes.post('/students/:id/help-orders', HelpOrdersController.store);

routes.use(authMiddleware);
// Students routes
routes.get('/students', StudentsController.index);
routes.get('/students/:id/show-student', StudentsController.index);
routes.post('/students', StudentsController.store);
routes.put('/students/:id', StudentsController.update);
routes.delete('/students/:id', StudentsController.delete);
// Plans routes
routes.get('/plans', PlansController.index);
routes.post('/plans', PlansController.store);
routes.put('/plans/:id', PlansController.update);
routes.delete('/plans/:id', PlansController.delete);
// Enrollments routes
routes.get('/enrollments', EnrollmentsController.index);
routes.post('/enrollments', EnrollmentsController.store);
routes.put('/enrollments/:id', EnrollmentsController.update);
routes.delete('/enrollments/:id', EnrollmentsController.delete);
// HelpOrders route - to answer the question, the user must be authenticated.
routes.put('/help-orders/:id/answer', HelpOrdersController.update);

export default routes;
