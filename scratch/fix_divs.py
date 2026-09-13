import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the extra closing divs
target = """
                    </div>
                </div>
                    </div>
                </div>

                {/* Center Panel: Pipeline & Table */}
"""

replacement = """
                    </div>
                </div>

                {/* Center Panel: Pipeline & Table */}
"""

content = content.replace(target, replacement)

# Another variant just in case spaces differ
target2 = """                    </div>
                </div>
                    </div>
                </div>

                {/* Center Panel: Pipeline & Table */}"""
content = content.replace(target2, replacement)

content = re.sub(r'</div>\s*</div>\s*</div>\s*</div>\s*\{\/\* Center Panel: Pipeline \& Table \*\/\}', 
                 r'</div>\n                </div>\n\n                {/* Center Panel: Pipeline & Table */}', 
                 content)


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed JSX Syntax")
