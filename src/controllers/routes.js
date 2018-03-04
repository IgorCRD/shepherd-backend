import authentication from 'controllers/authentication';

const routes = (rootRouter = null) => {
  rootRouter.use('/authentication', authentication);
};

export default routes;
