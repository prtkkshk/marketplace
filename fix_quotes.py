import os

files = [
    'src/features/listings/CreateListingScreen.tsx',
    'src/features/listings/EditListingScreen.tsx',
    'src/features/wanted/CreateWantedRequestScreen.tsx',
    'src/lib/data/admin.ts',
    'src/lib/data/profiles.ts',
]

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = content.replace("\\'", "'")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Fixed quotes in {filepath}")

