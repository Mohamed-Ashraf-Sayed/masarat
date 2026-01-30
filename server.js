const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Log file path
const logFile = path.join(__dirname, 'node-error.log');

// Safe logging function
function logToFile(message) {
  try {
    fs.appendFileSync(logFile, message + '\n');
  } catch (e) {
    // Ignore write errors
  }
}

// Log errors to file for debugging
process.on('uncaughtException', e => {
  const msg = new Date().toISOString() + ' UNCAUGHT: ' + (e && e.stack ? e.stack : e);
  logToFile(msg);
  console.error('Uncaught Exception:', e);
  // Don't exit - try to keep running
});

process.on('unhandledRejection', e => {
  const msg = new Date().toISOString() + ' REJECTION: ' + (e && e.stack ? e.stack : e);
  logToFile(msg);
  console.error('Unhandled Rejection:', e);
});

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';

logToFile(new Date().toISOString() + ' SERVER STARTING...');
console.log('Starting server...');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Set timeouts
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 5000; // 5 seconds

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('Server listen error:', err);
        logToFile(new Date().toISOString() + ' LISTEN ERROR: ' + err);
        throw err;
      }
      const msg = `> Ready on http://${hostname}:${port}`;
      console.log(msg);
      logToFile(new Date().toISOString() + ' ' + msg);
    });
  })
  .catch((err) => {
    const msg = 'Error preparing Next.js app: ' + (err && err.stack ? err.stack : err);
    console.error(msg);
    logToFile(new Date().toISOString() + ' PREPARE ERROR: ' + msg);
    process.exit(1);
  });
