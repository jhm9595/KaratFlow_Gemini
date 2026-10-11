import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

export const UserAccountPage: React.FC = () => {
    const toast = useRef<Toast>(null);
    const [profile, setProfile] = useState<any>({
        username: 'KaratFlow 공장 관리자',
        email: 'factory@karatflow.com',
        role: 'ROLE_VENDOR',
        oauthProviderId: 'kakao_381920412',
        googleLinked: false,
        kakaoLinked: true
    });

    useEffect(() => {
        fetch('http://localhost:8888/api/users/me')
            .then(res => res.json())
            .then(data => setProfile(data))
            .catch(() => {});
    }, []);

    const linkSocialProvider = (provider: string) => {
        if (provider === 'kakao') {
            window.location.href = 'http://localhost:8888/oauth2/authorization/kakao';
        } else if (provider === 'google') {
            window.location.href = 'http://localhost:8888/oauth2/authorization/google';
        }
    };

    return (
        <div className="p-4 surface-ground min-h-screen">
            <Toast ref={toast} />
            <h2 className="text-900 font-bold mb-4 flex align-items-center gap-2">
                <i className="pi pi-user text-primary text-2xl"></i>
                계정 및 보안 관리 (소셜 계정 연동)
            </h2>

            <div className="grid">
                {/* Profile Card */}
                <div className="col-12 md:col-5">
                    <Card title="내 프로필 정보" className="border-round-xl shadow-1 h-full">
                        <div className="flex flex-column align-items-center text-center p-3">
                            <div className="w-5rem h-5rem border-circle bg-primary-100 text-primary flex align-items-center justify-content-center text-3xl font-bold mb-3 shadow-1">
                                <i className="pi pi-user"></i>
                            </div>
                            <div className="text-xl font-bold text-900 mb-1">{profile.username}</div>
                            <div className="text-600 text-sm mb-3">{profile.email || 'user@karatflow.com'}</div>
                            <Tag value={profile.role || 'ROLE_VENDOR'} severity="info" className="px-3 py-1" />
                        </div>
                    </Card>
                </div>

                {/* Social Linking Card */}
                <div className="col-12 md:col-7">
                    <Card title="소셜 로그인 연동 관리" subTitle="구글 및 카카오 계정을 현재 계정에 안전하게 연결하세요." className="border-round-xl shadow-1 h-full">
                        <div className="flex flex-column gap-3 pt-2">
                            
                            {/* Kakao Link Row */}
                            <div className="surface-50 p-3 border-round-xl border-1 border-yellow-300 flex align-items-center justify-content-between">
                                <div className="flex align-items-center gap-3">
                                    <div className="bg-yellow-400 text-yellow-900 border-circle w-2.5rem h-2.5rem flex align-items-center justify-content-center font-bold">
                                        톡
                                    </div>
                                    <div>
                                        <div className="font-bold text-900 text-sm">카카오톡 (Kakao) 계정</div>
                                        <div className="text-xs text-500">{profile.kakaoLinked ? '연동 완료됨 (kakao_381920412)' : '미연동 상태'}</div>
                                    </div>
                                </div>
                                {profile.kakaoLinked ? (
                                    <Tag severity="success" value="연동됨" icon="pi pi-check" className="px-3 py-1" />
                                ) : (
                                    <Button label="카카오 계정 연동하기" icon="pi pi-link" className="p-button-warning p-button-sm font-bold" onClick={() => linkSocialProvider('kakao')} />
                                )}
                            </div>

                            {/* Google Link Row */}
                            <div className="surface-50 p-3 border-round-xl border-1 border-200 flex align-items-center justify-content-between">
                                <div className="flex align-items-center gap-3">
                                    <div className="bg-red-500 text-white border-circle w-2.5rem h-2.5rem flex align-items-center justify-content-center font-bold">
                                        G
                                    </div>
                                    <div>
                                        <div className="font-bold text-900 text-sm">구글 (Google) 계정</div>
                                        <div className="text-xs text-500">{profile.googleLinked ? '연동 완료됨 (google_xxx)' : '미연동 상태'}</div>
                                    </div>
                                </div>
                                {profile.googleLinked ? (
                                    <Tag severity="success" value="연동됨" icon="pi pi-check" className="px-3 py-1" />
                                ) : (
                                    <Button label="구글 계정 연동하기" icon="pi pi-link" className="p-button-outlined p-button-danger p-button-sm font-bold" onClick={() => linkSocialProvider('google')} />
                                )}
                            </div>

                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
