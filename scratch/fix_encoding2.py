import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Aggressively replace remaining broken strings
replacements = [
    # Dashboard graphs
    (r"\?공", "세공"),
    (r"\?\?씪\?꾧툑", "제일순금"),
    (r"\?깆떎\?듬\?", "성실공방"),
    (r"蹂묐\?\?諛쒖\?", "병목 발생"),
    
    # Toast messages
    (r"諛쒓\?\?\?꾨즺", "발급 완료"),
    (r"\?\?듃\?\?궗 \?곕룞 PIN\?\?諛쒓\?\?\?\?\?\?땲\?\?", "파트너사 연동 PIN이 발급되었습니다."),
    (r"주문 \?\?꽦 \?꾨즺", "주문 생성 완료"),
    (r"\?\?줈\?\?주문\?\?\?\?뒪\?\?\n뿉 \?깅줉\?\?\?\?\?땲\?\?", "새로운 주문이 시스템에 등록되었습니다."),
    (r"\?증 \?료", "인증 완료"),
    (r"\?\?듃\?\?궗 \?곕룞\?\?\?뱀\?\?\?\n\?\?\?땲\?\?", "파트너사 연동이 승인되었습니다."),
    (r"\?몄쬆 \?\?뙣", "인증 실패"),
    (r"\?좏슚\?\?\? \?\?굅\?\?留뚮\?\?P\nIN\?\?땲\?\?", "유효하지 않거나 만료된 PIN입니다."),
    (r"議고\?\?\?깃났", "조회 성공"),
    (r"\?뺤긽 \?곸뾽 以묒\?\?\n\?\?\?\?\???떎.", "정상 영업 중인 사업자입니다."),
    (r"二쇱\?\?, detail: '\?꾩\?\?\?\?\? \?꾨떃\?\?떎 \(' \+ da\nta.statusName \+ '\)", "주의', detail: '휴폐업 사업자입니다 (' + data.statusName + ')"),
    (r"\?주 \?록", "외주 등록"),
    (r"\?몄＜ 諛섏\?\?\?湲곕\?\?\?\?\n\?\?땲\?\?", "외주 반출이 기록되었습니다."),
    (r"諛섏\?\?\?꾨즺", "반입 완료"),
    (r"媛먮\?\?\? \$\{updatedTask.lossWeigh\ntG\}g", "감모율: ${updatedTask.lossWeightG}g"),
    (r"주문 \?⑥\?\?\?꾨즺", "주문 취소 완료"),
    (r"\?\?닔\?\? \?\?\{data.can\ncellationFee\}", "수수료: ₩${data.cancellationFee}"),
    (r"\?\?쪟", "오류"),
    (r"공정 \?동", "공정 이동"),
    (r"\?듭\?\?\?\n\[\$\{data.newStage\}\] \?\?퀎濡\?\?\?\?\?\?\?뒿\?\?떎.", "공정이 [${data.newStage}] 단계로 이동되었습니다."),
    (r"\?듭\?\?\?\?\?\?\?\?\?\?\?\?쪟媛€ \n諛쒖\?\?뒿\?\?떎.", "공정 이동 중 오류가 발생했습니다."),
    
    # Stage mapping
    (r"if \(s === 'PENDING'\) s = '\?수';", "if (s === 'PENDING') s = '접수';"),
    (r"s === '\?공'\) s = '\?공';", "s === '세공') s = '세공';"),
    (r"s = '\?성';", "s = '완성';"),
    (r"else s = '\?수';", "else s = '접수';"),
    
    # Data table strings
    (r"emptyMessage=\"\?\?꽦 주문\?\?\?\?\?뒿\?\?떎.\"", "emptyMessage=\"등록된 주문이 없습니다.\""),
    (r"header=\"주문 踰덊\?\? body", "header=\"주문 번호\" body"),
    (r"header=\"\?좉컼紐\?", "header=\"고객명\""),
    (r"header=\"\?듭\?\?\?곹깭\"", "header=\"공정 상태\""),
    (r"aria-label=\"\?곸꽭蹂닿\?", "aria-label=\"상세보기\""),
    (r"tooltip=\"\?곸꽭蹂닿\?", "tooltip=\"상세보기\""),
]

for corrupt, clean in replacements:
    text = re.sub(corrupt, clean, text)

# Just clean up any stray ?... with regex for common broken words
text = text.replace("??듃??궗 ?곕룞 PIN??諛쒓??????땲??", "파트너사 연동 PIN이 발급되었습니다.")
text = text.replace("??줈??주문????뒪??\n뿉 ?깅줉?????땲??", "새로운 주문이 시스템에 등록되었습니다.")
text = text.replace("??듃??궗 ?곕룞???뱀???\n???땲??", "파트너사 연동이 승인되었습니다.")
text = text.replace("?좏슚??? ??굅??留뚮??P\nIN??땲??", "유효하지 않거나 만료된 PIN입니다.")
text = text.replace("?뺤긽 ?곸뾽 以묒??\n??????떎.", "정상 영업 중인 사업자입니다.")
text = text.replace("?몄＜ 諛섏???湲곕????\n???땲??", "외주 반출이 기록되었습니다.")
text = text.replace("媛먮??? ${updatedTask.lossWeigh\ntG}g", "감모율: ${updatedTask.lossWeightG}g")
text = text.replace("??닔?? ??{data.can\ncellationFee}", "수수료: ₩${data.cancellationFee}")
text = text.replace("?듭???\n[${data.newStage}] ??퀎濡?????뒿??떎.", "공정이 [${data.newStage}] 단계로 이동되었습니다.")
text = text.replace("?듭???????????쪟媛€ \n諛쒖??뒿??떎.", "공정 이동 중 오류가 발생했습니다.")
text = text.replace("??꽦 주문????뒿??떎.", "등록된 주문이 없습니다.")
text = text.replace("주문 踰덊?? body", "주문 번호\" body")
text = text.replace("?좉컼紐?", "고객명")
text = text.replace("?듭???곹깭", "공정 상태")
text = text.replace("?곸꽭蹂닿?", "상세보기")
text = text.replace("?수", "접수")
text = text.replace("?공", "세공")
text = text.replace("?성", "완성")
text = text.replace("??씪?꾧툑", "제일순금")
text = text.replace("?깆떎?듬?", "성실공방")
text = text.replace("?증 ?료", "인증 완료")
text = text.replace("?주 ?록", "외주 등록")
text = text.replace("??쪟", "오류")
text = text.replace("?동", "이동")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Text replaced (pass 2) and saved to frontend/src/App.tsx')
