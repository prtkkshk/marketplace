import os
import re

def main():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'

    # 1. Update Select.tsx
    select_path = os.path.join(src_dir, 'components', 'ui', 'Select.tsx')
    with open(select_path, 'r', encoding='utf-8') as f:
        select_content = f.read()
    
    if 'options?:' not in select_content:
        select_content = select_content.replace(
            'hint?: string;\n};',
            "hint?: string;\n  options?: { value: string | number; label: string }[] | readonly string[];\n};"
        )
        select_content = select_content.replace(
            'id, children, ...props }, ref) => {',
            'id, children, options, ...props }, ref) => {'
        )
        options_render = """            {options ? options.map((opt) => {
              if (typeof opt === 'string') return <option key={opt} value={opt}>{opt}</option>;
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            }) : children}"""
        select_content = select_content.replace('{children}', options_render)
        with open(select_path, 'w', encoding='utf-8') as f:
            f.write(select_content)

    # 2. Fix EditListingScreen.tsx, ListingDetailScreen.tsx, RequestDetailScreen.tsx (isLoading -> loading)
    for file_name in ['EditListingScreen.tsx', 'ListingDetailScreen.tsx', 'RequestDetailScreen.tsx']:
        path = os.path.join(src_dir, 'features', 'listings' if 'Listing' in file_name else 'wanted', file_name)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('if (isLoading)', 'if (loading)')
            content = content.replace('if (isLoading) {', 'if (loading) {')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

    # 3. Fix SavedItemsScreen.tsx, WantedBoardScreen.tsx, FeedScreen.tsx (loading -> isLoading)
    for path_rel in ['features/saved/SavedItemsScreen.tsx', 'features/wanted/WantedBoardScreen.tsx', 'features/listings/FeedScreen.tsx']:
        path = os.path.join(src_dir, *path_rel.split('/'))
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace(' loading } = useQuery', ' isLoading } = useQuery')
            content = content.replace(', loading,', ', isLoading,')
            content = content.replace('if (loading &&', 'if (isLoading &&')
            content = content.replace('if (loading)', 'if (isLoading)')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

    # 4. Fix ListingCard.tsx
    card_path = os.path.join(src_dir, 'features', 'listings', 'ListingCard.tsx')
    with open(card_path, 'r', encoding='utf-8') as f:
        card_content = f.read()
    card_content = card_content.replace("variant={isSold ? 'sold' : 'negotiable'}", "variant={isSold ? 'danger' : 'success'}")
    with open(card_path, 'w', encoding='utf-8') as f:
        f.write(card_content)

main()
print("Final fixes applied.")
