import os
import re

dir_path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'

replacements = {
    # Text
    r'text-slate-900': 'text-ink',
    r'text-slate-800': 'text-ink',
    r'text-slate-700': 'text-ink',
    r'text-slate-600': 'text-muted',
    r'text-slate-500': 'text-muted',
    r'text-slate-400': 'text-subtle',
    r'text-slate-300': 'text-subtle',
    
    # Backgrounds
    r'bg-slate-50': 'bg-bg',
    r'bg-slate-100': 'bg-surface-2',
    r'bg-slate-200': 'bg-surface-2',
    r'bg-slate-800': 'bg-ink',
    r'bg-slate-900': 'bg-ink',
    r'bg-white': 'bg-surface',
    
    # Borders
    r'border-slate-100': 'border-line',
    r'border-slate-200': 'border-line',
    r'border-slate-300': 'border-strong',
    r'border-slate-400': 'border-strong',
    r'border-slate-200/80': 'border-line',
    r'border-slate-300/80': 'border-strong',
    
    # Sky (Accent)
    r'sky-50': 'accent-wash',
    r'sky-100': 'accent-wash',
    r'sky-200': 'accent-wash',
    r'sky-300': 'accent',
    r'sky-400': 'accent',
    r'sky-500': 'accent',
    r'sky-600': 'accent',
    r'sky-700': 'accent-press',
    r'sky-800': 'accent-press',
    r'sky-900': 'accent-press',
    
    # Specific colors
    r'#0284C7': 'rgb(var(--accent))',
    r'#38BDF8': 'rgb(var(--accent))',
    r'#25D366': 'rgb(var(--accent))',
    r'bg-\[\#25D366\]': 'bg-accent',
    r'text-\[\#25D366\]': 'text-accent',
    
    # Remove Dark mode
    r'dark:[A-Za-z0-9\-./\[\]]+': '',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css')):
            replace_in_file(os.path.join(root, file))

print("Replacement complete.")
