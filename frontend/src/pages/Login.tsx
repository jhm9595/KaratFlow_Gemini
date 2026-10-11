import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export const Login: React.FC = () => {

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = 'http://localhost:8888/oauth2/authorization/kakao';
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = kakaoAuthUrl;
      } else {
        window.location.href = kakaoAuthUrl;
      }
    } catch (_e) {
      window.open(kakaoAuthUrl, '_self');
    }
  };

  const handleGoogleLogin = () => {
    const googleAuthUrl = 'http://localhost:8888/oauth2/authorization/google';
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = googleAuthUrl;
      } else {
        window.location.href = googleAuthUrl;
      }
    } catch (_e) {
      window.open(googleAuthUrl, '_self');
    }
  };

  const handleDemoLogin = async () => {
    try {
      const res = await fetch('http://localhost:8888/api/debug/token');
      if (res.ok) {
        const token = await res.text();
        localStorage.setItem('jwtToken', token);
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Demo login failed:', e);
    }
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen surface-200">
      <Card title={<div className="flex align-items-center justify-content-center gap-2"><img src="/logo.png" style={{width:'40px', height:'40px'}} /> KaratFlow 로그인</div>} className="w-full md:w-4 shadow-5 text-center">
        <p className="text-500 mb-5">총판 및 협력사 관리 시스템</p>
        
        <div className="flex flex-column gap-3">
          <Button 
            label="테스트 계정으로 빠른 로그인 (데모)" 
            icon="pi pi-bolt" 
            className="w-full p-button-success p-button-raised font-bold" 
            onClick={handleDemoLogin} 
          />
          <Button 
            label="카카오로 로그인" 
            icon="pi pi-comment" 
            className="w-full" 
            style={{ backgroundColor: '#FEE500', color: '#000000', border: 'none' }} 
            onClick={handleKakaoLogin} 
          />
          <Button 
            label="Google로 로그인" 
            icon="pi pi-google" 
            className="w-full p-button-outlined" 
            onClick={handleGoogleLogin} 
          />
        </div>
      </Card>
    </div>
  );
};
