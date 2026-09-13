import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_stomp = """                client.subscribe('/topic/process-alerts', (message) => {
                    if (message.body) {
                        const payload = JSON.parse(message.body);
                        toast.current?.show({ 
                            severity: 'error', 
                            summary: t('alert_title'), 
                            detail: payload.message || t('alert_desc'), 
                            life: 5000 
                        });
                        fetchOrders();
                    }
                });"""

new_stomp = """                client.subscribe('/topic/process-alerts', (message) => {
                    if (message.body) {
                        const payload = JSON.parse(message.body);
                        toast.current?.show({ 
                            severity: 'info', 
                            summary: 'Live Event', 
                            detail: payload.message, 
                            life: 5000 
                        });
                        _setLiveEvents(prev => [{
                            id: Date.now(), 
                            message: payload.message, 
                            time: new Date().toLocaleTimeString()
                        }, ...prev].slice(0, 50));
                        fetchOrders();
                    }
                });"""

text = text.replace(old_stomp, new_stomp)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("WebSocket handler updated!")
