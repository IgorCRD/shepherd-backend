import express from 'express';
import GitHubApi from 'api/github-api';
import Token from 'models/token';
import Repo from 'models/repo';
import User from 'models/user';

function searchForRepo(req, res) {
  try {
    const { body: { id, repoOwner, repoName: query } } = req;
    Token.findOne({ id })
      .then(token => GitHubApi.searchRepo(token.token, query, repoOwner))
      .then((results) => {
        res.json({
          total_count: results.total_count,
          items: results.items.map(repo => ({ repoName: repo.name, id: repo.id })),
        });
      });
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

function syncRepoInDb(repo) {
  const repoForDb = { ...repo, ownerId: repo.owner.id, id: Number(repo.id) };
  return Repo.findOneAndUpdate({ id: Number(repoForDb.id) }, repoForDb, { new: true }).then(repoInDb => repoInDb || new Repo(repoForDb).save());
}

function addRepoToUserList(repo, user) {
  return user.then((userInDb) => {
    userInDb.monitored_repos.push(repo);
    return userInDb.save();
  });
}

function addRepo(req, res) {
  try {
    const { body: { userId, repoId } } = req;
    const user = User.findOne({ id: userId });

    Token.findOne({ id: userId })
      .then(token => GitHubApi.getRepo(token.token, repoId))
      .then(syncRepoInDb)
      .then(repoInDb => addRepoToUserList(repoInDb, user))
      .then(result => res.json(result));
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

const repoRouter = express.Router({
  mergeParams: true,
});

repoRouter.post('/search', searchForRepo);
repoRouter.post('/addRepo', addRepo);

export default repoRouter;
