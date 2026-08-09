import os

for root, _, files in os.walk('src/lib/data'):
    for f in files:
        if not f.endswith('.ts'): continue
        filepath = os.path.join(root, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content.replace("\\'", "'")
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Fixed {f}')
