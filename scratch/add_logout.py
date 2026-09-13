import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
"""

content = content.replace("    return (", replacement, 1) # Only replace the first return (

header_search = """<Button icon="pi pi-cog" className="p-button-rounded p-button-text p-button-secondary" aria-label="Settings" />"""
header_replace = """<Button icon="pi pi-cog" className="p-button-rounded p-button-text p-button-secondary" aria-label="Settings" />
                    <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                    <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                        <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="text-700 font-bold text-sm">로그인됨</span>
                    </div>"""

content = content.replace(header_search, header_replace)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Logout button and user profile to header")
