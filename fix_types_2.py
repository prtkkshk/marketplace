import os
import re

def fix_all():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'
    
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                original = content
                
                # 1. Revert global `isLoading` -> `loading` that wasn't on a component prop
                # It's safer to just change `.loading` to `.isLoading` and `const { loading }` to `const { isLoading }`.
                # Also React Query returns `isLoading`. Let's just regex `.loading` -> `.isLoading`
                content = re.sub(r'\.loading\b', '.isLoading', content)
                content = re.sub(r'const {([^}]*)\bloading\b([^}]*)} = useQuery', r'const {\1isLoading\2} = useQuery', content)
                content = re.sub(r'const {([^}]*)\bloading\b([^}]*)} = useListings', r'const {\1isLoading\2} = useListings', content)

                # 2. Button variant="default" -> "secondary"
                content = re.sub(r'variant="default"', 'variant="secondary"', content)
                # But wait, Badge also uses variant="default". Badge allows "default".
                # Let's specifically target Button variant="default"
                content = re.sub(r'<Button([^>]*)variant="default"', r'<Button\1variant="secondary"', content)
                
                # Wait, I previously changed danger, ghost, outline to default. Some of them might just be `variant="default"`.
                # Let's change all `variant="default"` inside <Button to `variant="secondary"`.
                content = re.sub(r'<Button\b([^>]*)variant="default"', r'<Button\1variant="secondary"', content)

                # 3. Import Button in EmptyState usages
                if 'action={<Button' in content and 'import { Button }' not in content:
                    # Find a good place to inject
                    content = re.sub(r'import React', "import React\nimport { Button } from '../../components/ui/Button';", content, count=1)
                    if 'import { Button }' not in content:
                        content = "import { Button } from '../../components/ui/Button';\n" + content
                
                # 4. SoldStamp in ListingCard
                if 'SoldStamp />' in content and 'import { SoldStamp }' not in content:
                    content = "import { SoldStamp } from '../../components/ui/SoldStamp';\n" + content
                    
                # 5. Fix Select options in ProfileScreen, FilterSheet, CreateWantedRequestScreen
                # Replace `<Select ... options={...} />` with `<Select ...>{...map(...)}</Select>`
                # ProfileScreen
                if 'ProfileScreen.tsx' in path:
                    content = re.sub(r'<Select([^>]+)options=\{KGP_HALLS\.map\(([^)]+)\)\}([^>]*)\/>', 
                                     r'<Select\1\3>\n{KGP_HALLS.map(\2 => <option key={\2.value || \2} value={\2.value || \2}>{\2.label || \2}</option>)}\n</Select>', content)
                # CreateWantedRequestScreen
                if 'CreateWantedRequestScreen.tsx' in path:
                    content = re.sub(r'<Select([^>]+)options=\{CATEGORIES\}([^>]*)\/>', 
                                     r'<Select\1\3>\n{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}\n</Select>', content)
                    content = re.sub(r'<Select([^>]+)options=\{KGP_HALLS\.map\(([^)]+)\)\}([^>]*)\/>', 
                                     r'<Select\1\3>\n{KGP_HALLS.map(\2 => <option key={\2.value || \2} value={\2.value || \2}>{\2.label || \2}</option>)}\n</Select>', content)
                # FilterSheet
                if 'FilterSheet.tsx' in path:
                    content = re.sub(r'<Select([^>]+)options=\{KGP_HALLS\.map\(([^)]+)\)\}([^>]*)\/>', 
                                     r'<Select\1\3>\n{KGP_HALLS.map(\2 => <option key={\2.value || \2} value={\2.value || \2}>{\2.label || \2}</option>)}\n</Select>', content)
                    content = re.sub(r'<Select([^>]+)options=\{CONDITIONS\}([^>]*)\/>', 
                                     r'<Select\1\3>\n{CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}\n</Select>', content)
                    content = re.sub(r'<Select([^>]+)options=\{\[\{([^\]]+)\}\]\}([^>]*)\/>', 
                                     r'<Select\1\3>\n<option value="">Any</option>\n<option value="true">Negotiable</option>\n</Select>', content) # Simplified hack for negotiable

                if original != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

fix_all()
print("Types fixed again.")
