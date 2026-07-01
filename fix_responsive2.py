import os, re

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'templates')
HOOK_LINE = "  const { isMobile } = useIsMobile();"

def fix(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'isMobile' not in content:
        return False
    if 'useIsMobile' not in content:
        return False
    
    lines = content.split('\n')
    result = []
    changes = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        result.append(line)
        # Detecter debut de fonction React avec corps {
        is_func = bool(re.match(r'^(export default )?function \w+', line))
        if is_func:
            j = i
            while j < min(i+5, len(lines)):
                if '{' in lines[j]:
                    end = min(j+60, len(lines))
                    lookahead = '\n'.join(lines[j:end])
                    next3 = '\n'.join(lines[j:min(j+4, len(lines))])
                    if 'isMobile' in lookahead and 'useIsMobile' not in next3 and 'isMobile }' not in next3 and '{ isMobile' not in next3:
                        if j > i:
                            for k in range(i+1, j+1):
                                result.append(lines[k])
                            i = j
                        result.append(HOOK_LINE)
                        changes += 1
                    break
                j += 1
        i += 1
    
    new = '\n'.join(result)
    if new != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new)
        print(f"  OK {changes}x: {os.path.basename(filepath)}")
        return True
    print(f"  -- : {os.path.basename(filepath)}")
    return False

files = [f for f in os.listdir(TEMPLATES_DIR) if f.startswith('Template') and f.endswith('.tsx')]
total = sum(fix(os.path.join(TEMPLATES_DIR, f)) for f in sorted(files))
print(f"\n{total} fichiers modifies")
