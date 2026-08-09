import os

replacements = {
    r'src\features\listings\CreateListingScreen.tsx': [
        ('options={KGP_HALLS.map(h => ({label: h, value: h}))}', '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'),
        ('options={CATEGORIES}', '>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('options={CONDITIONS}', '>{CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('</Select />', '</Select>')
    ],
    r'src\features\listings\EditListingScreen.tsx': [
        ('const [loading, setLoading]', 'const [isLoading, setLoading]'),
        ('setLoading(', 'setLoading('),
        ('if (loading)', 'if (isLoading)'),
        ('options={KGP_HALLS.map(h => ({label: h, value: h}))}', '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'),
        ('options={CATEGORIES}', '>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('options={CONDITIONS}', '>{CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('</Select />', '</Select>')
    ],
    r'src\features\listings\FeedScreen.tsx': [
        ('const { data, loading, error, hasMore, fetchNextPage } = useListings({', 'const { data, isLoading, error, hasMore, fetchNextPage } = useListings({'),
        ('if (loading && ', 'if (isLoading && '),
        ('secondaryActionLabel="Clear filters"', ''),
        ('onSecondaryAction={clearFilters}', ''),
    ],
    r'src\features\listings\FilterSheet.tsx': [
        ('options={KGP_HALLS.map(h => ({ label: h, value: h }))}', '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'),
        ('options={CONDITIONS.map(c => ({ label: c.label, value: c.id }))}', '>{CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('</Select />', '</Select>')
    ],
    r'src\features\listings\ListingCard.tsx': [
        ('variant={isSold ? \'sold\' : \'negotiable\'}', 'variant={isSold ? \'danger\' : \'success\'}')
    ],
    r'src\features\listings\ListingDetailScreen.tsx': [
        ('const [loading, setLoading]', 'const [isLoading, setLoading]'),
        ('if (loading) {', 'if (isLoading) {')
    ],
    r'src\features\profile\ProfileScreen.tsx': [
        ('options={KGP_HALLS.map(h => ({label: h, value: h}))}', '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'),
        ('</Select />', '</Select>')
    ],
    r'src\features\saved\SavedItemsScreen.tsx': [
        ('const { data: savedItems = [], loading } = useQuery', 'const { data: savedItems = [], isLoading } = useQuery'),
        ('if (loading) {', 'if (isLoading) {')
    ],
    r'src\features\wanted\CreateWantedRequestScreen.tsx': [
        ('options={CATEGORIES}', '>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select'),
        ('options={KGP_HALLS.map(h => ({label: h, value: h}))}', '>{KGP_HALLS.map(h => <option key={h} value={h}>{h}</option>)}</Select'),
        ('</Select />', '</Select>')
    ],
    r'src\features\wanted\RequestDetailScreen.tsx': [
        ('const [loading, setLoading]', 'const [isLoading, setLoading]'),
        ('if (loading)', 'if (isLoading)')
    ],
    r'src\features\wanted\WantedBoardScreen.tsx': [
        ('const { data, loading, error, hasMore, fetchNextPage } = useQuery({', 'const { data, isLoading, error, hasMore, fetchNextPage } = useQuery({'),
        ('if (loading &&', 'if (isLoading &&')
    ]
}

for file_path, reps in replacements.items():
    full_path = os.path.join(r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase', file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in reps:
            content = content.replace(old, new)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
print("Manual fixes applied.")
