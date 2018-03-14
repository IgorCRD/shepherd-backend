import { Schema } from 'mongoose';
import mongo from 'db/mongo';

const commitSchema = new Schema({
  sha: { type: String, required: true, unique: true },
  repoId: { type: Schema.Types.ObjectId, ref: 'repo' },
  repoFullName: String,
  html_url: String,
  commit: {
    url: String,
    author: {
      name: String,
      email: String,
      date: String,
      login: String,
    },
    committer: {
      name: String,
      email: String,
      date: String,
    },
    message: String,
  },
});

const Commit = mongo.model('commit', commitSchema);

export default Commit;
