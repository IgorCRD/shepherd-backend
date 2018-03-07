import express from 'express';
import GitHubApi from 'api/github-api';

const authenticationRouter = express.Router({
  mergeParams: true,
});

authenticationRouter.post('/', (req, res) => {
  GitHubApi.getToken(req.body.code)
    .then((tokenObject) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(tokenObject));
      return GitHubApi.getUserByToken(tokenObject.access_token);
    })
    .then((user) => {
      // eslint-disable-next-line no-console
      console.log(`user ${JSON.stringify(user)}`);
      res.json(user);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(`Error ${error}`);
      res.send('fim');
    });
});

export default authenticationRouter;
