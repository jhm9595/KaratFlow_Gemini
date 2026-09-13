const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');

(async () => {
    // 1. Fetch valid JWT from backend
    let token = '';
    try {
        const response = await new Promise((resolve, reject) => {
            http.get('http://localhost:8888/api/debug/token', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
        token = response;
        console.log('Got JWT token:', token);
    } catch (e) {
        console.error('Failed to get token:', e);
        process.exit(1);
    }

    // 2. Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    // 3. Navigate to frontend root, wait for redirect or load, then inject token
    await page.goto('http://localhost:5555/', { waitUntil: 'networkidle2' });
    
    // Inject token to localStorage
    await page.evaluate((jwt) => {
        localStorage.setItem('jwtToken', jwt);
    }, token);

    console.log('Injected token into localStorage. Navigating again...');
    
    // Navigate again to bypass login screen
    await page.goto('http://localhost:5555/', { waitUntil: 'networkidle2' });

    console.log('Checking Dashboard features...');
    // Wait for the Global Metrics widget to appear
    try {
        await page.waitForSelector('h4', { timeout: 5000 });
        const html = await page.content();
        
        const checks = [
            html.includes('글로벌 원자재 및 환율'),
            html.includes('공정 템플릿 관리'),
            html.includes('KaratFlow')
        ];
        
        console.log('Feature Checks:', checks);
        
        if (checks.every(c => c === true)) {
            console.log('✅ ALL FEATURES LOADED CORRECTLY ON DASHBOARD.');
        } else {
            console.log('❌ SOME FEATURES MISSING.');
        }
        
    } catch (e) {
        console.error('Error during checks:', e);
    }

    await browser.close();
    console.log('Browser closed.');
})();
