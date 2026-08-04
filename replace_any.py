import os

files = [
    'src/features/auth/CompleteProfileScreen.tsx',
    'src/features/listings/CreateListingScreen.tsx',
    'src/features/listings/EditListingScreen.tsx',
    'src/features/pwa/PWAInstaller.tsx',
    'src/features/wanted/CreateWantedRequestScreen.tsx',
    'src/lib/data/admin.ts',
    'src/lib/data/listings.ts',
    'src/lib/data/profiles.ts',
    'src/lib/data/saved_items.ts',
    'src/lib/data/wantedRequests.ts',
    'src/lib/hooks/useDeleteListingMutation.ts',
    'src/lib/hooks/useDeleteWantedRequestMutation.ts',
    'src/lib/hooks/useToggleFulfilledMutation.ts',
    'src/lib/hooks/useToggleSoldMutation.ts',
    'tests/unit/listings.test.ts'
]

for f in files:
    if os.path.exists(f):
        content = open(f, 'r', encoding='utf-8').read()
        content = content.replace(': any', ': unknown')
        content = content.replace('<any>', '<unknown>')
        content = content.replace('as any', 'as unknown')
        open(f, 'w', encoding='utf-8').write(content)
        print(f"Updated {f}")
    else:
        print(f"File not found: {f}")
