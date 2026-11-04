'use strict';

const { app } = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Task Manager API running at http://localhost:${PORT}`);
});

module.exports = server;
