#!/usr/bin/env python3
# fix_responsive.py
# Place ce fichier dans C:\Users\Alexandre\evend studio\
# Puis exécute: python fix_responsive.py
# Il va rendre tous les templates responsive automatiquement

import os
import re

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'src', 'templates')

# Hook import à ajouter
HOOK_IMPORT = "import { useIsMobile } from '../hooks/useIsMobile';"

# Remplacements responsive — paires (pattern, remplacement mobile)
REPLACEMENTS = [
    # Padding 48px → 24px mobile
    ("padding: '100px 48px'",  "padding: isMobile ? '60px 20px' : '100px 48px'"),
    ("padding: '80px 48px'",   "padding: isMobile ? '60px 20px' : '80px 48px'"),
    ("padding: '60px 48px'",   "padding: isMobile ? '48px 20px' : '60px 48px'"),
    # Grid 2 colonnes → 1 colonne mobile
    ("gridTemplateColumns: '1fr 1fr'",
     "gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'"),
    ("gridTemplateColumns: '1.4fr 1fr'",
     "gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr'"),
    ("gridTemplateColumns: '1fr 1.4fr'",
     "gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr'"),
    ("gridTemplateColumns: '2fr 1fr'",
     "gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr'"),
    ("gridTemplateColumns: '1fr 2fr'",
     "gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr'"),
    # Grid repeat fixe → auto-fill mobile
    ("gridTemplateColumns: 'repeat(4,1fr)'",
     "gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)'"),
    ("gridTemplateColumns: 'repeat(3,1fr)'",
     "gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)'"),
    # Gap 80 → 32 mobile
    ("gap: 80",   "gap: isMobile ? 32 : 80"),
    ("gap: 60",   "gap: isMobile ? 24 : 60"),
    # Max width padding
    ("padding: '0 48px'",  "padding: isMobile ? '0 20px' : '0 48px'"),
    # Hero paddingTop fixe
    ("padding: '60px 48px', width: '100%'",
     "padding: isMobile ? '32px 20px' : '60px 48px', width: '100%'"),
]

def fix_template(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Déjà responsive?
    if 'isMobile' in content:
        print(f"  SKIP (déjà responsive): {os.path.basename(filepath)}")
        return False

    original = content

    # 1. Ajouter import du hook après le premier import React
    if HOOK_IMPORT not in content:
        content = content.replace(
            "import React",
            f"{HOOK_IMPORT}\nimport React",
            1
        )

    # 2. Ajouter le hook dans le composant principal (export default function)
    # Chercher la fonction principale et y injecter le hook
    hook_line = "  const { isMobile, isTablet } = useIsMobile();"

    # Pattern: export default function Template... et le premier useState ou useEffect
    def inject_hook(match):
        block = match.group(0)
        # Injecter après la première ligne du composant
        if 'isMobile' not in block:
            return block.replace(
                "\n  const [",
                f"\n{hook_line}\n  const [",
                1
            )
        return block

    # 3. Appliquer les remplacements responsive
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)

    # 4. Injecter le hook dans le composant principal
    # Trouver export default function et injecter isMobile
    lines = content.split('\n')
    new_lines = []
    in_main_component = False
    hook_injected = False

    for i, line in enumerate(lines):
        new_lines.append(line)

        # Détecter le composant principal
        if 'export default function' in line:
            in_main_component = True

        # Injecter le hook après la première ligne avec useState dans le composant principal
        if in_main_component and not hook_injected:
            if 'useState' in line or 'useEffect' in line:
                if hook_line.strip() not in line:
                    new_lines.insert(-1, hook_line)
                    hook_injected = True

    if hook_injected:
        content = '\n'.join(new_lines)

    # 5. Nav: ajouter menu hamburger mobile simple
    # Rendre le nav responsive (masquer les liens desktop sur mobile)
    content = content.replace(
        "display: 'flex', gap: 32",
        "display: isMobile ? 'none' : 'flex', gap: 32"
    )
    content = content.replace(
        "display: 'flex', gap: 28",
        "display: isMobile ? 'none' : 'flex', gap: 28"
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Modifié: {os.path.basename(filepath)}")
        return True
    else:
        print(f"  ─ Aucun changement: {os.path.basename(filepath)}")
        return False

def main():
    print(f"\n🔍 Dossier templates: {TEMPLATES_DIR}")
    if not os.path.exists(TEMPLATES_DIR):
        print(f"❌ Dossier introuvable: {TEMPLATES_DIR}")
        return

    files = [f for f in os.listdir(TEMPLATES_DIR) if f.startswith('Template') and f.endswith('.tsx')]
    files.sort()

    print(f"📁 {len(files)} templates trouvés\n")

    modified = 0
    for fname in files:
        fpath = os.path.join(TEMPLATES_DIR, fname)
        if fix_template(fpath):
            modified += 1

    print(f"\n✅ {modified}/{len(files)} templates mis à jour")
    print("\n⚠️  N'oublie pas de créer src/hooks/useIsMobile.ts !")

if __name__ == '__main__':
    main()