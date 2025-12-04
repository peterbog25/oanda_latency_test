// ===============================================
// OANDA REST SPEED TEST (LIVE + PRACTICE MODE)
// Ultra-Optimized Version with Keep-Alive + DNS Cache
// ===============================================

// ⚠️ CONFIGURATION
const API_TOKEN    = "6087b8fa0358bd9f59771fc5f0f905e0-bdac3ad597374251b58a3d78f3ff94dd";
const ACCOUNT_ID = "101-004-37711620-001";

// Live 
//const API_TOKEN    = "f4e8596fcb4d8ca22e3b79792a99da9b-513abca747af15f02bf0087a61ae5d39";
//const ACCOUNT_ID = "001-004-19699615-001";

// Set this to true to use PRACTICE environment
const PRACTICE = true;   // change to true for practice testing

// ===============================================

import https from "https";
import CacheableLookup from "cacheable-lookup";

// DNS cache (reduces DNS lookup time to near-zero)
const dnsCache = new CacheableLookup();
dnsCache.install(https.globalAgent);

// Keep-alive agent (reuses TCP + TLS connection)
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 1,
  timeout: 60000,
});

// Base URL switching between live/practice
const HOST = PRACTICE
  ? "api-fxpractice.oanda.com"
  : "api-fxtrade.oanda.com";

// High-resolution timer
function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

// Generic POST wrapper
function oandaPost(path, body) {
  return new Promise((resolve, reject) => {
    const start = nowMs();

    const options = {
      hostname: HOST,
      port: 443,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`,
      },
      agent,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const end = nowMs();
        resolve({
          ms: end - start,
          status: res.statusCode,
          body: data,
        });
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// Place 1-unit BUY
async function placeMarketOrder() {
  const path = `/v3/accounts/${ACCOUNT_ID}/orders`;
  const body = {
    order: {
      instrument: "EUR_USD",
      units: "1",
      type: "MARKET",
      timeInForce: "FOK",
    },
  };
  return await oandaPost(path, body);
}

// Close position (1-unit SELL)
async function closeMarketOrder() {
  const path = `/v3/accounts/${ACCOUNT_ID}/orders`;
  const body = {
    order: {
      instrument: "EUR_USD",
      units: "-1",
      type: "MARKET",
      timeInForce: "FOK",
    },
  };
  return await oandaPost(path, body);
}

// Main test runner
async function runTest() {
  console.log("\n=====================================");
  console.log(" OANDA REST SPEED TEST");
  console.log(" Mode:", PRACTICE ? "PRACTICE" : "LIVE");
  console.log(" Endpoint:", HOST);
  console.log("=====================================\n");

  for (let i = 1; i <= 3; i++) {
    console.log(`--- Test ${i} ---`);

    const open = await placeMarketOrder();
    console.log(`Order OPEN  → ${open.ms} ms (HTTP ${open.status})`);

    const close = await closeMarketOrder();
    console.log(`Order CLOSE → ${close.ms} ms (HTTP ${close.status})\n`);

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("Done.\n");
  process.exit(0);
}

runTest().catch((err) => console.error(err));
