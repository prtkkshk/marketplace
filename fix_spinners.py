import os
import re

files_to_fix = {
    'ListingDetailScreen.tsx': '''
        <div className="flex flex-col animate-pulse p-4 md:p-0">
            <div className="aspect-[4/3] md:aspect-[16/9] w-full bg-surface-2 rounded-2xl mb-4" />
            <div className="space-y-4">
                <div className="h-8 bg-surface-2 rounded w-3/4" />
                <div className="h-6 bg-surface-2 rounded w-1/4" />
                <div className="flex gap-2">
                    <div className="h-6 bg-surface-2 rounded-full w-20" />
                    <div className="h-6 bg-surface-2 rounded-full w-20" />
                </div>
                <div className="space-y-2 mt-4">
                    <div className="h-4 bg-surface-2 rounded w-full" />
                    <div className="h-4 bg-surface-2 rounded w-full" />
                    <div className="h-4 bg-surface-2 rounded w-5/6" />
                </div>
            </div>
        </div>
    ''',
    'RequestDetailScreen.tsx': '''
        <div className="flex flex-col animate-pulse p-4 md:p-0 pt-4">
            <div className="space-y-4">
                <div className="h-8 bg-surface-2 rounded w-3/4" />
                <div className="h-6 bg-surface-2 rounded w-1/4" />
                <div className="h-6 bg-surface-2 rounded-full w-24" />
                <div className="space-y-2 mt-4">
                    <div className="h-4 bg-surface-2 rounded w-full" />
                    <div className="h-4 bg-surface-2 rounded w-5/6" />
                </div>
            </div>
        </div>
    ''',
    'AdminDashboardScreen.tsx': '''
        <div className="flex flex-col animate-pulse gap-4 w-full">
            <div className="h-8 bg-surface-2 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="h-24 bg-surface-2 rounded-xl" />
                <div className="h-24 bg-surface-2 rounded-xl" />
                <div className="h-24 bg-surface-2 rounded-xl" />
                <div className="h-24 bg-surface-2 rounded-xl" />
            </div>
            <div className="h-64 bg-surface-2 rounded-xl mt-4" />
        </div>
    '''
}

generic_admin_table_skeleton = '''
        <div className="flex flex-col animate-pulse gap-4 w-full">
            <div className="h-8 bg-surface-2 rounded w-1/4 mb-4" />
            <div className="h-10 bg-surface-2 rounded w-full" />
            <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface-2 rounded w-full" />)}
            </div>
        </div>
'''

admin_list_screens = [
    'AdminListingsScreen.tsx',
    'AdminReportsScreen.tsx',
    'AdminUsersScreen.tsx',
    'AdminAnnouncementsScreen.tsx',
    'AdminAuditScreen.tsx'
]

for s in admin_list_screens:
    files_to_fix[s] = generic_admin_table_skeleton

def process_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if empty states exist
    if 'EmptyState' not in content and 'Admin' in filename:
        content = content.replace("import { Spinner } from", "import { EmptyState } from '../../components/ui/EmptyState';\nimport { Spinner } from")
    
    if 'ErrorState' not in content and 'Admin' in filename:
        content = content.replace("import { Spinner } from", "import { ErrorState } from '../../components/ui/ErrorState';\nimport { Spinner } from")

    pattern = r'<div className="[^"]*">\s*<Spinner.*?/>\s*</div>'
    
    new_content = re.sub(pattern, files_to_fix[filename].strip(), content, flags=re.DOTALL)

    # Make sure we have EmptyState logic
    if 'if (!stats) return null;' in new_content:
        new_content = new_content.replace(
            'if (!stats) return null;',
            'if (!stats) return <EmptyState icon={<div />} title="No data" description="No data available" />;'
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Processed {filename}")

def find_and_process():
    for root, dirs, files in os.walk('C:/Users/prtkk/Desktop/kgp_marketplace/codebase/src'):
        for f in files:
            if f in files_to_fix:
                process_file(os.path.join(root, f), f)

find_and_process()
