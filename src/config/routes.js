import authentication from 'controllers/authentication';

const routes = (rootRouter) => {
  rootRouter.use('/authentication', authentication);
};

export default routes;
