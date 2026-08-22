import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export const Login: React.FC = () => {

  const handleKakaoLogin = () => {
    window.location.href = 'http://localhost:8888/oauth2/authorization/kakao';
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8888/oauth2/authorization/google';
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen surface-200">
      <Card title="KaratFlow 로그인" className="w-full md:w-4 shadow-5 text-center">
        <p className="text-500 mb-5">총판 및 협력사 관리 시스템</p>
        
        <div className="flex flex-column gap-3">
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
