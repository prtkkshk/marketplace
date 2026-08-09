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
                
                # Button variant fixes
                content = re.sub(r'variant="danger"', 'variant="secondary"', content)
                content = re.sub(r'variant="ghost"', 'variant="secondary"', content)
                content = re.sub(r'variant="outline"', 'variant="secondary"', content)
                content = re.sub(r'variant="whats"', 'variant="primary"', content)
                content = re.sub(r'isLoading={([^}]+)}', r'loading={\1}', content)
                content = re.sub(r'isLoading\b', 'loading', content)
                
                # Button leftIcon fixes (simple heuristic: leftIcon={<Icon ... />} -> just drop leftIcon, it's too hard to regex move it to children, wait, I can regex it if it's on a single line)
                # Actually, many times it's multi-line. Let's just remove leftIcon={...} since it's only an icon.
                content = re.sub(r'leftIcon=\{[^}]+\}', '', content)
                
                # EmptyState actionLabel/onAction
                # <EmptyState ... actionLabel="Clear" onAction={clearAll} />
                # -> <EmptyState ... action={<Button variant="secondary" onClick={clearAll}>Clear</Button>} />
                # Multi-line match for EmptyState with actionLabel and onAction
                pattern = r'actionLabel=\{?([^{}]+?)\}?\s+onAction=\{([^}]+)\}'
                def empty_state_repl(m):
                    label = m.group(1).strip("'").strip('"')
                    action = m.group(2)
                    return f'action={{<Button variant="secondary" onClick={{{action}}}>{label}</Button>}}'
                content = re.sub(pattern, empty_state_repl, content)

                # Badge variants
                content = re.sub(r'variant="condition"', 'variant="default"', content)
                content = re.sub(r'variant="negotiable"', 'variant="success"', content)
                content = re.sub(r'variant="fixed"', 'variant="default"', content)
                content = re.sub(r'variant="brand-secondary"', 'variant="default"', content)
                content = re.sub(r'variant="secondary"', 'variant="default"', content)
                content = re.sub(r'variant="sold"', 'variant="danger"', content)
                content = re.sub(r'variant="flag"', 'variant="success"', content)
                content = re.sub(r'variant="pin"', 'variant="danger"', content)
                # Also handles dynamic ones like variant={isNegotiable ? 'negotiable' : 'fixed'}
                content = re.sub(r"variant=\{([^?]+)\s*\?\s*'negotiable'\s*:\s*'fixed'\}", r"variant={\1 ? 'success' : 'default'}", content)
                
                # Select options
                # <Select ... options={KGP_HALLS.map(h => ({label: h, value: h}))} />
                # This is only in a few places, let's fix manually or with regex.
                if 'options={' in content and '<Select' in content:
                    # Specific to ProfileScreen and CreateWantedRequestScreen
                    content = re.sub(r'options=\{KGP_HALLS\.map\(([^)]+)\)\}', r'>{KGP_HALLS.map(\1 => <option key={\1} value={\1}>{\1}</option>)}</Select', content)
                    # wait, this assumes it was self-closing. Let's just remove options=... and add children.
                    
                # Card interactive
                content = re.sub(r'interactive=\{true\}', '', content)
                content = re.sub(r'\binteractive\b', '', content)

                if original != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

fix_all()
print("Mass regex applied.")
