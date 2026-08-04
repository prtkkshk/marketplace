import os

replacements = {
    'bg-surface-bg': 'bg-paper',
    'bg-surface-card': 'bg-surface',
    'border-surface-border': 'border-line',
    'text-content-primary': 'text-ink',
    'text-content-muted': 'text-ink-3',
    'text-brand-primary': 'text-brand',
    'bg-brand-primary': 'bg-brand',
    'text-status-danger': 'text-danger',
    'bg-emerald-600': 'bg-whats',
    'shadow-xs': 'shadow-1'
}

src_dir = 'C:/Users/prtkk/Desktop/kgp_marketplace/src'

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.css'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
