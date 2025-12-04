import https from 'https';
import { performance } from 'perf_hooks';

const HOSTNAMES = [
  'api-fxpractice.oanda.com', // Practice
  'api-fxtrade.oanda.com',    // Live
  'stream-fxpractice.oanda.com',
  'stream-fxtrade.oanda.com'
];

function testLatency(host) {
  return new Promise(resolve => {
    const start = performance.now();

    const options = {
      hostname: host,
      port: 443,
      method: 'GET',
      path: '/v3/accounts', // Harmless endpoint (requires auth but still measures TLS connection time)
      timeout: 5000
    };

    const req = https.request(options, res => {
      res.on('data', () => {});
      res.on('end', () => {
        const end = performance.now();
        resolve({ host, ms: end - start });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ host, ms: null });
    });

    req.on('error', () => {
      const end = performance.now();
      resolve({ host, ms: end - start });
    });

    req.end();
  });
}

(async () => {
  console.log("Testing OANDA API latency...\n");

  for (const host of HOSTNAMES) {
    const result = await testLatency(host);
    console.log(`${result.host}  → ${result.ms ? result.ms.toFixed(2)+' ms' : 'timeout'}`);
  }
})();
