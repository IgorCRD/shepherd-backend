const port = process.env.PORT || 3001;
const config = {
  port,
  origin: process.env.ORIGIN || `http://localhost:${port}`,
};

export default config;
