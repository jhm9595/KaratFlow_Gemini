import React from 'react';
import { Sidebar } from 'primereact/sidebar';

interface AppSidebarProps {
    visible: boolean;
    onHide: () => void;
    activeMenu: string;
    onSelectMenu: (menuKey: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ visible, onHide, activeMenu, onSelectMenu }) => {
    const mainMenuItems = [
        { key: 'dashboard', label: '대시보드', icon: 'pi pi-th-large' },
        { key: 'customer', label: '고객 관리', icon: 'pi pi-users' },
        { key: 'orders', label: '주문 관리', icon: 'pi pi-shopping-bag' },
        { key: 'analytics', label: '전체 통계 / 정산', icon: 'pi pi-chart-bar' },
        { key: 'kakao-guide', label: '카톡채널 가이드', icon: 'pi pi-comments' },
    ];

    return (
        <Sidebar 
            visible={visible} 
            onHide={onHide} 
            position="left" 
            style={{ width: '310px' }}
            header={
                <div className="flex align-items-center gap-2">
                    <img src="/logo.png" alt="KaratFlow Logo" style={{ width: '30px', height: '30px' }} />
                    <span className="font-bold text-xl text-900 tracking-tight">KaratFlow 메뉴</span>
                </div>
            }
        >
            <div className="flex flex-column justify-content-between h-full pt-2">
                <div>
                    {/* Category Label */}
                    <div className="text-600 font-bold text-sm uppercase px-2 mb-3 tracking-wider">
                        주요 메뉴
                    </div>

                    {/* Navigation Menu List */}
                    <div className="flex flex-column gap-2">
                        {mainMenuItems.map((item) => {
                            const isActive = activeMenu === item.key;
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => {
                                        onSelectMenu(item.key);
                                        onHide();
                                    }}
                                    className={`px-3.5 py-3 border-round-xl cursor-pointer transition-all transition-duration-150 flex align-items-center justify-content-between ${
                                        isActive 
                                            ? 'bg-primary-50 text-primary border-left-4 border-primary font-extrabold shadow-1' 
                                            : 'text-800 hover:text-900 hover:bg-100 font-bold'
                                    }`}
                                >
                                    <div className="flex align-items-center gap-3">
                                        <i className={`${item.icon} text-xl ${isActive ? 'text-primary font-bold' : 'text-600'}`}></i>
                                        <span className={`text-base ${isActive ? 'text-primary font-extrabold' : 'text-900 font-bold'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    {isActive && <i className="pi pi-chevron-right text-sm text-primary font-bold"></i>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="border-top-1 border-200 pt-3 pb-2 text-center">
                    <div className="text-sm text-700 font-bold mb-1">KaratFlow Platform</div>
                    <div className="text-xs text-500">공장전용 통합 관리 파이프라인</div>
                </div>
            </div>
        </Sidebar>
    );
};
