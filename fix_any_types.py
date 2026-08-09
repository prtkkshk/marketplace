import os
import re

replacements = [
    # listings.ts and wantedRequests.ts
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const listings = \(data \|\| \[\]\).map\(\(row\) => mapListingRow\(row as any\)\);",
     r"const listings = (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));"),
    
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*return \(data \|\| \[\]\).map\(\(row\) => mapListingRow\(row as any\)\);",
     r"return (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));"),
    
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*return mapListingRow\(data as any\);",
     r"return mapListingRow(data as unknown as Parameters<typeof mapListingRow>[0]);"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const requests = \(data \|\| \[\]\).map\(\(row\) => mapWantedRequestRow\(row as any\)\);",
     r"const requests = (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));"),
    
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*return \(data \|\| \[\]\).map\(\(row\) => mapWantedRequestRow\(row as any\)\);",
     r"return (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*return mapWantedRequestRow\(data as any\);",
     r"return mapWantedRequestRow(data as unknown as Parameters<typeof mapWantedRequestRow>[0]);"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*return \(data \|\| \[\]\).map\(\(row: any\) => mapListingRow\(row\.listings\)\);",
     r"return (data || []).map((row) => mapListingRow(row.listings as unknown as Parameters<typeof mapListingRow>[0]));"),
    
    # CreateListingScreen / EditListingScreen / CreateWantedRequestScreen
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*category: data.category as any,",
     r"category: data.category as import('../../lib/database.types').ListingCategory,"),
    
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*condition: data.condition as any,",
     r"condition: data.condition as import('../../lib/database.types').ItemCondition,"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*hallOfResidence: item.hallOfResidence as any,",
     r"hallOfResidence: item.hallOfResidence,"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*hallOfResidence: \(profile\?\.hallOfResidence as any\) \|\| 'Patel',",
     r"hallOfResidence: profile?.hallOfResidence || 'Patel',"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*\} catch \(err: any\) \{",
     r"} catch (err: unknown) {"),
     
    # PWAInstaller.tsx
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const isIos = /iPad\|iPhone\|iPod/.test\(navigator.userAgent\) && !\(window as any\).MSStream;\n\s*// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const isStandalone = window.matchMedia\('\(display-mode: standalone\)'\).matches || \(navigator as any\).standalone;",
     r"const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;\n  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone: boolean }).standalone;"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const isStandalone = window.matchMedia\('\(display-mode: standalone\)'\).matches || \(navigator as any\).standalone;",
     r"const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone: boolean }).standalone;"),
     
    # WantedBoardScreen.tsx
    (r"\{\/\* eslint-disable-next-line @typescript-eslint/no-explicit-any \*\/\}\n\s*\{React.createElement\(\(LucideIcons as any\)\[cat.icon\], \{ className: 'w-4 h-4' \}\)\}",
     r"{React.createElement((LucideIcons as Record<string, React.ElementType>)[cat.icon], { className: 'w-4 h-4' })}"),
     
    # admin.ts
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const \{ error \} = await supabase.from\('profiles'\).update\(payload as any\).eq\('id', targetUser.id\);",
     r"const { error } = await supabase.from('profiles').update(payload as import('../database.types').Database['public']['Tables']['profiles']['Update']).eq('id', targetUser.id);"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const \{ error \} = await supabase.from\('listings'\).update\(payload as any\).eq\('id', listingId\);",
     r"const { error } = await supabase.from('listings').update(payload as import('../database.types').Database['public']['Tables']['listings']['Update']).eq('id', listingId);"),
     
    # profiles.ts
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*\.upsert\(payload as any, \{ onConflict: 'id' \}\);",
     r".upsert(payload as import('../database.types').Database['public']['Tables']['profiles']['Insert'], { onConflict: 'id' });"),
     
    # hooks
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*queryClient.setQueriesData<any>\(\{ queryKey: \['listings'\] \}, \(oldData: any\) => \{",
     r"queryClient.setQueriesData({ queryKey: ['listings'] }, (oldData: unknown) => {"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*queryClient.setQueriesData<any>\(\{ queryKey: \['myListings'\] \}, \(oldData: any\) => \{",
     r"queryClient.setQueriesData({ queryKey: ['myListings'] }, (oldData: unknown) => {"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const optimisticFilterFn = \(oldData: any\) => \{",
     r"const optimisticFilterFn = (oldData: unknown) => {"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*queryClient.setQueriesData<any>\(\{ queryKey: \['wantedRequests'\] \}, optimisticFilterFn\);",
     r"queryClient.setQueriesData({ queryKey: ['wantedRequests'] }, optimisticFilterFn);"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*queryClient.setQueriesData<any>\(\{ queryKey: \['myWantedRequests'\] \}, optimisticFilterFn\);",
     r"queryClient.setQueriesData({ queryKey: ['myWantedRequests'] }, optimisticFilterFn);"),
     
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const optimisticUpdateFn = \(oldData: any\) => \{",
     r"const optimisticUpdateFn = (oldData: unknown) => {"),
     
    # CategoryPills.tsx
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const Icon = \(LucideIcons as any\)\[cat\.icon\];",
     r"const Icon = (LucideIcons as Record<string, React.ElementType>)[cat.icon];"),
     
    # AdminListingsScreen.tsx
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*const \[items, setItems\] = useState<any\[\]>\(\[\]\);",
     r"const [items, setItems] = useState<unknown[]>([]);"),
     
    # CompleteProfileScreen.tsx
    (r"// eslint-disable-next-line @typescript-eslint/no-explicit-any\n\s*\} catch \(err: any\) \{",
     r"} catch (err: unknown) {")
]

def apply_replacements(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            apply_replacements(os.path.join(root, f))
