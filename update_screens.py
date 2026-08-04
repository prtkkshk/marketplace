import os
import re

files_to_update = [
    'src/features/listings/ListingDetailScreen.tsx',
    'src/features/saved/SavedItemsScreen.tsx',
    'src/features/wanted/RequestDetailScreen.tsx'
]

for file in files_to_update:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # add import after last import
    last_import = content.rfind("import ")
    end_of_last_import = content.find("\n", last_import)
    content = content[:end_of_last_import] + "\nimport { PageContainer } from '../../components/layout/PageContainer';" + content[end_of_last_import:]
    
    # replace opening div
    content = re.sub(r'<div className="p-4 max-w-[a-zA-Z0-9]+ mx-auto text-left (.*?)"', r'<PageContainer className="\1 text-left"', content)
    
    # replace closing div (just the last </div> before ); )
    content = content.replace("    </div>\n  );\n};", "    </PageContainer>\n  );\n};")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
