import os

def fix_listing_detail():
    path = r'C:\Users\prtkk\Desktop\kgp_marketplace\codebase\src\features\listings\ListingDetailScreen.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Mobile Header
    mobile_header = """        <div className="md:hidden mb-4 mt-2">
          <div className="text-[11px] font-bold text-brand uppercase tracking-wider mb-1">
            {categoryLabel(listing.category)}
          </div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="text-[32px] font-bold text-brand leading-none tabular-nums">
              ₹{listing.price.toLocaleString('en-IN')}
            </span>
            <Badge variant={listing.isNegotiable ? 'negotiable' : 'fixed'} className={listing.isNegotiable ? '-rotate-2' : ''}>
              {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
            </Badge>
          </div>
          <h1 className="text-display font-bold text-ink leading-[1.15] mb-2">
            {listing.title}
          </h1>
        </div>"""
    
    start_m = content.find('<div className="md:hidden mb-4 mt-2">')
    end_m = content.find('</div>\n\n        {/* Left Column (Gallery & Details) */}')
    if start_m != -1 and end_m != -1:
        content = content[:start_m] + mobile_header + content[end_m:]
    
    # Desktop Header
    desktop_header = """          <div className="hidden md:block">
            <div className="text-[11px] font-bold text-brand uppercase tracking-wider mb-2">
              {categoryLabel(listing.category)}
            </div>
            
            <div className="flex items-end gap-3 flex-wrap mb-2">
              <span className="text-[42px] font-bold text-brand leading-none tabular-nums">
                ₹{listing.price.toLocaleString('en-IN')}
              </span>
              <Badge variant={listing.isNegotiable ? 'negotiable' : 'fixed'} className={`mb-2 ${listing.isNegotiable ? '-rotate-2' : ''}`}>
                {listing.isNegotiable ? 'Negotiable' : 'Fixed Price'}
              </Badge>
            </div>

            <h1 className="text-display font-bold text-ink leading-[1.1] mb-3">
              {listing.title}
            </h1>
          </div>"""
    
    start_d = content.find('<div className="hidden md:block">')
    end_d = content.find('</div>\n\n          {/* Specs Grid 2x2 */}')
    if start_d != -1 and end_d != -1:
        content = content[:start_d] + desktop_header + content[end_d:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_listing_detail()
print("ListingDetailScreen fixed.")
