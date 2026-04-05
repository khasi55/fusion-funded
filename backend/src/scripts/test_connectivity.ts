import dns from 'dns';
import { promisify } from 'util';
import net from 'net';
import http from 'https';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

async function testConnectivity() {
  const hostname = 'dqzafsvhqfdhgiqexdct.supabase.co';
  console.log(`\n--- Connectivity Test for ${hostname} ---\n`);

  // 1. DNS Resolution
  console.log('1. DNS Resolution:');
  try {
    const ipv4 = await resolve4(hostname).catch(() => []);
    console.log(`   IPv4: ${ipv4.length > 0 ? ipv4.join(', ') : 'None'}`);
    
    const ipv6 = await resolve6(hostname).catch(() => []);
    console.log(`   IPv6: ${ipv6.length > 0 ? ipv6.join(', ') : 'None'}`);
  } catch (err) {
    console.error('   DNS Resolution failed:', err);
  }

  // 2. TCP Connection Test
  console.log('\n2. TCP Connection (Port 443):');
  const testConnection = (host: string, port: number, timeout = 5000) => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const start = Date.now();
      
      socket.setTimeout(timeout);
      socket.once('connect', () => {
        console.log(`   ✅ Connected to ${host}:${port} in ${Date.now() - start}ms`);
        socket.destroy();
        resolve(true);
      });
      
      socket.once('timeout', () => {
        console.error(`   ❌ Timeout connecting to ${host}:${port} after ${timeout}ms`);
        socket.destroy();
        resolve(false);
      });
      
      socket.once('error', (err) => {
        console.error(`   ❌ Error connecting to ${host}:${port}:`, err.message);
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  };

  await testConnection(hostname, 443);

  // 3. fetch Test (Internal)
  console.log('\n3. HTTPS Fetch Test:');
  try {
    const start = Date.now();
    const req = http.get(`https://${hostname}/rest/v1/`, { timeout: 10000 }, (res) => {
      console.log(`   ✅ HTTPS Status: ${res.statusCode} (Time: ${Date.now() - start}ms)`);
      res.resume();
    });
    req.on('error', (err) => {
      console.error('   ❌ HTTPS Fetch failed:', err.message);
    });
    req.on('timeout', () => {
      console.error('   ❌ HTTPS Request timed out');
      req.destroy();
    });
  } catch (err) {
    console.error('   ❌ Fetch failed:', err);
  }

  // 4. JWT Secret Test
  console.log('\n4. JWT Secret Configuration:');
  const secret = process.env.SUPABASE_JWT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  
  console.log(`   SUPABASE_JWT_SECRET present: ${!!secret}`);
  console.log(`   JWT_SECRET present: ${!!jwtSecret}`);
  
  if (secret) {
    console.log(`   Secret Length: ${secret.length}`);
    const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(secret);
    console.log(`   Looks like Base64: ${isBase64}`);
    
    // Test verification algorithm
    try {
        const dummyToken = jwt.sign({ sub: 'test' }, secret, { algorithm: 'HS256' });
        const decoded = jwt.verify(dummyToken, secret, { algorithms: ['HS256'] });
        console.log('   ✅ JWT Test (local sign/verify): Success');
    } catch (err) {
        console.error('   ❌ JWT Test (local): Failed', err.message);
    }
  }
}

testConnectivity().catch(console.error);
