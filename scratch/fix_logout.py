import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

header_search = """<Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />"""
header_replace = """<Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                    <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                        <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="text-700 font-bold text-sm">로그인됨</span>
                        <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                    </div>"""

content = content.replace(header_search, header_replace)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added logout button to actual APM header")
