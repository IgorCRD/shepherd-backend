import authentication from 'controllers/authentication';

const configRouter = (rootRouter) => {
  rootRouter.use('/authentication', authentication);
};

export default configRouter;
