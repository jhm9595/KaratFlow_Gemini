import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the end of the Center Panel (Right Panel in current code) and insert the Live Feed Panel after it.
# The Center Panel ends with:
#                                     <Column header="" body={(rowData) => ... } />
#                                 </DataTable>
#                             </div>
#                         </div>
#                     </div>

search_string = """                                </DataTable>
                            </div>
                        </div>
                    </div>"""

replacement_string = search_string + """

                    {/* Right Panel: Live Feed */}
                    <div className="surface-0 p-3 border-round shadow-1 flex flex-column" style={{ width: '350px' }}>
                        <div className="flex justify-content-between align-items-center mb-3">
                            <h4 className="m-0 text-600 font-medium">Live Event Feed</h4>
                            <span className="flex align-items-center gap-2">
                                <span className="w-1rem h-1rem bg-green-500 border-circle inline-block" style={{ animation: 'pulse 2s infinite' }}></span>
                                <span className="text-sm text-green-500 font-bold">LIVE</span>
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {_liveEvents.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 mt-5">최근 발생한 이벤트가 없습니다.</div>
                            ) : (
                                _liveEvents.map(ev => (
                                    <div key={ev.id} className="surface-50 p-3 border-round border-left-3 border-primary shadow-1 fadein animation-duration-300">
                                        <div className="flex justify-content-between align-items-center mb-1">
                                            <span className="text-xs text-600"><i className="pi pi-clock mr-1"></i> {ev.time}</span>
                                        </div>
                                        <div className="text-sm text-900 line-height-3">{ev.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>"""

text = text.replace(search_string, replacement_string)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Live Event Feed panel injected on the right!")
