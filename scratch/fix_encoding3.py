import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "toast.current?.show({ severity: 'success', summary: '발급" in line:
        line = "                toast.current?.show({ severity: 'success', summary: '발급 완료', detail: '파트너사 연동 PIN이 발급되었습니다.', life: 5000 });\n"
    elif "toast.current?.show({ severity: 'success', summary: 'ֹ ?성" in line or "toast.current?.show({ severity: 'success', summary: '주문 ??꽦" in line:
        line = "            toast.current?.show({ severity: 'success', summary: '주문 생성 완료', detail: '새로운 주문이 시스템에 등록되었습니다.', life: 3000 });\n"
    elif "toast.current?.show({ severity: 'success', summary: ' Ϸ" in line or "toast.current?.show({ severity: 'success', summary: '?증" in line:
        line = "            toast.current?.show({ severity: 'success', summary: '인증 완료', detail: '파트너사 연동이 승인되었습니다.', life: 5000 });\n"
    elif "toast.current?.show({ severity: 'error', summary: '?증 ?패" in line:
        line = "            toast.current?.show({ severity: 'error', summary: '인증 실패', detail: '유효하지 않거나 만료된 PIN입니다.', life: 3000 });\n"
    elif "toast.current?.show({ severity: 'success', summary: '조회 ?공" in line:
        line = "                toast.current?.show({ severity: 'success', summary: '조회 성공', detail: '정상 영업 중인 사업자입니다.', life: 3000 });\n"
    elif "toast.current?.show({ severity: 'warn', summary: '주의" in line:
        line = "                toast.current?.show({ severity: 'warn', summary: '주의', detail: '휴폐업 사업자입니다 (' + data.statusName + ')', life: 5000 });\n"
    elif "toast.current?.show({ severity: 'success', summary: ' '" in line or "toast.current?.show({ severity: 'success', summary: '?주" in line:
        line = "            toast.current?.show({ severity: 'success', summary: '외주 등록', detail: '외주 반출이 기록되었습니다.', life: 3000 });\n"
    elif "toast.current?.show({ severity: 'info', summary: '반입 ?료" in line:
        line = "            toast.current?.show({ severity: 'info', summary: '반입 완료', detail: `감모율: ${updatedTask.lossWeightG}g`, life: 5000 });\n"
    elif "toast.current?.show({ severity: 'success', summary: 'ֹ 취소" in line or "toast.current?.show({ severity: 'success', summary: '주문 ?⑥" in line:
        line = "                toast.current?.show({ severity: 'success', summary: '주문 취소 완료', detail: `수수료: ₩${data.cancellationFee}`, life: 5000 });\n"
    elif "toast.current?.show({ severity: 'info', summary: ' ̵" in line or "toast.current?.show({ severity: 'info', summary: '공정 ?동" in line:
        line = "                    toast.current?.show({ severity: 'info', summary: '공정 이동', detail: `주문 #${orderId} 공정이 [${data.newStage}] 단계로 이동되었습니다.`, life: 3000 });\n"
    elif "toast.current?.show({ severity: 'error', summary: '?류'" in line:
        if "data.message" in line:
            line = "                    toast.current?.show({ severity: 'error', summary: '오류', detail: data.message, life: 3000 });\n"
        else:
            line = "                toast.current?.show({ severity: 'error', summary: '오류', detail: '공정 이동 중 오류가 발생했습니다.', life: 3000 });\n"
            
    # Stage mappings
    if "if (s === 'PENDING') s = " in line:
        line = "                    if (s === 'PENDING') s = '접수';\n"
    elif "else if (s === 'POLISHING'" in line:
        line = "                    else if (s === 'POLISHING' || s === '세공') s = '세공';\n"
    elif "else if (s === 'PLATING/INSPECTION'" in line:
        line = "                    else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';\n"
    elif "else s = " in line and "접수" not in line:
        line = "                    else s = '접수';\n"
        
    # Table headers
    if "header=\"ֹ 踰덊" in line or "header=\"주문 踰덊" in line:
        line = "                                <Column header=\"주문 번호\" body={(r) => <span className=\"font-bold text-primary\">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />\n"
    elif "header=\"?좉컼紐" in line or "header=\"" in line and "customerName" in line:
        line = "                                <Column field=\"customerName\" header=\"고객명\" />\n"
    elif "header=\"?듭" in line or "header=\"" in line and "statusBodyTemplate" in line:
        line = "                                <Column field=\"stage\" header=\"공정 상태\" body={statusBodyTemplate}></Column>\n"
    
    # Buttons
    if "aria-label=\"?곸꽭蹂닿" in line or "aria-label=\"" in line:
        line = "                                <Column header=\"\" body={(rowData) => <Button icon=\"pi pi-eye\" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className=\"p-button-rounded p-button-text p-button-sm p-button-secondary\" aria-label=\"상세보기\" tooltip=\"상세보기\" tooltipOptions={{position: 'left'}} />} style={{ width: '60px' }} />\n"
        
    # Mock data
    if "CAD:" in line and "주물" in line:
        line = line.replace("?공", "세공")
    
    # Other string fixes
    line = line.replace("??씪?꾧툑", "제일순금")
    line = line.replace("?깆떎?듬?", "성실공방")
    line = line.replace("??꽦 주문????뒿??떎.", "등록된 주문이 없습니다.")
    
    new_lines.append(line)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
