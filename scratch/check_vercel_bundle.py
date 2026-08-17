import urllib.request
import re

urls = [
    'https://park-ease-web-git-main-dharmik-projects.vercel.app',
    'https://parkease-web.vercel.app',
    'https://park-ease-web.vercel.app',
    'https://parkease.vercel.app'
]

for u in urls:
    print("==================================================")
    print("CHECKING:", u)
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        js_matches = re.findall(r'src=["\'](/assets/[^"\']+\.js)["\']', html)
        print("JS Bundle Links:", js_matches)
        
        for js_path in js_matches:
            js_url = u + js_path
            req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
            js_code = urllib.request.urlopen(req_js).read().decode('utf-8', errors='ignore')
            
            # Search for http/https URLs in the bundle
            found_urls = re.findall(r'https?://[a-zA-Z0-9\.\-_:\/]+', js_code)
            api_related = [x for x in found_urls if 'onrender' in x or 'api' in x or 'localhost' in x]
            print(f"  Asset {js_path}: API URLs found: {set(api_related)}")
    except Exception as e:
        print("  Error:", e)
