const serverless = require('serverless-http');

let app;

module.exports.handler = async (event, context) => {
  if (event.path && event.path.startsWith('/.netlify/functions')) {
    event.path = event.path.replace(/^\/\.netlify\/functions/, '') || '/';
  }

  if (!app) {
    const mod = await import('../../server/server.js');
    app = mod.default;
  }

  const handler = serverless(app);
  return handler(event, context);
};
