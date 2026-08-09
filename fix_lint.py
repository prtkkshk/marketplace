import os

replacements = {
    # exhaustive-deps
    'src/features/admin/AdminAnnouncementsScreen.tsx': [
        ('// eslint-disable-next-line react-hooks/exhaustive-deps\n', ''),
        ('import React, { useState, useEffect } from \'react\';', 'import React, { useState, useEffect, useCallback } from \'react\';'),
        ('''  const loadAnnouncements = async () => {
    setLoading(true);
    fetchAnnouncementsList()
      .then((data) => setAnnouncements(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);''', '''  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    fetchAnnouncementsList()
      .then((data) => setAnnouncements(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);''')
    ],
    'src/features/admin/AdminAuditScreen.tsx': [
        ('// eslint-disable-next-line react-hooks/exhaustive-deps\n', ''),
        ('''  useEffect(() => {
    fetchAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);''', '''  useEffect(() => {
    fetchAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);''')
    ],
    'src/features/admin/AdminListingsScreen.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const [items, setItems] = useState<any[]>([]);', '  const [items, setItems] = useState<unknown[]>([]);'),
        ('// eslint-disable-next-line react-hooks/exhaustive-deps\n', ''),
        ('import React, { useState, useEffect } from \'react\';', 'import React, { useState, useEffect, useCallback } from \'react\';'),
        ('''  const loadListings = async () => {
    setLoading(true);
    fetchAdminListings(statusFilter)
      .then((data) => setItems(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadListings();
  }, [statusFilter]);''', '''  const loadListings = useCallback(async () => {
    setLoading(true);
    fetchAdminListings(statusFilter)
      .then((data) => setItems(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, showToast]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);''')
    ],
    'src/features/admin/AdminReportsScreen.tsx': [
        ('// eslint-disable-next-line react-hooks/exhaustive-deps\n', ''),
        ('import React, { useState, useEffect } from \'react\';', 'import React, { useState, useEffect, useCallback } from \'react\';'),
        ('''  const loadReports = async () => {
    setLoading(true);
    fetchReportsQueue(statusFilter, reasonFilter)
      .then((data) => setReports(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, reasonFilter]);''', '''  const loadReports = useCallback(async () => {
    setLoading(true);
    fetchReportsQueue(statusFilter, reasonFilter)
      .then((data) => setReports(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, reasonFilter, showToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);''')
    ],
    'src/features/admin/AdminUsersScreen.tsx': [
        ('// eslint-disable-next-line react-hooks/exhaustive-deps\n', ''),
        ('import React, { useState, useEffect } from \'react\';', 'import React, { useState, useEffect, useCallback } from \'react\';'),
        ('''  const loadUsers = async () => {
    setLoading(true);
    fetchUsersList(search, hallFilter)
      .then((data) => setUsers(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, hallFilter]);''', '''  const loadUsers = useCallback(async () => {
    setLoading(true);
    fetchUsersList(search, hallFilter)
      .then((data) => setUsers(data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [search, hallFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);''')
    ],
    
    # no-explicit-any fixes
    'src/lib/data/listings.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const listings = (data || []).map((row) => mapListingRow(row as any));', '  const listings = (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  return (data || []).map((row) => mapListingRow(row as any));', '  return (data || []).map((row) => mapListingRow(row as unknown as Parameters<typeof mapListingRow>[0]));'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  return mapListingRow(data as any);', '  return mapListingRow(data as unknown as Parameters<typeof mapListingRow>[0]);')
    ],
    'src/lib/data/wantedRequests.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const requests = (data || []).map((row) => mapWantedRequestRow(row as any));', '  const requests = (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  return (data || []).map((row) => mapWantedRequestRow(row as any));', '  return (data || []).map((row) => mapWantedRequestRow(row as unknown as Parameters<typeof mapWantedRequestRow>[0]));'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  return mapWantedRequestRow(data as any);', '  return mapWantedRequestRow(data as unknown as Parameters<typeof mapWantedRequestRow>[0]);')
    ],
    'src/lib/data/saved_items.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  return (data || []).map((row: any) => mapListingRow(row.listings));', '  return (data || []).map((row) => mapListingRow(row.listings as unknown as Parameters<typeof mapListingRow>[0]));')
    ],
    'src/features/listings/EditListingScreen.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      category: data.category as any,', '      category: data.category as import(\'../../lib/database.types\').ListingCategory,'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      condition: data.condition as any,', '      condition: data.condition as import(\'../../lib/database.types\').ItemCondition,'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    } catch (err: any) {', '    } catch (err: unknown) {')
    ],
    'src/features/wanted/CreateWantedRequestScreen.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n        hallOfResidence: (profile?.hallOfResidence as any) || \'Patel\',', '        hallOfResidence: profile?.hallOfResidence || \'Patel\','),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      category: data.category as any,', '      category: data.category as import(\'../../lib/database.types\').ListingCategory,'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    } catch (err: any) {', '    } catch (err: unknown) {')
    ],
    'src/features/pwa/PWAInstaller.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;\n  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const isStandalone = window.matchMedia(\'(display-mode: standalone)\').matches || (navigator as any).standalone;', '  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;\n  const isStandalone = window.matchMedia(\'(display-mode: standalone)\').matches || (navigator as unknown as { standalone: boolean }).standalone;'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    const isStandalone = window.matchMedia(\'(display-mode: standalone)\').matches || (navigator as any).standalone;', '    const isStandalone = window.matchMedia(\'(display-mode: standalone)\').matches || (navigator as unknown as { standalone: boolean }).standalone;')
    ],
    'src/features/wanted/WantedBoardScreen.tsx': [
        ('{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}\n                {React.createElement((LucideIcons as any)[cat.icon], { className: \'w-4 h-4\' })}', '{React.createElement((LucideIcons as Record<string, React.ElementType>)[cat.icon], { className: \'w-4 h-4\' })}')
    ],
    'src/features/listings/CreateListingScreen.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n        hallOfResidence: item.hallOfResidence as any,', '        hallOfResidence: item.hallOfResidence,'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    } catch (err: any) {', '    } catch (err: unknown) {')
    ],
    'src/lib/data/admin.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    const { error } = await supabase.from(\'profiles\').update(payload as any).eq(\'id\', targetUser.id);', '    const { error } = await supabase.from(\'profiles\').update(payload as import(\'../database.types\').Database[\'public\'][\'Tables\'][\'profiles\'][\'Update\']).eq(\'id\', targetUser.id);'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n  const { error } = await supabase.from(\'listings\').update(payload as any).eq(\'id\', listingId);', '  const { error } = await supabase.from(\'listings\').update(payload as import(\'../database.types\').Database[\'public\'][\'Tables\'][\'listings\'][\'Update\']).eq(\'id\', listingId);')
    ],
    'src/lib/data/profiles.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    .upsert(payload as any, { onConflict: \'id\' });', '    .upsert(payload as import(\'../database.types\').Database[\'public\'][\'Tables\'][\'profiles\'][\'Insert\'], { onConflict: \'id\' });')
    ],
    'src/lib/hooks/useDeleteListingMutation.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'listings\'] }, (oldData: any) => {', '      queryClient.setQueriesData({ queryKey: [\'listings\'] }, (oldData: unknown) => {'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'myListings\'] }, (oldData: any) => {', '      queryClient.setQueriesData({ queryKey: [\'myListings\'] }, (oldData: unknown) => {')
    ],
    'src/lib/hooks/useDeleteWantedRequestMutation.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      const optimisticFilterFn = (oldData: any) => {', '      const optimisticFilterFn = (oldData: unknown) => {'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'wantedRequests\'] }, optimisticFilterFn);', '      queryClient.setQueriesData({ queryKey: [\'wantedRequests\'] }, optimisticFilterFn);'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'myWantedRequests\'] }, optimisticFilterFn);', '      queryClient.setQueriesData({ queryKey: [\'myWantedRequests\'] }, optimisticFilterFn);')
    ],
    'src/lib/hooks/useToggleFulfilledMutation.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      const optimisticUpdateFn = (oldData: any) => {', '      const optimisticUpdateFn = (oldData: unknown) => {'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'wantedRequests\'] }, optimisticUpdateFn);', '      queryClient.setQueriesData({ queryKey: [\'wantedRequests\'] }, optimisticUpdateFn);'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'myWantedRequests\'] }, optimisticUpdateFn);', '      queryClient.setQueriesData({ queryKey: [\'myWantedRequests\'] }, optimisticUpdateFn);')
    ],
    'src/lib/hooks/useToggleSoldMutation.ts': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'listings\'] }, (oldData: any) => {', '      queryClient.setQueriesData({ queryKey: [\'listings\'] }, (oldData: unknown) => {'),
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n      queryClient.setQueriesData<any>({ queryKey: [\'myListings\'] }, (oldData: any) => {', '      queryClient.setQueriesData({ queryKey: [\'myListings\'] }, (oldData: unknown) => {')
    ],
    'src/features/listings/CategoryPills.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n        const Icon = (LucideIcons as any)[cat.icon];', '        const Icon = (LucideIcons as Record<string, React.ElementType>)[cat.icon];')
    ],
    'src/features/auth/CompleteProfileScreen.tsx': [
        ('// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    } catch (err: any) {', '    } catch (err: unknown) {')
    ]
}

for filepath, repls in replacements.items():
    if not os.path.exists(filepath):
        print(f"NOT FOUND: {filepath}")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for old, new in repls:
        # replace handles CRLF properly if we normalize
        old = old.replace('\r\n', '\n')
        content_norm = content.replace('\r\n', '\n')
        if old in content_norm:
            content_norm = content_norm.replace(old, new)
            content = content_norm # keep normalized for write
            modified = True
        else:
            print(f"MISSING PATTERN in {filepath}:\n{old}")
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")
