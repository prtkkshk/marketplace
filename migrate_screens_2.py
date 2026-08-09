import os
import re

def fix_pwa_installer():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\features\pwa\PWAInstaller.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    inject = """    // Gate behind return visit
    const hasVisited = localStorage.getItem('pwa_has_visited');
    if (!hasVisited) {
      localStorage.setItem('pwa_has_visited', 'true');
      return;
    }
"""
    if 'pwa_has_visited' not in content:
        content = content.replace("useEffect(() => {\n", "useEffect(() => {\n" + inject)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)


def fix_feed_screen():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\features\listings\FeedScreen.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix "Results found" string
    content = content.replace(
        "{allListings.length > 0 ? 'Results found' : ''}",
        "{allListings.length > 0 ? `${allListings.length} results found` : ''}"
    )

    # Collapse Chrome from 4 rows to 2 rows
    # Original structure:
    # 1. SearchBar (mobile only, md:hidden)
    # 2. Div containing Desktop SearchBar (hidden lg:flex), CategoryPills, Sort/Filter row
    
    # We will replace the whole Toolbar section
    toolbar_start = content.find('{/* Toolbar */}')
    toolbar_end = content.find('<FilterSheet', toolbar_start)
    
    if toolbar_start != -1 and toolbar_end != -1:
        new_toolbar = """{/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6 pt-3 md:pt-0">
        <div className="flex gap-2 w-full">
          <SearchBar
            value={searchQuery}
            onChange={(q) => updateUrlParams({ q: q || undefined })}
            className="flex-1"
          />
          <SortDropdown
            value={sort}
            onChange={(s) => updateUrlParams({ sort: s })}
            className="shrink-0"
          />
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden shrink-0 px-3"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand" />
            )}
          </Button>
        </div>

        <CategoryPills
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => updateUrlParams({ cat: cat || undefined })}
        />

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-1 lg:hidden">
            {condition && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
                Cond: {condition}
                <button onClick={() => removeFilter('cond')} className="hover:text-danger"><X className="w-3 h-3" /></button>
              </span>
            )}
            {hall && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
                Hall: {hall}
                <button onClick={() => removeFilter('hall')} className="hover:text-danger"><X className="w-3 h-3" /></button>
              </span>
            )}
            {isNegotiable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
                Negotiable
                <button onClick={() => removeFilter('neg')} className="hover:text-danger"><X className="w-3 h-3" /></button>
              </span>
            )}
            {maxPrice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-2 text-ink text-xs font-bold border-[1.5px] border-ink">
                Up to ₹{maxPrice}
                <button onClick={() => removeFilter('maxPrice')} className="hover:text-danger"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-xs font-bold text-subtle hover:text-ink ml-1">
              Clear all
            </button>
          </div>
        )}
        
        <div className="text-xs font-bold text-subtle pt-1">
          {allListings.length > 0 ? `${allListings.length} results found` : ''}
        </div>
      </div>

      """
        content = content[:toolbar_start] + new_toolbar + content[toolbar_end:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

def fix_listing_card():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\features\listings\ListingCard.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove heart and whatsapp from photo area
    action_cluster_start = content.find('{/* Action Cluster (Top Right) */}')
    action_cluster_end = content.find('{/* Owner Action Cluster */}')
    if action_cluster_start != -1 and action_cluster_end != -1:
        content = content[:action_cluster_start] + content[action_cluster_end:]
    
    # Replace the SOLD overlay Badge with SoldStamp component
    sold_overlay_start = content.find('{/* SOLD Overlay Badge */}')
    sold_overlay_end = content.find('</div>\n\n      {/* Card Body */}')
    if sold_overlay_start != -1 and sold_overlay_end != -1:
        content = content[:sold_overlay_start] + """{isSold && (
          <SoldStamp className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      """ + content[sold_overlay_end:]

    # Ensure SoldStamp is imported
    if 'SoldStamp' not in content:
        content = content.replace("import { Badge } from '../../components/ui/Badge';", "import { Badge } from '../../components/ui/Badge';\nimport { SoldStamp } from '../../components/ui/SoldStamp';")

    # Add tabular numerals to price, and move action cluster to Card Body
    price_start = content.find('{/* Price */}')
    price_end = content.find('{/* Badges Row */}')
    
    new_price = """{/* Price & Actions Row */}
          <div className="mt-1 mb-2 flex items-center justify-between">
            <div className="font-bold text-brand text-lg tabular-nums">
              ₹{listing.price.toLocaleString('en-IN')}
            </div>
            {!isSold && !isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleContactTap}
                  disabled={isContacting}
                  className="press p-1.5 rounded-sm border-[1.5px] border-transparent hover:border-ink hover:bg-surface-2 transition-all text-subtle hover:text-ink focus-visible:outline-ink"
                  aria-label={`Contact seller on WhatsApp`}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleSave}
                  className="press p-1.5 rounded-sm border-[1.5px] border-transparent hover:border-ink hover:bg-surface-2 transition-all text-subtle hover:text-ink focus-visible:outline-ink"
                  aria-label={isSaved ? 'Unsave item' : 'Save item'}
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />
                </button>
              </div>
            )}
          </div>\n\n          """
    
    if price_start != -1 and price_end != -1:
        content = content[:price_start] + new_price + content[price_end:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_desktop_header():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\components\layout\DesktopHeader.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Needs 4 nav items + labelled Sell button
    content = content.replace("import { PackageSearch, Bell, User, Plus, Search, Heart, ShieldAlert }", "import { PackageSearch, Megaphone, User, Plus, Search, Heart, ShieldAlert, Home }")
    content = content.replace("const navItems = [\n      { path: '/', label: 'Browse', icon: Search },\n      { path: '/wanted', label: 'Wanted Board', icon: PackageSearch },\n      { path: '/profile/saved', label: 'Saved', icon: Heart },\n    ];", "const navItems = [\n      { path: '/', label: 'Home', icon: Home },\n      { path: '/wanted', label: 'Wanted', icon: Megaphone },\n    ];")

    # The FAB is usually rendered manually, let's just make sure it uses the new Button
    # Look for the Sell button in DesktopHeader
    if 'Button' not in content:
        content = content.replace("import { Link, NavLink, useLocation", "import { Button } from '../ui/Button';\nimport { Link, NavLink, useLocation")
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_pwa_installer()
fix_feed_screen()
fix_listing_card()
fix_desktop_header()
print("Phase 3 script completed.")
