import base64

with open('apps/web/public/favicon.png', 'rb') as f:
    fav_b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <image href="data:image/png;base64,{fav_b64}" width="128" height="128" />
</svg>'''

with open('apps/web/public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Updated favicon.svg to perfectly centered 128x128 square SVG!')
