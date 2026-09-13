import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will just write a regex that matches ANY string containing "??" or "?" in the middle of Korean and completely replaces the whole line if it's one of the known ones.
# Even better, let's just restore the file FROM `app_head.tsx` and apply the changes properly.
# But wait, we just tried that and it worked, but I messed up the Korean strings.
# Instead of `app_diff_clean.patch`, let's just look at the exact errors.

text = text.replace('label="???????? icon="pi pi-chart-bar"', 'label="생산 통계" icon="pi pi-chart-bar"')
text = text.replace('label="??주문" icon="pi pi-plus"', 'label="새 주문" icon="pi pi-plus"')
text = text.replace('label="??듃?? icon="pi pi-users"', 'label="파트너 연동" icon="pi pi-users"')
text = text.replace('label="???????? icon="pi pi-bell"', 'label="병목 시뮬레이션" icon="pi pi-bell"')

text = text.replace('h4 className="m-0 mb-3 text-600 font-medium">??떆????? 吏€??/h4>', 'h4 className="m-0 mb-3 text-600 font-medium">실시간 주요 지표</h4>')
text = text.replace('h4 className="m-0 mb-3 text-600 font-medium">??떆?공정 ?름 諛?諛붿?뒪</h4>', 'h4 className="m-0 mb-3 text-600 font-medium">실시간 공정 흐름 및 바틀넥</h4>')

text = text.replace('header="??주문 ?성"', 'header="새 주문 생성"')
text = text.replace('placeholder="B2C, B2B ??', 'placeholder="B2C, B2B"')
text = text.replace('span className="p-inputgroup-addon">고객?/span>', 'span className="p-inputgroup-addon">고객명</span>')
text = text.replace('span className="p-inputgroup-addon">?락?/span>', 'span className="p-inputgroup-addon">연락처</span>')
text = text.replace('span className="p-inputgroup-addon">?자인 ID</span>', 'span className="p-inputgroup-addon">디자인 ID</span>')
text = text.replace('span className="p-inputgroup-addon">?면 마감</span>', 'span className="p-inputgroup-addon">표면 마감</span>')
text = text.replace('label="?성" icon="pi pi-check"', 'label="생성" icon="pi pi-check"')
text = text.replace('label="취소" icon="pi pi-times"', 'label="취소" icon="pi pi-times"')

text = text.replace('header="?트?사 ?동 (Handshake)"', 'header="파트너사 연동 (Handshake)"')
text = text.replace('h3>?업?증?명 (Business Verification)</h3>', 'h3>사업자 진위 검증 (Business Verification)</h3>')
text = text.replace('placeholder="?업?번? (10?리)"', 'placeholder="사업자번호 (10자리)"')
text = text.replace('label="?업?증?명 ?청" icon="pi pi-verified"', 'label="사업자 진위 검증 요청" icon="pi pi-verified"')
text = text.replace('header="?주업체 관리" visible={subcontractModalVisible}', 'header="외주업체 관리" visible={subcontractModalVisible}')

text = text.replace('h3>?규 ?주 諛섏텧 湲곕줉</h3>', 'h3>신규 외주 반출 기록</h3>')
text = text.replace('label>?업?(?? ?금)</label>', 'label>작업명(예: 도금)</label>')
text = text.replace('label>?주?체?</label>', 'label>외주업체명</label>')
text = text.replace('label>諛섏텧 ?측 중량 (g)</label>', 'label>반출 실측 중량 (g)</label>')
text = text.replace('label>?의 ?주공임 (??</label>', 'label>합의 외주공임 (₩)</label>')
text = text.replace('label="諛섏텧 ?록 (Dispatch)" icon="pi pi-upload"', 'label="반출 등록 (Dispatch)" icon="pi pi-upload"')
text = text.replace('h3 className="mt-4">?주 ?력 (Subcontract History)</h3>', 'h3 className="mt-4">외주 이력 (Subcontract History)</h3>')
text = text.replace('emptyMessage="?주 ?력??없습?다."', 'emptyMessage="외주 이력이 없습니다."')
text = text.replace('header="?업?"', 'header="작업명"')
text = text.replace('header="?체?"', 'header="업체명"')
text = text.replace('header="?태"', 'header="상태"')
text = text.replace('header="諛섏텧(g)"', 'header="반출(g)"')
text = text.replace('header="諛섏엯(g)"', 'header="반입(g)"')
text = text.replace('tooltip="諛섏엯 ?인"', 'tooltip="반입 확인"')

text = text.replace('header="주문 변경 ?청 (Hold & Estimate)"', 'header="주문 변경 요청 (Hold & Estimate)"')
text = text.replace('label="변경?용 / ?유"</label>', 'label>변경내용 / 사유</label>')
text = text.replace('label>추가 견적 (??</label>', 'label>추가 견적 (₩)</label>')
text = text.replace('label="변경 ?청 ?송" icon="pi pi-send"', 'label="변경 요청 전송" icon="pi pi-send"')
text = text.replace('header="주문 취소"', 'header="주문 취소"')
text = text.replace('label="취소 ?유"</label>', 'label>취소 사유</label>')
text = text.replace('label>취소 ?수? (??</label>', 'label>취소 수수료 (₩)</label>')
text = text.replace('label="취소 ?정" icon="pi pi-check"', 'label="취소 확정" icon="pi pi-check"')


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Strings patched.")
