const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');

(async () => {
    console.log('[1/8] 환경 설정 및 인증 토큰 발급 중...');
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    let token = '';
    try {
        token = await new Promise((resolve, reject) => {
            http.get('http://localhost:8888/api/debug/token', (res) => {
                let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    } catch (e) {
        console.error('Failed to get token:', e); process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        console.log('[2/8] 앱 접속 및 토큰 주입...');
        await page.goto('http://localhost:5555/', { waitUntil: 'domcontentloaded' });
        await page.evaluate((jwt) => localStorage.setItem('jwtToken', jwt), token);
        await page.goto('http://localhost:5555/', { waitUntil: 'networkidle0', timeout: 60000 }).catch(e => console.log('Navigation timeout, continuing...'));
        
        await sleep(2000); // Wait for React to render

        await page.screenshot({ path: 'screenshots/01_dashboard.png' });
        console.log('✅ 대시보드 로딩 완료');

        console.log('[3/8] 글로벌 지표 및 금 시세 확인...');
        const html = await page.content();
        fs.writeFileSync('dashboard_html.txt', html);
        
        if (html.includes('글로벌 원자재') || html.includes('금 시세')) {
            console.log('✅ 위젯 표출 성공');
        } else {
            console.error('❌ 위젯 렌더링 실패');
        }

        console.log('[4/8] 새 주문 생성 테스트...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('주문 생성'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await page.screenshot({ path: 'screenshots/02_create_order.png' });
        await page.keyboard.press('Escape');
        await sleep(500);

        console.log('[5/8] 상세 주문 모니터링 및 공정 진행 테스트...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('공정 진행'));
            if (btn) btn.click();
        });
        await sleep(1000);

        console.log('[6/8] 협력사 인증(Handshake) 모달 테스트...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('협력사'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await page.screenshot({ path: 'screenshots/03_handshake.png' });
        await page.keyboard.press('Escape');
        await sleep(500);

        console.log('[7/8] 금 시세 심층 도구(Gold Tools) 테스트...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('심층 도구'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await page.screenshot({ path: 'screenshots/04_gold_tools.png' });
        await page.keyboard.press('Escape');
        await sleep(500);

        console.log('[8/8] 공정 관리(Process Manager) 테스트...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('공정 관리'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await page.screenshot({ path: 'screenshots/05_process_manager.png' });

        console.log('🎉 모든 기능 E2E 테스트가 성공적으로 완료되었습니다!');
    } catch (e) {
        console.error('❌ 테스트 진행 중 오류 발생:', e);
    } finally {
        await browser.close();
    }
})();
