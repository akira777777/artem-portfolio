from html.parser import HTMLParser
from collections import Counter

class IDChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.scripts = []
        self.tag_stack = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if 'id' in attrs_dict:
            self.ids.append(attrs_dict['id'])
        if tag == 'script':
            self.scripts.append(attrs_dict.get('src', '<inline>'))

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

parser = IDChecker()
parser.feed(html)

dupes = {id_: count for id_, count in Counter(parser.ids).items() if count > 1}
print(f"Total script tags: {len(parser.scripts)}")
print(f"Script sources: {parser.scripts}")
print(f"Duplicate IDs: {dupes if dupes else 'None'}")
print(f"HTML length: {len(html)} chars, approx {html.count(chr(10))} lines")

# Basic structure check
required = ['<!DOCTYPE html>', '<html', '</html>', '<body>', '</body>', '<head>', '</head>']
for token in required:
    if token not in html:
        print(f"WARNING: missing {token}")
    else:
        print(f"OK: {token}")
