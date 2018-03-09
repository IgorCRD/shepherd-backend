import authentication from 'controllers/user-controller';

const configRouter = (rootRouter) => {
  rootRouter.use('/user', authentication);
};

export default configRouter;
