import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all these broken toast texts
replacements = {
    "'?광'": "'유광'",
    "'발급 ?료'": "'발급 완료'",
    "'?트?사 ?동 PIN??발급?었?니??'": "'파트너사 연동 PIN이 발급되었습니다.'",
    "'주문 ?성 ?료'": "'주문 생성 완료'",
    "'?로??주문???스?에 ?록?었?니??'": "'새로운 주문이 시스템에 등록되었습니다.'",
    "'?증 ?료'": "'검증 완료'",
    "'?트?사 ?동???인?었?니??'": "'파트너사 연동이 승인되었습니다.'",
    "'?증 ?패'": "'검증 실패'",
    "'?효?? ?거??만료??PIN?니??'": "'유효하지 않거나 만료된 PIN입니다.'",
    "'조회 ?공'": "'조회 성공'",
    "'?상 ?업 중인 ?업?입?다.'": "'정상 영업 중인 사업자입니다.'",
    "'계속?업?? ?닙?다 ('": "'계속영업자가 아닙니다 ('",
    "'?주 ?록'": "'외주 등록'",
    "'?주 반출??기록?었?니??'": "'외주 반출이 기록되었습니다.'",
    "'반입 ?료'": "'반입 완료'",
    "'감모?? ": "'감모율: ",
    "'주문 취소 ?료'": "'주문 취소 완료'",
    "'?수? ??": "'취소 수수료: ₩",
    "'?류'": "'오류'",
    "'공정 ?동'": "'공정 이동'",
    "공정??": "공정으로 ",
    "?계??동?습?다.": "단계로 이동했습니다.",
    "'공정 ?계 ?동 ??류가 발생?습?다.'": "'공정 단계 이동 중 오류가 발생했습니다.'",
    "??printOrder.invoice?.estimatedPrice": "₩{printOrder.invoice?.estimatedPrice",
    "'?세보기'": "'상세보기'",
    "주문 명세??/h1>": "주문 명세서</h1>",
    "<strong>?자??/strong>": "<strong>디자인:</strong>",
    "<strong>고객?/strong>": "<strong>고객명:</strong>",
    "로그?됨": "로그인됨",
    "로그?웃": "로그아웃",
}

for old, new in replacements.items():
    text = text.replace(old, new)

# And specifically handle the template literal:
text = text.replace("주문 #${orderId} 공정으로 [${data.newStage}] 단계로 이동했습니다.", "주문 #${orderId} 공정이 [${data.newStage}] 단계로 이동했습니다.")
text = text.replace("`취소 수수료: ₩{data.cancellationFee}`", "`취소 수수료: ₩${data.cancellationFee}`")


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Strings sanitized!")
