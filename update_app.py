import os

app_tsx_path = 'frontend/src/App.tsx'

with open(app_tsx_path, 'r') as f:
    app_tsx = f.read()

# Add states
app_tsx = app_tsx.replace('const [changeModalVisible, setChangeModalVisible] = useState(false);',
                          'const [changeModalVisible, setChangeModalVisible] = useState(false);\n    const [partnerModalVisible, setPartnerModalVisible] = useState(false);')

# Add button
app_tsx = app_tsx.replace('<Button label="Simulate HOLD Alert" icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />',
                          '<Button label="Invite Partner" icon="pi pi-users" className="p-button-info mr-2" onClick={() => setPartnerModalVisible(true)} />\n                <Button label="Simulate HOLD Alert" icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />')

# Add Dialog
dialog_str = '''
            {/* @ts-ignore */}
            <Dialog header="Partner Handshake & Verification" visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                <p className="m-0 mb-3">
                    Verify business via NTS API and generate a 6-digit secure PIN for a 3-way handshake.
                </p>
                <div className="flex justify-content-end mt-4">
                    <Button label="Verify & Invite" icon="pi pi-check" onClick={() => { setPartnerModalVisible(false); toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Partner verified and PIN generated.', life: 3000 }); }} autoFocus />
                </div>
            </Dialog>
'''

app_tsx = app_tsx.replace('</Dialog>', '</Dialog>\n' + dialog_str)

with open(app_tsx_path, 'w') as f:
    f.write(app_tsx)

print("App.tsx updated.")
