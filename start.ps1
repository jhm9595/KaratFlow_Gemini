# ==========================================
# KaratFlow 통합 실행 스크립트 (start.ps1)
# ==========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   KaratFlow 서버 통합 시작을 준비합니다" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. 기존 프로세스 정리 (Kill)
Write-Host "`n[1/3] 기존 실행 중인 포트(8888, 5555) 프로세스를 정리합니다..." -ForegroundColor Yellow

$pid_8888 = (Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue).OwningProcess
if ($pid_8888) { 
    Write-Host " - 백엔드 포트(8888)를 점유 중인 프로세스(PID: $pid_8888)를 종료합니다."
    Stop-Process -Id $pid_8888 -Force -ErrorAction SilentlyContinue 
} else {
    Write-Host " - 8888 포트 깨끗함."
}

$pid_5555 = (Get-NetTCPConnection -LocalPort 5555 -ErrorAction SilentlyContinue).OwningProcess
if ($pid_5555) { 
    Write-Host " - 프론트엔드 포트(5555)를 점유 중인 프로세스(PID: $pid_5555)를 종료합니다."
    Stop-Process -Id $pid_5555 -Force -ErrorAction SilentlyContinue 
} else {
    Write-Host " - 5555 포트 깨끗함."
}

Start-Sleep -Seconds 2

# 2. 백엔드 실행
Write-Host "`n[2/3] 백엔드(Spring Boot, 8888)를 새 창에서 시작합니다..." -ForegroundColor Yellow
# backend 폴더로 이동하여 기존에 만든 run.ps1 (환경변수 주입 스크립트)을 실행합니다.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; ./run.ps1" -WindowStyle Normal

# 3. 프론트엔드 실행
Write-Host "`n[3/3] 프론트엔드(React, 5555)를 새 창에서 시작합니다..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --port 5555" -WindowStyle Normal

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " 🚀 모든 서버 구동 명령이 완료되었습니다!" -ForegroundColor Green
Write-Host " - 백엔드 로그와 프론트엔드 로그는 새로 뜬 두 개의 파란(검은) 창에서 확인 가능합니다."
Write-Host " - 화면 접속: http://localhost:5555" -ForegroundColor Cyan
Write-Host " - 새 창들은 우측 상단의 'X'를 눌러 끄면 서버가 종료됩니다."
Write-Host "========================================================" -ForegroundColor Green
