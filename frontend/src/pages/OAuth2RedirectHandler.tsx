import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OAuth2RedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('jwtToken', token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex align-items-center justify-content-center min-h-screen">
      <h2>로그인 처리 중...</h2>
    </div>
  );
};
