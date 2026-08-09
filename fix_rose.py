import os
import re

def main():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'
    
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                
                # Rose replacements
                content = content.replace('bg-rose-50 border border-rose-200', 'bg-danger-wash border border-danger/20')
                content = content.replace('bg-rose-50 border-rose-200', 'bg-danger-wash border-danger/20')
                content = content.replace('border-rose-200 bg-rose-50/40', 'border-danger/20 bg-danger-wash')
                content = content.replace('bg-rose-50', 'bg-danger-wash')
                content = content.replace('border-rose-200', 'border-danger/20')
                
                # Whats replacements
                content = content.replace('bg-whats/20 text-whats', 'bg-brand-wash text-brand')
                if 'AdminDashboardScreen' in file:
                    content = content.replace('text-whats', 'text-success')
                    content = content.replace('bg-gradient-to-br from-whats/5 to-transparent border-whats/20', 'bg-gradient-to-br from-success/5 to-transparent border-success/20')
                
                if original != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

main()
print("Replaced all legacy colors")
