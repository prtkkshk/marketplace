import os
import re

def fix_all():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'
    
    reps = {
        r'src\features\admin\AdminAnnouncementsScreen.tsx': [
            ('<Textarea', '<Textarea label="Message"'),
            ('<Select', '<Select label="Type"'),
            ('variant="warning"', 'variant="danger"'),
            ('variant="muted"', 'variant="default"'),
            ('variant="outline"', 'variant="secondary"')
        ],
        r'src\features\admin\AdminDashboardScreen.tsx': [
            ('const { data: stats, loading } = useQuery', 'const { data: stats, isLoading: loading } = useQuery')
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
        r'src\features\auth\CompleteProfileScreen.tsx': [
            ('placeholder="Select your hall"', '') # Select has no placeholder
        ],
        r'src\features\auth\Guards.tsx': [
            ('const { session, loading } = useAuth();', 'const { session, isLoading } = useAuth();'),
            ('const { profile, loading } = useAuth();', 'const { profile, isLoading } = useAuth();'),
            ('if (loading)', 'if (isLoading)')
        ],
        r'src\features\listings\FeedScreen.tsx': [
            ('if (loading &&', 'if (isLoading &&'),
            ('const { data, loading, error, hasMore, fetchNextPage } = useListings', 'const { data, isLoading, error, hasMore, fetchNextPage } = useListings')
        ],
        r'src\features\listings\ListingDetailScreen.tsx': [
            ('if (loading)', 'if (isLoading)'),
            ('if (loading) {', 'if (isLoading) {')
        ],
        r'src\features\saved\SavedItemsScreen.tsx': [
            ('const { data: savedItems = [], loading } = useQuery', 'const { data: savedItems = [], isLoading } = useQuery'),
            ('if (loading) {', 'if (isLoading) {')
        ],
        r'src\features\wanted\RequestDetailScreen.tsx': [
            ('if (loading)', 'if (isLoading)')
        ],
        r'src\features\wanted\WantedBoardScreen.tsx': [
            ('const { data, loading, error, hasMore, fetchNextPage } = useQuery', 'const { data, isLoading, error, hasMore, fetchNextPage } = useQuery'),
            ('if (loading &&', 'if (isLoading &&')
        ],
        r'src\components\ui\SoldStamp.tsx': [
            ("import clsx from 'clsx';", "import { clsx } from 'clsx';")
        ],
        r'src\components\ui\Textarea.tsx': [
            ("import clsx from 'clsx';", "import { clsx } from 'clsx';")
        ],
        r'src\components\ui\Toast.tsx': [
            ("import clsx from 'clsx';", "import { clsx } from 'clsx';")
        ]
    }

    for rel_path, replacements in reps.items():
        path = os.path.join(r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase', rel_path)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for old, new in replacements:
                content = content.replace(old, new)
            if original != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)

fix_all()
print("Final manual fixes pass 2.")
