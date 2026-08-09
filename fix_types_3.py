import os

def fix_all():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'
    
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                original = content
                
                # 1. variant="default" to variant="secondary" in Buttons
                # Since badges might use variant="default", let's just do a naive replacement 
                # but only if it's on a line with Button or closely following it.
                # Actually, Badge variant "default" is fine to become "secondary"? No, Badge has no "secondary".
                # Let's just replace all variant="default" with variant="secondary" and then 
                # change <Badge variant="secondary" back to "default".
                content = content.replace('variant="default"', 'variant="secondary"')
                content = content.replace('<Badge variant="secondary"', '<Badge variant="default"')
                content = content.replace('<Badge\n              variant="secondary"', '<Badge\n              variant="default"')
                
                # 2. loading in useQuery -> isLoading
                content = content.replace(', loading } = useQuery', ', isLoading } = useQuery')
                content = content.replace(', loading } = useListings', ', isLoading } = useListings')
                content = content.replace('if (loading)', 'if (isLoading)') # mostly safe if they were destructured
                
                # 3. Import Button in files that need it
                if '<Button' in content and 'import { Button }' not in content:
                    content = "import { Button } from '../../components/ui/Button';\n" + content
                
                # 4. Fix specific Selects
                # ProfileScreen
                if 'ProfileScreen.tsx' in path:
                    # options={KGP_HALLS.map(h => ({label: h, value: h}))}
                    content = content.replace(
                        'options={KGP_HALLS.map(h => ({label: h, value: h}))}', 
                        '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'
                    )
                    # wait, if it was self-closing: `/>` is still there. 
                    content = content.replace('</Select />', '</Select>')
                
                # CreateWantedRequestScreen
                if 'CreateWantedRequestScreen.tsx' in path:
                    content = content.replace(
                        'options={CATEGORIES}', 
                        '>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'
                    )
                    content = content.replace(
                        'options={KGP_HALLS.map(h => ({label: h, value: h}))}', 
                        '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'
                    )
                    content = content.replace('</Select />', '</Select>')
                    content = content.replace('</Select> >', '</Select>') # fix any weirdness

                # FilterSheet
                if 'FilterSheet.tsx' in path:
                    content = content.replace(
                        'options={KGP_HALLS.map(h => ({label: h, value: h}))}', 
                        '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'
                    )
                    content = content.replace(
                        'options={CONDITIONS}', 
                        '>{CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'
                    )
                    content = content.replace(
                        'options={[{label: \'Any\', value: \'\'}, {label: \'Negotiable\', value: \'true\'}]}',
                        '><option value="">Any</option><option value="true">Negotiable</option></Select'
                    )
                    content = content.replace('</Select />', '</Select>')

                # 5. Fix remaining SoldStamp error in ListingCard
                if 'ListingCard.tsx' in path:
                    if 'SoldStamp' in content and 'import { SoldStamp }' not in content:
                        content = "import { SoldStamp } from './SoldStamp';\n" + content
                        # Wait, SoldStamp is in components/ui.
                        content = content.replace("import { SoldStamp } from './SoldStamp';\n", "import { SoldStamp } from '../../components/ui/SoldStamp';\n")

                if original != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

fix_all()
print("Applied targeted fixes.")
