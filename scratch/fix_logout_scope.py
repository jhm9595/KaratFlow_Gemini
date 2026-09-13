with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken useEffect return
broken_use_effect = """    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
) => {
            client.deactivate();
        };"""
fixed_use_effect = """        return () => {
            client.deactivate();
        };"""
content = content.replace(broken_use_effect, fixed_use_effect)

# Now, add handleLogout properly right before the ACTUAL main return
actual_return_search = """    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실공방: 28 },
        { date: '08/18', 제일도금: 22, 성실공방: 30 },
        { date: '08/19', 제일도금: 25, 성실공방: 35 },
        { date: '08/20', 제일도금: 24, 성실공방: 25 },
        { date: '08/21', 제일도금: 21, 성실공방: 26 },
        { date: '08/22', 제일도금: 20, 성실공방: 28 },
        { date: '08/23', 제일도금: 22, 성실공방: 24 },
    ];

    return ("""

# Since Korean chars might be corrupted in my python string, let's use regex based on date
import re
pattern = r"    const dailySubcontractData = \[.*?\];\n\n    return \("
replacement = """    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실공방: 28 },
        { date: '08/18', 제일도금: 22, 성실공방: 30 },
        { date: '08/19', 제일도금: 25, 성실공방: 35 },
        { date: '08/20', 제일도금: 24, 성실공방: 25 },
        { date: '08/21', 제일도금: 21, 성실공방: 26 },
        { date: '08/22', 제일도금: 20, 성실공방: 28 },
        { date: '08/23', 제일도금: 22, 성실공방: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return ("""

# But the corrupted korean characters exist in the file.
# We can just search for "const dailySubcontractData =" and find the next "return ("
content = re.sub(r"    const dailySubcontractData = \[.*?\];\s*return \(", replacement, content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed handleLogout scoping")
