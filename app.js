const page = document.body.dataset.page;
const STORAGE_KEYS = {
  draft: 'peeyashbooks:draft',
  published: 'peeyashbooks:published'
};

const utils = {
  slugify(text = '') {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 48);
  },
  uid(length = 6) {
    return Math.random().toString(36).slice(2, 2 + length);
  },
  getPublished() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.published) || '{}');
    } catch {
      return {};
    }
  },
  setPublished(data) {
    localStorage.setItem(STORAGE_KEYS.published, JSON.stringify(data));
  },
  toast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  },
  setButtonState(button, label, disabled = true) {
    if (!button) return;
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.innerHTML;
    button.innerHTML = label;
    button.disabled = disabled;
    button.style.opacity = disabled ? '0.7' : '1';
  },
  resetButtonState(button) {
    if (!button) return;
    button.innerHTML = button.dataset.originalLabel || button.innerHTML;
    button.disabled = false;
    button.style.opacity = '1';
  },
  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  },
  closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  },
  stripHtml(html = '') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },
  wordCount(html = '') {
    const text = utils.stripHtml(html).trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  },
  escapeHtml(text = '') {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

function initGlobalEffects() {
  document.querySelectorAll('.reveal-up').forEach((el) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    observer.observe(el);
  });

  document.querySelectorAll('.tilt-card').forEach((card) => {
    let rafId;

    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const rotateY = (px - 0.5) * 16;
        const rotateX = (0.5 - py) * 16;

        card.style.transform = `
          perspective(1200px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          scale(1.03)
        `;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(.2,.8,.2,1)';
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.2;

      button.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });

  if (!document.querySelector('.cursor-glow')) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.position = 'fixed';
    glow.style.width = '320px';
    glow.style.height = '320px';
    glow.style.borderRadius = '50%';
    glow.style.pointerEvents = 'none';
    glow.style.zIndex = '0';
    glow.style.background = 'radial-gradient(circle, rgba(90,167,255,0.18), transparent 65%)';
    glow.style.filter = 'blur(40px)';
    document.body.appendChild(glow);

    window.addEventListener('mousemove', (e) => {
      glow.style.left = `${e.clientX - 160}px`;
      glow.style.top = `${e.clientY - 160}px`;
    });
  }

  document.addEventListener('click', (e) => {
    const closeTrigger = e.target.closest('[data-close]');
    if (closeTrigger) utils.closeModal(closeTrigger.dataset.close);
  });
}

function initHomePage() {
  const typingTarget = document.getElementById('typingText');
  if (!typingTarget) return;

  const phrases = ['Write your story…', 'Publish it…', 'Share it with the world…'];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const current = phrases[phraseIndex];
    typingTarget.textContent = current.slice(0, charIndex);

    if (!deleting && charIndex < current.length) {
      charIndex += 1;
      setTimeout(type, 70);
      return;
    }

    if (!deleting && charIndex === current.length) {
      deleting = true;
      setTimeout(type, 1200);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      setTimeout(type, 38);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(type, 320);
  }

  type();

  const hero = document.querySelector('.hero');
  const visual = document.querySelector('.hero-visual');
  if (hero && visual) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      visual.style.transform = `translate3d(${x * 0.8}px, ${y * 0.8}px, 0)`;
      hero.style.backgroundPosition = `${50 + x * 0.2}% ${50 + y * 0.2}%`;
    });
  }
}

