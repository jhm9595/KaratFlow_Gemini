import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace handleLogout function if it doesn't exist
if 'const handleLogout = () => {' not in text:
    logout_func = """    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };"""
    text = text.replace("    return (\n        <>\n            <Toast", logout_func + "\n\n    return (\n        <>\n            <Toast")

# Replace Navbar
old_navbar = r'<div className="flex align-items-center justify-content-between px-5 py-3 surface-0 border-bottom-1 border-300 shadow-1 z-2 relative">.*?</div>\n                    </div>\n                </div>'
new_navbar = """<div className="flex align-items-center justify-content-between px-5 py-3 surface-0 border-bottom-1 border-300 shadow-1 z-2 relative">
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-chart-line text-primary" style={{ fontSize: '1.5rem' }}></i>
                        <h2 className="m-0 text-900 font-bold tracking-wide">KaratFlow <span className="text-primary font-normal text-lg ml-2">APM Dashboard</span></h2>
                    </div>
                    <div className="flex gap-2 align-items-center">
                        <Button label="상품별 통계" icon="pi pi-chart-bar" className="p-button-outlined p-button-secondary p-button-sm" onClick={() => navigate('/stats')} />
                        <Button label="새 주문" icon="pi pi-plus" className="p-button-primary p-button-sm" onClick={() => setCreateOrderModalVisible(true)} />
                        <Button label="파트너" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        
                        <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                            <span className="text-700 font-bold text-sm">로그인됨</span>
                            <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                        </div>
                    </div>
                </div>"""

text = re.sub(old_navbar, new_navbar, text, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Navbar fixed!")
