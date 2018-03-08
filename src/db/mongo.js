import mongoose from 'mongoose';
import mongoConfig from 'config/mongo-config';

const mongo = mongoose.createConnection(mongoConfig.uri);

export default mongo;
