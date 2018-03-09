import { Schema } from 'mongoose';
import mongo from 'db/mongo';

const tokenSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  token: { type: String, required: true },
});

const Token = mongo.model('token', tokenSchema);

export default Token;
