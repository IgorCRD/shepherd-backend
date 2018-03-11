import authentication from 'controllers/user-controller';
import repo from 'controllers/repo-controller';

const configRouter = (rootRouter) => {
  rootRouter.use('/user', authentication);
  rootRouter.use('/repos', repo);
};

export default configRouter;
