import { Schema } from 'mongoose';
import mongo from 'db/mongo';

const userSchema = new Schema({
  login: { type: String, required: true, unique: true },
  id: { type: Number, required: true, unique: true },
  avatar_url: String,
  gravatar_id: String,
  url: String,
  html_url: String,
  type: String,
  name: String,
  company: String,
  blog: String,
  location: String,
  email: String,
  bio: String,
  followers: Number,
  following: Number,
  private_gists: Number,
  total_private_repos: Number,
  owned_private_repos: Number,
  monitored_repos: [{ type: Schema.Types.ObjectId, ref: 'repo' }],
});

const User = mongo.model('User', userSchema);

export default User;
