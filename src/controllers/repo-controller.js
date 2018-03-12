import express from 'express';
import GitHubApi from 'api/github-api';
import Token from 'models/token';
import Repo from 'models/repo';
import User from 'models/user';
import Commit from 'models/commit';

function searchForRepo(req, res) {
  try {
    const { body: { id, repoOwner, repoName: query } } = req;
    Token.findOne({ id })
      .then(token => GitHubApi.searchRepo(token.token, query, repoOwner))
      .then((results) => {
        res.json({
          total_count: results.total_count,
          items: results.items.map(repo => ({
            repoName: repo.name,
            id: repo.id,
          })),
        });
      });
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

function syncRepoInDb(repo) {
  const repoForDb = {
    ...repo,
    ownerId: repo.owner.id,
    ownerName: repo.owner.login,
    id: Number(repo.id),
  };
  return Repo.findOneAndUpdate({ id: Number(repoForDb.id) }, repoForDb, {
    new: true,
  }).then(repoInDb => repoInDb || new Repo(repoForDb).save());
}

function addRepoToUserList(repoInDb, user) {
  return user.then((userInDb) => {
    // eslint-disable-next-line no-underscore-dangle
    if (userInDb.monitored_repos.indexOf(repoInDb._id) === -1) {
      userInDb.monitored_repos.push(repoInDb);
      return userInDb.save();
    }
    return userInDb;
  });
}

function addRepo(req, res) {
  try {
    const { body: { userId, repoId } } = req;
    const user = User.findOne({ id: userId });

    const tokenInDb = Token.findOne({ id: userId });
    // fetch repo from github and save/update to mongo
    const repoInDb = tokenInDb
      .then(token => GitHubApi.getRepo(token.token, repoId))
      .then(syncRepoInDb);

    // add repo to the array of monitored repos of an user
    repoInDb.then(repo => addRepoToUserList(repo, user));

    // fetch commits from github and save to mongo or just get them from mongo
    const commitsInDb = Promise.all([tokenInDb, repoInDb]).then(([token, repo]) =>
      // eslint-disable-next-line no-underscore-dangle
      Commit.find({ repoId: repo._id }).then((commits) => {
        if (commits.length === 0) {
          return GitHubApi.getCommits(
            token.token,
            repo.ownerName,
            repo.name,
          ).then((commitsGh) => {
            const commitsToSave = commitsGh.map(commitItem => ({
              ...commitItem,
              // eslint-disable-next-line no-underscore-dangle
              repoId: repo._id,
            }));
            return Commit.insertMany(commitsToSave);
          });
        }
        return commits;
      }));

    Promise.all([repoInDb, commitsInDb]).then(([repo, commits]) => {
      const response = {
        ...repo.toJSON(),
        commits: commits.map(commit => commit.toJSON()),
      };
      res.json(response);
    });
  } catch (err) {
    res.json({ error: 'Something went wrong!' });
  }
}

function getRepoById(req, res) {
  try {
    const id = Number(req.params.id);
    const { withCommits, userId } = req.query;

    // Atualiza repositorio
    const repoInDb = Token.findOne({ id: userId })
      .then(token => GitHubApi.getRepo(token.token, id))
      .then(syncRepoInDb);

    repoInDb.then((repo) => {
      if (withCommits) {
        // eslint-disable-next-line no-underscore-dangle
        Commit.find({ repoId: repo._id }).then((commits) => {
          res.json({
            ...repo.toJSON(),
            commits: commits.map(commit => commit.toJSON()),
          });
        });
      } else {
        res.json(repo.toJSON());
      }
    });
  } catch (err) {
    res.json({ error: 'Internal error!' });
  }
}

const repoRouter = express.Router({
  mergeParams: true,
});

repoRouter.post('/search', searchForRepo);
repoRouter.post('/addRepo', addRepo);
repoRouter.get('/:id', getRepoById);

export default repoRouter;
