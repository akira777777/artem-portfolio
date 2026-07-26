modal_markup = '''  <!-- Project detail modal -->
  <div id="projectModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle" class="modal-title">Project Title</h2>
        <button id="closeModalButton" class="modal-close" aria-label="Close modal">
          <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <p id="modalDescription" class="modal-desc">No description available.</p>
      <div id="modalTechnologies" class="modal-techs"></div>
      <div class="modal-actions">
        <a id="modalLink" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-primary">live demo<span class="btn-arrow">→</span></a>
      </div>
    </div>
  </div>
'''

with open('index_reconstructed.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Insert modal before the closing body script tag
marker = '  <script src="script.js?v=20260726-2"></script>\n</body>'
if marker not in html:
    raise RuntimeError('Marker not found in reconstructed HTML')

html = html.replace(marker, modal_markup + marker, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Wrote fixed index.html')
