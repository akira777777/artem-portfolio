import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Pattern: line 0 is original DOCTYPE
# Then every 35 lines: 34 injected modal lines + 1 line of script+original
prefix = '<script src="script.js?v=20260726-2"></script>'

original_lines = [lines[0].rstrip('\n')]

# Verify pattern
expected_injections = 0
for i in range(1, len(lines), 35):
    chunk = lines[i:i+35]
    if len(chunk) != 35:
        print(f"Warning: incomplete chunk at line {i+1}, length {len(chunk)}")
        continue
    script_line = chunk[-1]
    if not script_line.startswith(prefix):
        print(f"Warning: expected prefix at line {i+35}, got: {script_line[:80]!r}")
        continue
    original_part = script_line[len(prefix):].rstrip('\n')
    original_lines.append(original_part)
    expected_injections += 1

print(f"Extracted {len(original_lines)} original lines ({expected_injections} injections)")

# Write reconstructed file without modal/script
with open('index_reconstructed.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(original_lines) + '\n')

print("Wrote index_reconstructed.html")
