import os

files = {
    r'src\components\ui\Badge.tsx': [("import { clsx } from 'clsx';", "import { clsx } from 'clsx';\n")], # Just touch it to recompile maybe? No, the error is 'Cannot find module clsx'. Actually, it's `import { clsx } from 'clsx'` which is correct. Wait, maybe the library is not installed? But package.json says `clsx`. The issue is `clsx` exports default? Let's use `import clsx from 'clsx';` in all components instead of `import { clsx } from 'clsx';`.
    
    r'src\features\admin\AdminAnnouncementsScreen.tsx': [
        ('variant="warning"', 'variant="danger"'),
        ('variant="outline"', 'variant="secondary"'),
        ('label: c.label }))}', 'label: c.label }))}\n                  label="Type"')
    ],
    r'src\features\admin\AdminDashboardScreen.tsx': [
        ('const { data: stats, loading }', 'const { data: stats, isLoading: loading }'),
        ('if (loading)', 'if (loading)')
    ],
    r'src\features\admin\AdminListingsScreen.tsx': [
        ('variant="muted"', 'variant="default"')
    ],
    r'src\features\admin\AdminReportsScreen.tsx': [
        ('variant="muted"', 'variant="default"')
    ],
    r'src\features\admin\AdminUsersScreen.tsx': [
        ('<Input\n                  type="text"', '<Input label="Search" type="text"'),
        ('<Input type="text"', '<Input label="Search" type="text"')
    ],
    r'src\features\auth\Guards.tsx': [
        ('const { session, loading }', 'const { session, isLoading: loading }'),
        ('const { profile, loading }', 'const { profile, isLoading: loading }')
    ],
    r'src\features\listings\FeedScreen.tsx': [
        ('className="w-32"', ''),
        ('secondaryActionLabel="Clear filters"\n            onSecondaryAction={clearFilters}', ''),
        ('const { data, isLoading, error, hasMore, fetchNextPage } = useListings', 'const { data, isLoading: loading, error, hasMore, fetchNextPage } = useListings')
    ],
    r'src\features\listings\ListingCard.tsx': [
        ("variant={isSold ? 'sold' : 'negotiable'}", "variant={isSold ? 'danger' : 'success'}")
    ],
    r'src\features\listings\ListingDetailScreen.tsx': [
        ('const [isLoading, setLoading]', 'const [loading, setLoading]')
    ],
    r'src\features\saved\SavedItemsScreen.tsx': [
        ('const { data: savedItems = [], isLoading }', 'const { data: savedItems = [], isLoading: loading }'),
        ('const { data: savedItems = [], loading }', 'const { data: savedItems = [], isLoading: loading }')
    ],
    r'src\features\wanted\RequestDetailScreen.tsx': [
        ('const [isLoading, setLoading]', 'const [loading, setLoading]')
    ],
    r'src\features\wanted\WantedBoardScreen.tsx': [
        ('const { data, isLoading, error, hasMore, fetchNextPage } = useQuery', 'const { data, isLoading: loading, error, hasMore, fetchNextPage } = useQuery'),
        ('const { data, loading, error, hasMore, fetchNextPage } = useQuery', 'const { data, isLoading: loading, error, hasMore, fetchNextPage } = useQuery')
    ]
}

src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase'
for rel_path, reps in files.items():
    path = os.path.join(src_dir, rel_path)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in reps:
            content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

# Change import { clsx } to import clsx across all ui components
ui_dir = os.path.join(src_dir, r'src\components\ui')
for file in os.listdir(ui_dir):
    if file.endswith('.tsx'):
        path = os.path.join(ui_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace("import { clsx } from 'clsx';", "import clsx from 'clsx';")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Final ultimate TS fixes applied.")
