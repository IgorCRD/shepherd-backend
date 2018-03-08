import express from 'express';
import GitHubApi from 'api/github-api';
import User from 'models/user';
// import mongoose from 'mongoose';
// const User = mongoose.model('User', {});

const authenticationRouter = express.Router({
  mergeParams: true,
});

authenticationRouter.post('/', (req, res) => {
  const { body: { code } } = req;

  let token;
  let user;
  GitHubApi.getTokenFromCode(code)
    .then((tokenP) => {
      token = tokenP.access_token;
      return GitHubApi.getUserByToken(token);
    })
    .then((userP) => {
      user = userP;
      return User.findOne({ id: user.id });
    })
    .then((userFromDb) => {
      if (userFromDb) {
        return User.findOneAndUpdate({ id: userFromDb.id }, user);
      }
      const newUser = new User(user);
      return newUser.save();
    })
    .then((userFromDb) => {
      // eslint-disable-next-line no-console
      console.log(userFromDb);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ token, code, user }));
      res.json(user);
    });
});

export default authenticationRouter;
