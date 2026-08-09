import os
import re

def main():
    src_dir = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src'

    # Fix helperText -> hint
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                content = content.replace('helperText=', 'hint=')
                
                # Fix DevGalleryScreen imports
                if file == 'DevGalleryScreen.tsx':
                    content = content.replace('@/components', '../../components')
                    
                # Fix EmptyState secondaryActionLabel -> action
                # Actually secondaryActionLabel is only in FeedScreen.tsx
                if file == 'FeedScreen.tsx':
                    content = content.replace('secondaryActionLabel="Clear filters"\n            onSecondaryAction={clearFilters}', '')
                    content = content.replace('className="w-32"', '') # SortDropdown className
                    content = content.replace('const { data, isLoading, error, hasMore, fetchNextPage } = useListings', 'const { data, isLoading, error, hasMore, fetchNextPage } = useListings')
                    content = content.replace('if (loading', 'if (isLoading')

                if file in ['EditListingScreen.tsx', 'ListingDetailScreen.tsx', 'RequestDetailScreen.tsx']:
                    # Revert the mistake: loading -> isLoading where used
                    content = content.replace('if (loading)', 'if (isLoading)')
                    content = content.replace('if (loading) {', 'if (isLoading) {')
                    content = content.replace('if (loading &&', 'if (isLoading &&')
                    
                if file in ['WantedBoardScreen.tsx', 'SavedItemsScreen.tsx']:
                    content = content.replace('loading } = useQuery', 'isLoading } = useQuery')
                    content = content.replace('if (loading)', 'if (isLoading)')
                    content = content.replace('if (loading &&', 'if (isLoading &&')
                    content = content.replace('loading,', 'isLoading,')

                if file == 'ListingCard.tsx':
                    content = re.sub(r"variant=\{isSold \? 'sold' : 'negotiable'\}", "variant={isSold ? 'danger' : 'success'}", content)

                if original != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

main()
print("Done final manual fixes")
