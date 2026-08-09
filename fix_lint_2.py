import os
import re

files_to_fix = {
    'src/features/admin/AdminAnnouncementsScreen.tsx': ('loadAnnouncements', 'showToast'),
    'src/features/admin/AdminListingsScreen.tsx': ('loadListings', 'statusFilter, showToast'),
    'src/features/admin/AdminReportsScreen.tsx': ('loadReports', 'statusFilter, reasonFilter, showToast'),
    'src/features/admin/AdminUsersScreen.tsx': ('loadUsers', 'search, hallFilter, showToast'),
}

for filepath, (func_name, extra_deps) in files_to_fix.items():
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. wrap func in useCallback
    pattern = rf'const {func_name} = async \(\) => {{'
    replacement = rf'const {func_name} = useCallback(async () => {{'
    
    if replacement not in content:
        content = re.sub(pattern, replacement, content)
        # 2. replace closing bracket of func
        content = re.sub(
            r'\.finally\(\(\) => setLoading\(false\)\);\r?\n  };',
            f'.finally(() => setLoading(false));\n  }}, [{extra_deps}]);',
            content
        )
        
    # 3. fix useEffect deps
    if 'AdminUsersScreen' in filepath:
        content = re.sub(r'  }, \[[^\]]+\]\);', f'  }}, [{func_name}]);', content)
    else:
        content = re.sub(rf'  }}, \[[^\]]*\]\);(?!\n\s*const handle)', rf'  }}, [{func_name}]);', content)
        content = re.sub(rf'  }}, \[\]\);', rf'  }}, [{func_name}]);', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Fixed deps in {filepath}")

