import os

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'templates')
HOOK_IMPORT = "import { useIsMobile } from '../hooks/useIsMobile';"
HOOK_LINE = "  const { isMobile, isTablet } = useIsMobile();"

REPLACEMENTS = [
    ("padding: '100px 48px'", "padding: isMobile ? '60px 20px' : '100px 48px'"),
    ("padding: '80px 48px'",  "padding: isMobile ? '60px 20px' : '80px 48px'"),
    ("padding: '60px 48px'",  "padding: isMobile ? '48px 20px' : '60px 48px'"),
    ("padding: '0 48px'",     "padding: isMobile ? '0 20px' : '0 48px'"),
    ("gridTemplateColumns: '1fr 1fr'",   "gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'"),
    ("gridTemplateColumns: '1.4fr 1fr'", "gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr'"),
    ("gridTemplateColumns: '1fr 1.4fr'", "gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr'"),
    ("gridTemplateColumns: '2fr 1fr'",   "gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr'"),
    ("gridTemplateColumns: '1fr 2fr'",   "gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr'"),
    ("gridTemplateColumns: 'repeat(4,1fr)'", "gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)'"),
    ("gridTemplateColumns: 'repeat(3,1fr)'", "gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)'"),
    ("gap: 80", "gap: isMobile ? 32 : 80"),
    ("gap: 60", "gap: isMobile ? 24 : 60"),
    ("display: 'flex', gap: 32", "display: isMobile ? 'none' : 'flex', gap: 32"),
    ("display: 'flex', gap: 28", "display: isMobile ? 'none' : 'flex', gap: 28"),
]

def fix_template(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'isMobile' in content:
        print(f"  SKIP: {os.path.basename(filepath)}")
        return False
    original = content
    if HOOK_IMPORT not in content:
        content = content.replace("import React", f"{HOOK_IMPORT}\nimport React", 1)
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    lines = content.split('\n')
    new_lines = []
    in_main = False
    injected = False
    for line in lines:
        new_lines.append(line)
        if 'export default function' in line:
            in_main = True
        if in_main and not injected and ('useState' in line or 'useEffect' in line):
            if HOOK_LINE.strip() not in line:
                new_lines.insert(-1, HOOK_LINE)
                injected = True
    if injected:
        content = '\n'.join(new_lines)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK: {os.path.basename(filepath)}")
        return True
    print(f"  --: {os.path.basename(filepath)}")
    return False

files = [f for f in os.listdir(TEMPLATES_DIR) if f.startswith('Template') and f.endswith('.tsx')]
print(f"{len(files)} templates trouves")
modified = sum(fix_template(os.path.join(TEMPLATES_DIR, f)) for f in sorted(files))
print(f"\n{modified} templates mis a jour")
