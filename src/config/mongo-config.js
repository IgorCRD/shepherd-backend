const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shepherd',
};

export default mongoConfig;