function initEditorPage() {
  const titleInput = document.getElementById('ebookTitle');
  const authorInput = document.getElementById('ebookAuthor');
  const saveState = document.getElementById('saveState');
  const publishBtn = document.getElementById('publishBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const confirmPublishBtn = document.getElementById('confirmPublish');
  const confirmExportBtn = document.getElementById('confirmExport');
  const publishPreview = document.getElementById('publishPreview');
  const customSlugInput = document.getElementById('customSlugInput');
  const wordCountNode = document.getElementById('wordCount');
  const chapterCountNode = document.getElementById('chapterCount');
  const chapterListNode = document.getElementById('chapterList');
  const addChapterBtn = document.getElementById('addChapterBtn');
  const outlinePromptInput = document.getElementById('outlinePrompt');
  const generateOutlineBtn = document.getElementById('generateOutlineBtn');
  const outlineStatus = document.getElementById('outlineStatus');
  const outlineResult = document.getElementById('outlineResult');
  const outlineOutput = document.getElementById('outlineOutput');
  const insertOutlineBtn = document.getElementById('insertOutlineBtn');
  const replaceOutlineBtn = document.getElementById('replaceOutlineBtn');

  const Font = Quill.import('formats/font');
  Font.whitelist = ['sans-serif', 'serif', 'monospace'];
  Quill.register(Font, true);

  const Size = Quill.import('attributors/class/size');
  Size.whitelist = ['small', false, 'large', 'huge'];
  Quill.register(Size, true);

  const quill = new Quill('#editor', {
    modules: { toolbar: '#toolbar' },
    theme: 'snow',
    placeholder: 'Start writing your ebook here. Shape your title, create your chapters, and publish when it feels ready.'
  });

  let saveTimer;
  let activeChapterIndex = 0;
  let latestOutlineHtml = '';

  let currentDraft = {
    title: 'Untitled ebook',
    author: 'Anonymous Author',
    content: '<h1>Welcome to PeeyashBooks</h1><p>Your writing space is ready. Start with a strong opening paragraph and let the story grow from there.</p>',
    chapters: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.draft) || 'null');
    if (saved) currentDraft = { ...currentDraft, ...saved };
  } catch {}

  if (!Array.isArray(currentDraft.chapters)) {
    currentDraft.chapters = [];
  }

  if (!currentDraft.chapters.length) {
    currentDraft.chapters = [
      {
        id: utils.uid(8),
        title: 'Chapter 1',
        content: currentDraft.content || '<p></p>'
      }
    ];
  }

  titleInput.value = currentDraft.title === 'Untitled ebook' ? '' : currentDraft.title;
  authorInput.value = currentDraft.author === 'Anonymous Author' ? '' : currentDraft.author;
  quill.root.innerHTML = currentDraft.chapters[activeChapterIndex]?.content || currentDraft.content || '';

  function setSaveState(message, tone = 'default') {
    if (!saveState) return;
    saveState.textContent = message;
    saveState.style.color = tone === 'active' ? '#ffe1a4' : tone === 'success' ? '#c5ffd8' : '#cfe0ff';
  }

  function syncActiveChapterFromEditor() {
    if (!currentDraft.chapters[activeChapterIndex]) return;
    currentDraft.chapters[activeChapterIndex].content = quill.root.innerHTML;

    const plain = utils.stripHtml(quill.root.innerHTML).trim();
    if (plain && currentDraft.chapters[activeChapterIndex].title.startsWith('Chapter ')) {
      const autoTitle = plain.split(/\s+/).slice(0, 4).join(' ');
      if (autoTitle.length > 2) {
        currentDraft.chapters[activeChapterIndex].title = autoTitle;
      }
    }
  }

  function buildCombinedContent() {
    return currentDraft.chapters.map((chapter, index) => {
      const title = chapter.title?.trim() || `Chapter ${index + 1}`;
      return `<h2>${title}</h2>${chapter.content || '<p></p>'}`;
    }).join('');
  }

  function draftPayload() {
    syncActiveChapterFromEditor();

    return {
      title: titleInput.value.trim() || 'Untitled ebook',
      author: authorInput.value.trim() || 'Anonymous Author',
      content: buildCombinedContent(),
      chapters: currentDraft.chapters,
      updatedAt: new Date().toISOString()
    };
  }

  function updateMetrics() {
    const payload = draftPayload();
    if (wordCountNode) {
      wordCountNode.textContent = `${utils.wordCount(payload.content)} words`;
    }
    if (chapterCountNode) {
      chapterCountNode.textContent = `${payload.chapters.length} chapter${payload.chapters.length === 1 ? '' : 's'}`;
    }
  }



  function setOutlineStatus(message, tone = 'default') {
    if (!outlineStatus) return;
    outlineStatus.textContent = message;
    outlineStatus.dataset.tone = tone;
  }

  function markdownToHtml(markdown = '') {
    const lines = markdown.split(/\r?\n/);
    let html = '';
    let inList = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      if (/^#{1,6}\s/.test(line)) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const level = Math.min(6, line.match(/^#+/)[0].length);
        const text = utils.escapeHtml(line.replace(/^#{1,6}\s*/, ''));
        html += `<h${level}>${text}</h${level}>`;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${utils.escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`;
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${utils.escapeHtml(line.replace(/^\d+\.\s+/, ''))}</li>`;
        continue;
      }

      if (inList) {
        html += '</ul>';
        inList = false;
      }

      html += `<p>${utils.escapeHtml(line)}</p>`;
    }

    if (inList) html += '</ul>';
    return html || '<p>No outline generated yet.</p>';
  }

  async function generateOutline() {
    const prompt = outlinePromptInput?.value.trim() || '';

    if (!prompt) {
      utils.toast('Add your book idea first.');
      setOutlineStatus('Add a short description of your ebook idea to generate an outline.', 'warning');
      outlinePromptInput?.focus();
      return;
    }

    latestOutlineHtml = '';
    if (outlineResult) outlineResult.hidden = true;
    if (outlineOutput) outlineOutput.innerHTML = '';

    utils.setButtonState(generateOutlineBtn, 'Generating outline…');
    setOutlineStatus('Generating your outline…', 'active');
    setSaveState('AI working…', 'active');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_outline',
          prompt,
          title: titleInput?.value.trim() || '',
          author: authorInput?.value.trim() || '',
          currentContent: utils.stripHtml(buildCombinedContent()).slice(0, 4000)
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Outline generation failed.');
      }

      latestOutlineHtml = markdownToHtml(data.text || '');
      if (outlineOutput) outlineOutput.innerHTML = latestOutlineHtml;
      if (outlineResult) outlineResult.hidden = false;
      setOutlineStatus('Outline ready. Insert it into the editor or replace the current draft.', 'success');
      setSaveState('Saved', 'success');
      utils.toast('Outline generated successfully.');
    } catch (error) {
      setOutlineStatus(error.message || 'Could not generate the outline right now.', 'error');
      setSaveState('Saved', 'default');
      utils.toast(error.message || 'Could not generate the outline right now.');
    } finally {
      utils.resetButtonState(generateOutlineBtn);
    }
  }

  function insertOutlineIntoEditor(replace = false) {
    if (!latestOutlineHtml) {
      utils.toast('Generate an outline first.');
      return;
    }

    if (replace) {
      syncActiveChapterFromEditor();
      currentDraft.chapters = [{
        id: utils.uid(8),
        title: 'Generated Outline',
        content: latestOutlineHtml
      }];
      activeChapterIndex = 0;
      quill.root.innerHTML = latestOutlineHtml;
      renderChapterList();
      updateMetrics();
      queueSave();
      utils.toast('Outline replaced your current draft.');
      return;
    }

    const range = quill.getSelection(true);
    if (range) {
      quill.clipboard.dangerouslyPasteHTML(range.index, latestOutlineHtml);
    } else {
      quill.clipboard.dangerouslyPasteHTML(quill.getLength() - 1, latestOutlineHtml);
    }
    syncActiveChapterFromEditor();
    renderChapterList();
    updateMetrics();
    queueSave();
    utils.toast('Outline inserted into your editor.');
  }

  function deleteChapter(index) {
    if (currentDraft.chapters.length === 1) {
      utils.toast('You must keep at least one chapter.');
      return;
    }

    currentDraft.chapters.splice(index, 1);

    if (activeChapterIndex >= currentDraft.chapters.length) {
      activeChapterIndex = currentDraft.chapters.length - 1;
    }

    quill.root.innerHTML = currentDraft.chapters[activeChapterIndex]?.content || '<p></p>';
    renderChapterList();
    updateMetrics();
    queueSave();
    utils.toast('Chapter deleted.');
  }

  function renderChapterList() {
    if (!chapterListNode) return;

    chapterListNode.innerHTML = '';

    currentDraft.chapters.forEach((chapter, index) => {
      const item = document.createElement('div');
      item.className = `chapter-item${index === activeChapterIndex ? ' active' : ''}`;

      item.innerHTML = `
        <button type="button" class="chapter-item-main">
          <span>${chapter.title || `Chapter ${index + 1}`}</span>
        </button>
        <div class="chapter-item-meta">
          <span>${utils.wordCount(chapter.content || '')}w</span>
          <button type="button" class="chapter-delete" aria-label="Delete chapter">&times;</button>
        </div>
      `;

      const mainBtn = item.querySelector('.chapter-item-main');
      const deleteBtn = item.querySelector('.chapter-delete');

      mainBtn.addEventListener('click', () => {
        if (index === activeChapterIndex) return;
        syncActiveChapterFromEditor();
        activeChapterIndex = index;
        quill.root.innerHTML = currentDraft.chapters[activeChapterIndex]?.content || '<p></p>';
        renderChapterList();
        updateMetrics();
        setSaveState('Saved', 'success');
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChapter(index);
      });

      chapterListNode.appendChild(item);
    });
  }

  function addChapter() {
    syncActiveChapterFromEditor();
    currentDraft.chapters.push({
      id: utils.uid(8),
      title: `Chapter ${currentDraft.chapters.length + 1}`,
      content: '<p></p>'
    });
    activeChapterIndex = currentDraft.chapters.length - 1;
    quill.root.innerHTML = currentDraft.chapters[activeChapterIndex].content;
    renderChapterList();
    updateMetrics();
    queueSave();
  }

  function saveDraft() {
    setSaveState('Saving…', 'active');
    currentDraft = draftPayload();
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(currentDraft));
    updateMetrics();
    renderChapterList();
    window.setTimeout(() => setSaveState('Saved', 'success'), 350);
  }

  function queueSave() {
    setSaveState('Saving…', 'active');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 500);
  }

  function getPublishSlug(previewOnly = false) {
    const payload = draftPayload();
    const base = utils.slugify(payload.title) || 'untitled-ebook';
    const custom = utils.slugify(customSlugInput?.value || '');
    const published = utils.getPublished();

    let slug = `${base}-${utils.uid(5)}`;

    if (custom) {
      if (published[custom] && !previewOnly) {
        throw new Error('That custom link already exists. Please choose another one.');
      }
      slug = custom;
    }

    return slug;
  }

  function updatePublishPreview() {
    try {
      const slug = getPublishSlug(true);
      if (publishPreview) publishPreview.textContent = `/read/${slug}`;
    } catch {
      if (publishPreview) publishPreview.textContent = '/read/your-ebook-slug';
    }
  }

  [titleInput, authorInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => {
      queueSave();
      updatePublishPreview();
    });
  });

  quill.on('text-change', () => {
    syncActiveChapterFromEditor();
    renderChapterList();
    updateMetrics();
    queueSave();
  });

  if (customSlugInput) {
    customSlugInput.addEventListener('input', updatePublishPreview);
  }

  if (addChapterBtn) {
    addChapterBtn.addEventListener('click', addChapter);
  }

  generateOutlineBtn?.addEventListener('click', generateOutline);
  insertOutlineBtn?.addEventListener('click', () => insertOutlineIntoEditor(false));
  replaceOutlineBtn?.addEventListener('click', () => insertOutlineIntoEditor(true));

  renderChapterList();
  updateMetrics();
  updatePublishPreview();

  publishBtn?.addEventListener('click', () => {
    updatePublishPreview();
    utils.openModal('publishModal');
  });

  confirmPublishBtn?.addEventListener('click', () => {
    let slug = '';
    const customSlugValue = utils.slugify(customSlugInput?.value || '');

    try {
      slug = getPublishSlug(false);
    } catch (error) {
      utils.toast(error.message);
      return;
    }

    if (customSlugValue) {
      utils.toast('Custom link selected — connect Flutterwave to collect ₦100 before publishing.');
      return;
    }

    const payload = draftPayload();

    utils.setButtonState(confirmPublishBtn, 'Publishing…');
    setSaveState('Publishing…', 'active');

    const published = utils.getPublished();
    published[slug] = { ...payload, slug, publishedAt: new Date().toISOString() };
    utils.setPublished(published);
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(payload));

    setTimeout(() => {
      utils.resetButtonState(confirmPublishBtn);
      utils.closeModal('publishModal');
      setSaveState('Saved', 'success');
      const publicUrl = `${window.location.origin}/read/${slug}`;
      navigator.clipboard?.writeText(publicUrl).catch(() => {});
      utils.toast('Published successfully. Public URL copied to your clipboard.');
      window.open(`reader.html?slug=${encodeURIComponent(slug)}`, '_blank');
    }, 900);
  });

  downloadBtn?.addEventListener('click', () => utils.openModal('exportModal'));

  confirmExportBtn?.addEventListener('click', async () => {
    const payload = draftPayload();
    utils.setButtonState(confirmExportBtn, 'Generating PDF…');
    setSaveState('Generating PDF…', 'active');

    const exportNode = document.createElement('div');
    exportNode.className = 'export-sheet';
    exportNode.innerHTML = `
      <h1>${payload.title}</h1>
      <div class="author">by ${payload.author}</div>
      <div>${payload.content}</div>
      <div class="export-footer">Created with PeeyashBooks</div>
    `;
    document.body.appendChild(exportNode);

    const options = {
      margin: [10, 10, 14, 10],
      filename: `${utils.slugify(payload.title) || 'peeyashbooks-export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(options).from(exportNode).save();
      utils.toast('PDF export complete. Connect Paystack next to enforce payment.');
      utils.closeModal('exportModal');
      setSaveState('Saved', 'success');
    } catch (error) {
      utils.toast('PDF export could not be completed. Please try again.');
      setSaveState('Saved', 'default');
    } finally {
      exportNode.remove();
      utils.resetButtonState(confirmExportBtn);
    }
  });
}

function initReaderPage() {
  const title = document.getElementById('readerTitle');
  const author = document.getElementById('readerAuthor');
  const content = document.getElementById('readerContent');
  const params = new URLSearchParams(window.location.search);
  const slugFromQuery = params.get('slug');
  const slugFromPath = window.location.pathname.startsWith('/read/')
    ? decodeURIComponent(window.location.pathname.replace('/read/', '').replace(/\/$/, ''))
    : '';
  const slug = slugFromQuery || slugFromPath;
  const published = utils.getPublished();
  const book = published[slug];

  if (!book) {
    title.textContent = 'This ebook is not available yet';
    author.textContent = 'Try publishing from the editor first.';
    content.innerHTML = '<p>PeeyashBooks keeps the MVP simple: published ebooks are stored locally in your browser for this demo build. Publish a draft from the editor to generate a live reading experience here.</p>';
    return;
  }

  document.title = `${book.title} — PeeyashBooks`;
  title.textContent = book.title;
  author.textContent = `by ${book.author}`;
  content.innerHTML = book.content;
}

initGlobalEffects();
if (page === 'home') initHomePage();
if (page === 'editor') initEditorPage();
if (page === 'reader') initReaderPage();