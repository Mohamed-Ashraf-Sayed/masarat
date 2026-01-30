const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

// Log errors to file for debugging
process.on('uncaughtException', e => {
  fs.appendFileSync('node-error.log', new Date().toISOString() + ' UNCAUGHT: ' + e.stack + '\n');
  console.error('Uncaught Exception:', e);
});
process.on('unhandledRejection', e => {
  fs.appendFileSync('node-error.log', new Date().toISOString() + ' REJECTION: ' + (e && e.stack ? e.stack : e) + '\n');
  console.error('Unhandled Rejection:', e);
});

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';

console.log('Starting server...');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) {
        console.error('Server listen error:', err);
        throw err;
      }
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
  });
