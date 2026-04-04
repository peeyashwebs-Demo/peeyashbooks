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
  const outlineSummary = document.getElementById('outlineSummary');
  const viewOutlineBtn = document.getElementById('viewOutlineBtn');
  const writingPromptInput = document.getElementById('writingPrompt');
  const writingModeSelect = document.getElementById('writingMode');
  const generateWritingBtn = document.getElementById('generateWritingBtn');
  const writingStatus = document.getElementById('writingStatus');
  const writingResult = document.getElementById('writingResult');
  const writingSummary = document.getElementById('writingSummary');
  const viewWritingBtn = document.getElementById('viewWritingBtn');
  const aiPreviewLabel = document.getElementById('aiPreviewLabel');
  const aiPreviewTitle = document.getElementById('aiPreviewTitle');
  const aiPreviewNote = document.getElementById('aiPreviewNote');
  const aiPreviewOutput = document.getElementById('aiPreviewOutput');
  const insertGeneratedBtn = document.getElementById('insertGeneratedBtn');
  const replaceGeneratedBtn = document.getElementById('replaceGeneratedBtn');

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
  let latestGeneratedHtml = '';
  let latestGeneratedKind = 'outline';
  let latestGeneratedMode = 'auto';

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

  function setWritingStatus(message, tone = 'default') {
    if (!writingStatus) return;
    writingStatus.textContent = message;
    writingStatus.dataset.tone = tone;
  }

  function parseRequestedChapterCount(prompt = '', depth = 'standard') {
    const match = prompt.match(/(\d+)\s*(chapter|chapters|part|parts|section|sections)/i);
    if (match) {
      return Math.min(12, Math.max(4, Number(match[1]) || 6));
    }

    if (depth === 'starter') return 5;
    if (depth === 'deep') return 9;
    return 7;
  }

  function classifyBookIdea(prompt = '', tone = 'warm', depth = 'standard') {
    const text = prompt.toLowerCase();
    const chapterCount = parseRequestedChapterCount(prompt, depth);

    const genreMap = [
      { key: 'faith', genre: 'Faith & Spiritual Growth', audience: 'readers seeking hope and spiritual direction', promise: 'guidance rooted in truth, prayer, and quiet restoration' },
      { key: 'healing', genre: 'Healing & Restoration', audience: 'readers rebuilding after pain, disappointment, or loss', promise: 'a step-by-step path from hurt to wholeness' },
      { key: 'business', genre: 'Business & Growth', audience: 'new founders and small business owners', promise: 'clear momentum, practical structure, and sustainable progress' },
      { key: 'relationship', genre: 'Relationships', audience: 'readers who want healthier love and communication', promise: 'deeper understanding, maturity, and emotional clarity' },
      { key: 'love', genre: 'Relationships', audience: 'readers navigating love, trust, and connection', promise: 'gentle insight and practical wisdom for real life' },
      { key: 'confidence', genre: 'Personal Growth', audience: 'readers ready to become more grounded and self-assured', promise: 'renewed confidence backed by practical daily action' },
      { key: 'purpose', genre: 'Purpose & Calling', audience: 'readers who feel gifted but directionless', promise: 'clarity, conviction, and an actionable sense of calling' },
      { key: 'productivity', genre: 'Productivity', audience: 'busy readers who need structure and consistency', promise: 'simple systems that create calm progress' },
      { key: 'memoir', genre: 'Memoir / Personal Story', audience: 'readers who connect with honest storytelling and growth', promise: 'an intimate story arc with emotional meaning' }
    ];

    let selected = { genre: 'General Nonfiction', audience: 'curious readers looking for clarity and progress', promise: 'a clear and inspiring path forward' };
    for (const item of genreMap) {
      if (text.includes(item.key)) {
        selected = item;
        break;
      }
    }

    const toneMap = {
      warm: {
        voice: 'warm, hopeful, and easy to follow',
        chapterFlavor: 'gentle guidance, story, and encouragement'
      },
      professional: {
        voice: 'clear, polished, and structured',
        chapterFlavor: 'strategy, clarity, and practical takeaways'
      },
      spiritual: {
        voice: 'faith-centered, prayerful, and uplifting',
        chapterFlavor: 'scripture-led reflection, healing, and renewal'
      },
      motivational: {
        voice: 'energetic, direct, and empowering',
        chapterFlavor: 'forward movement, belief, and momentum'
      },
      reflective: {
        voice: 'calm, thoughtful, and introspective',
        chapterFlavor: 'inner work, self-examination, and insight'
      }
    };

    return {
      ...selected,
      tone,
      depth,
      chapterCount,
      voice: toneMap[tone]?.voice || toneMap.warm.voice,
      chapterFlavor: toneMap[tone]?.chapterFlavor || toneMap.warm.chapterFlavor
    };
  }

  function buildTitleFromIdea(prompt = '', profile) {
    const cleaned = prompt
      .replace(/create|write|generate|outline|for|an?|ebook|book|about/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const title = cleaned
      ? cleaned.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : profile.genre;

    if (title.length <= 58) return title;

    const shortened = title.split(' ').slice(0, 7).join(' ');
    return shortened || profile.genre;
  }

  function buildSubtitle(profile) {
    const options = [
      `A ${profile.voice} guide for ${profile.audience}`,
      `A practical path toward ${profile.promise}`,
      `A creator-friendly roadmap to ${profile.genre.toLowerCase()}`
    ];
    return options[profile.depth === 'deep' ? 1 : profile.tone === 'professional' ? 2 : 0];
  }

  function buildChapterIdeas(profile, prompt = '') {
    const text = prompt.toLowerCase();
    const chapterBank = {
      faith: [
        ['The Weight You Have Been Carrying', 'name the pain honestly and create emotional connection with the reader'],
        ['Where Healing Begins', 'lay the spiritual and emotional foundation for recovery'],
        ['Faith in the Middle of Disappointment', 'show what belief looks like when life has not gone as planned'],
        ['Prayer, Reflection, and Quiet Strength', 'give the reader rhythms that build inner stability'],
        ['Releasing Shame and Self-Blame', 'address the thoughts that keep healing delayed'],
        ['Rebuilding Trust in God and in Yourself', 'help the reader reconnect with courage and hope'],
        ['Living Whole Again', 'move from survival into steady, renewed living'],
        ['A New Chapter of Testimony', 'close with forward vision, reflection prompts, and next steps']
      ],
      business: [
        ['Clarify the Real Opportunity', 'define the problem, the reader, and the value clearly'],
        ['Build a Small but Strong Foundation', 'focus on essentials before expansion'],
        ['Create Offers People Actually Need', 'turn ideas into clear and useful solutions'],
        ['Simple Marketing That Builds Trust', 'show practical ways to attract the right audience'],
        ['Operate with Discipline', 'introduce light systems for consistency and delivery'],
        ['Grow Without Chaos', 'teach structure, boundaries, and measured scale'],
        ['Protect the Vision', 'cover mindset, resilience, and decision-making'],
        ['Next-Level Expansion', 'close with an action plan for sustained growth']
      ],
      default: [
        ['Start with the Real Problem', 'help the reader feel seen and understood from the first chapter'],
        ['Understand the Foundation', 'define the core ideas and why they matter'],
        ['Recognize Hidden Barriers', 'surface the habits, fears, or beliefs that slow growth'],
        ['Shift the Mindset', 'build a healthier internal framework for change'],
        ['Take Practical Action', 'move from inspiration into realistic steps'],
        ['Handle Setbacks Wisely', 'prepare the reader for resistance and recovery'],
        ['Build a Sustainable Rhythm', 'turn change into a lifestyle instead of a short burst'],
        ['Move Forward with Confidence', 'close with clarity, identity, and next steps']
      ]
    };

    let bank = chapterBank.default;
    if (text.includes('faith') || text.includes('healing') || profile.tone === 'spiritual') bank = chapterBank.faith;
    if (text.includes('business')) bank = chapterBank.business;

    const extras = [
      ['Questions for Reflection', 'add journaling or discussion prompts that deepen the reader experience'],
      ['Stories, Examples, and Real-Life Application', 'make the lessons feel lived-in and practical'],
      ['A 30-Day Practice Plan', 'turn the outline into a more actionable experience'],
      ['Closing Encouragement and Next Steps', 'leave the reader with movement, not just information']
    ];

    const chapters = [];
    for (let i = 0; i < profile.chapterCount; i += 1) {
      const pair = bank[i] || extras[(i - bank.length) % extras.length];
      chapters.push({
        number: i + 1,
        title: pair[0],
        summary: pair[1]
      });
    }
    return chapters;
  }

  function createOutlinePackage(prompt = '', tone = 'warm', depth = 'standard') {
    const profile = classifyBookIdea(prompt, tone, depth);
    const title = buildTitleFromIdea(prompt, profile);
    const subtitle = buildSubtitle(profile);
    const chapters = buildChapterIdeas(profile, prompt);

    const introLine = `This outline is shaped for ${profile.audience} and uses a ${profile.voice} delivery style.`;
    const positioning = `Reader promise: ${profile.promise}.`;

    const markdown = [
      `# ${title}`,
      `## ${subtitle}`,
      '',
      `**Positioning**: ${profile.genre}`,
      `**Creative direction**: ${introLine}`,
      `**Core promise**: ${positioning}`,
      '',
      '## Suggested flow',
      ...chapters.map((chapter) => `### Chapter ${chapter.number}: ${chapter.title}\n- Focus: ${chapter.summary}\n- Why it matters: Keeps the reader moving with ${profile.chapterFlavor}.`),
      '',
      '## Extra ideas to include',
      '- Opening hook or personal story',
      '- Reflection or discussion prompts',
      '- Practical action steps at the end of each chapter',
      '- Strong closing section with encouragement and next steps'
    ].join('\n');

    return { title, subtitle, profile, chapters, markdown };
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
        const headingText = utils.escapeHtml(line.replace(/^#{1,6}\s*/, ''));
        html += `<h${level}>${headingText}</h${level}>`;
        continue;
      }

      if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${utils.escapeHtml(line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''))}</li>`;
        continue;
      }

      if (inList) {
        html += '</ul>';
        inList = false;
      }

      const inlineFormatted = utils.escapeHtml(line)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>');

      html += `<p>${inlineFormatted}</p>`;
    }

    if (inList) html += '</ul>';
    return html || '<p>No outline generated yet.</p>';
  }


  function buildOutlineSummary(outlinePackage) {
    return `
      <div class="ai-summary-meta">${outlinePackage.chapters.length} chapters • ${outlinePackage.profile.genre}</div>
      <div class="ai-summary-desc">A polished structure built for quick review before opening the full outline.</div>
    `;
  }

  function buildWritingSummary(writingPackage) {
    return `
      <div class="ai-summary-meta">${writingPackage.modeLabel}</div>
      <div class="ai-summary-desc">Generated and ready to preview before adding it to the editor.</div>
    `;
  }

  function inferWritingMode(prompt = '', selectedMode = 'auto') {
    if (selectedMode && selectedMode !== 'auto') return selectedMode;
    const text = prompt.toLowerCase();
    if (/blurb|description|back cover|amazon/i.test(text)) return 'blurb';
    if (/continue|keep writing|carry on|next section/i.test(text)) return 'continue';
    if (/new chapter|add chapter|another chapter|next chapter/i.test(text)) return 'new_chapter';
    if (/expand|elaborate|deepen|make longer/i.test(text)) return 'expand';
    if (/intro|introduction|opening/i.test(text)) return 'intro';
    if (/ebook|book|chapters?|parts?/i.test(text)) return 'ebook';
    return 'chapter';
  }

  function topicFromPrompt(prompt = '') {
    return prompt
      .replace(/write|create|generate|please|for me|about|a|an/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildParagraph(topic, profile, angle, emphasis) {
    return `${topic} becomes more useful when it is explained in a ${profile.voice} way, giving the reader clear direction instead of vague advice. This section leans into ${angle}, while keeping the tone centered on ${emphasis} so the writing feels focused, readable, and genuinely helpful.`;
  }

  function createWritingPackage(prompt = '', selectedMode = 'auto', currentEditorHtml = '') {
    const mode = inferWritingMode(prompt, selectedMode);
    const profile = classifyBookIdea(prompt, mode === 'ebook' ? 'professional' : 'warm', mode === 'ebook' ? 'standard' : 'starter');
    const rawTopic = topicFromPrompt(prompt) || 'your topic';
    const title = buildTitleFromIdea(rawTopic, profile);
    const chapterCount = parseRequestedChapterCount(prompt, 'standard');
    let html = '';
    let modeLabel = 'AI writing draft';
    let summary = '';

    if (mode === 'ebook') {
      modeLabel = `${chapterCount} chapter draft`;
      const chapters = buildChapterIdeas({ ...profile, chapterCount }, prompt).slice(0, chapterCount);
      html = `<h1>${title}</h1><p>${buildSubtitle(profile)}</p><p>${buildParagraph(title, profile, 'strong structure and reader flow', profile.promise)}</p>` + chapters.map((chapter) => {
        return `<h2>Chapter ${chapter.number}: ${chapter.title}</h2><p>${buildParagraph(chapter.title, profile, chapter.summary, profile.chapterFlavor)}</p><p>This chapter helps the reader move from information to action, using examples, encouragement, and practical takeaways that feel relevant to ${rawTopic.toLowerCase()}.</p>`;
      }).join('');
      summary = `A fuller ${chapterCount}-chapter draft for ${profile.genre.toLowerCase()}, with clear section headings and reader-friendly copy.`;
    } else if (mode === 'intro') {
      modeLabel = 'Introduction draft';
      html = `<h1>Introduction</h1><p>${buildParagraph(title, profile, 'a strong opening promise', profile.promise)}</p><p>This introduction positions the reader for what is ahead, explains why ${rawTopic.toLowerCase()} matters right now, and creates enough emotional pull to keep reading.</p>`;
      summary = `A polished opening section that introduces the topic clearly and sets the tone for the rest of the book.`;
    } else if (mode === 'blurb') {
      modeLabel = 'Book blurb';
      html = `<h2>${title}</h2><p>${title} is a ${profile.voice} guide for ${profile.audience}. It helps readers understand ${rawTopic.toLowerCase()} with clarity, confidence, and a practical sense of direction.</p><p>Inside, readers will find realistic guidance, chapter-by-chapter movement, and a message built around ${profile.promise}.</p>`;
      summary = `A concise, marketable blurb that can work for a sales page, reader page, or book description.`;
    } else if (mode === 'continue') {
      const context = utils.stripHtml(currentEditorHtml).trim().split(/\s+/).slice(0, 40).join(' ');
      modeLabel = 'Continuation draft';
      html = `<h2>Next Section</h2><p>${buildParagraph(title, profile, 'a natural continuation of the current draft', profile.promise)}</p><p>${context ? `Building from the current draft, this section keeps the same momentum by expanding on: “${utils.escapeHtml(context)}...”` : 'This continuation is written to pick up naturally from your current draft and keep the reader engaged.'}</p>`;
      summary = `A natural continuation that helps the writer move forward instead of staring at a blank page.`;
    } else if (mode === 'new_chapter') {
      const nextNumber = currentDraft.chapters.length + 1;
      modeLabel = `New chapter draft`;
      html = `<h2>Chapter ${nextNumber}: ${title}</h2><p>${buildParagraph(title, profile, 'the next meaningful step in the book', profile.promise)}</p><p>This chapter is designed to extend the current manuscript with fresh momentum, stronger progression, and a clear reason for the reader to keep going.</p><ul><li>Connect this chapter to what came before</li><li>Introduce a fresh insight or turning point</li><li>Close with a transition into the next idea</li></ul>`;
      summary = `A new chapter draft designed to slot naturally into the current ebook.`;
    } else if (mode === 'expand') {
      const selectionText = window.getSelection ? String(window.getSelection()).trim() : '';
      modeLabel = 'Expanded section';
      html = `<h2>Expanded Section</h2><p>${buildParagraph(title, profile, 'greater depth and more developed explanation', profile.promise)}</p><p>${selectionText ? `This expansion takes the selected idea — “${utils.escapeHtml(selectionText.slice(0, 160))}${selectionText.length > 160 ? '…' : ''}” — and develops it with more nuance, stronger explanation, and smoother flow.` : 'This expansion is designed to take a short idea and develop it into something richer, more persuasive, and easier for the reader to follow.'}</p>`;
      summary = `A fuller version of a shorter section, ready to insert where the draft needs more depth.`;
    } else {
      modeLabel = 'Chapter section';
      html = `<h2>${title}</h2><p>${buildParagraph(title, profile, 'clear teaching and momentum', profile.promise)}</p><p>This section breaks the idea into language that is simple, specific, and easy for the reader to apply in real life, regardless of niche or topic.</p><ul><li>Use a clear example or story</li><li>Show the reader what to do next</li><li>Close with a practical takeaway</li></ul>`;
      summary = `A focused section draft that gives the writer something useful to build on immediately.`;
    }

    return { mode, modeLabel, title, summary, html };
  }

  function deriveGeneratedTitleFromHtml(html = '', fallback = 'AI Writing Draft') {
    const match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (!match) return fallback;
    return utils.stripHtml(match[1]).trim() || fallback;
  }

  function appendGeneratedAsNewChapter() {
    if (!latestGeneratedHtml) {
      utils.toast('Generate something first.');
      return;
    }

    syncActiveChapterFromEditor();
    const chapterTitle = deriveGeneratedTitleFromHtml(
      latestGeneratedHtml,
      `Chapter ${currentDraft.chapters.length + 1}`
    );

    currentDraft.chapters.push({
      id: utils.uid(8),
      title: chapterTitle,
      content: latestGeneratedHtml
    });

    activeChapterIndex = currentDraft.chapters.length - 1;
    quill.root.innerHTML = latestGeneratedHtml;
    renderChapterList();
    updateMetrics();
    queueSave();
    utils.toast('New AI chapter added to your draft.');
  }


  function setPreviewContent(kind, html, options = {}) {
    latestGeneratedKind = kind;
    latestGeneratedHtml = html;
    latestGeneratedMode = options.mode || latestGeneratedMode;
    if (aiPreviewLabel) aiPreviewLabel.textContent = options.label || 'AI preview';
    if (aiPreviewTitle) aiPreviewTitle.textContent = options.title || 'Review your generated content';
    if (aiPreviewNote) aiPreviewNote.textContent = options.note || 'Review everything here first, then insert it into the editor only if it fits your draft.';
    if (aiPreviewOutput) aiPreviewOutput.innerHTML = html;
  }


  async function requestAssistant(action, payload = {}) {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Assistant request failed.');
    }
    return data.text || '';
  }

  async function generateOutline() {
    const prompt = outlinePromptInput?.value.trim() || '';
    const tone = document.getElementById('outlineTone')?.value || 'warm';
    const depth = document.getElementById('outlineDepth')?.value || 'standard';

    if (!prompt) {
      utils.toast('Add your book idea first.');
      setOutlineStatus('Add a short description of your ebook idea to generate an outline.', 'warning');
      outlinePromptInput?.focus();
      return;
    }

    latestOutlineHtml = '';
    if (outlineResult) outlineResult.hidden = true;

    const stagedMessages = [
      'Reading your book idea…',
      'Shaping a stronger angle…',
      'Building chapter flow and reader promise…'
    ];

    utils.setButtonState(generateOutlineBtn, 'Thinking…');
    setSaveState('Outline readying…', 'active');

    let stageIndex = 0;
    setOutlineStatus(stagedMessages[stageIndex], 'active');
    const stageTimer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stagedMessages.length - 1);
      setOutlineStatus(stagedMessages[stageIndex], 'active');
    }, 520);

    try {
      const markdown = await requestAssistant('generate_outline', {
        prompt,
        title: titleInput?.value.trim() || '',
        author: authorInput?.value.trim() || '',
        currentContent: utils.stripHtml(quill.root.innerHTML).slice(0, 4000),
        tone,
        depth
      });

      const outlinePackage = createOutlinePackage(prompt, tone, depth);
      latestOutlineHtml = markdownToHtml(markdown);
      setPreviewContent('outline', latestOutlineHtml, {
        label: 'AI outline preview',
        title: 'Review your generated outline',
        note: 'Check the structure before sending it into your draft. This keeps the sidebar clean while still giving you the full outline when you need it.'
      });

      if (outlineSummary) outlineSummary.innerHTML = buildOutlineSummary(outlinePackage);
      if (outlineResult) outlineResult.hidden = false;

      setOutlineStatus(
        `Outline ready — ${outlinePackage.chapters.length} chapters mapped in a ${outlinePackage.profile.voice} style.`,
        'success'
      );
      setSaveState('Saved', 'success');
      utils.toast('AI outline generated.');
    } catch (error) {
      setOutlineStatus(error.message || 'The outline could not be generated right now. Please try again.', 'error');
      setSaveState('Saved', 'default');
      utils.toast('Outline generation failed.');
    } finally {
      window.clearInterval(stageTimer);
      utils.resetButtonState(generateOutlineBtn);
    }
  }

  function insertGeneratedIntoEditor(replace = false) {
    if (!latestGeneratedHtml) {
      utils.toast('Generate something first.');
      return;
    }

    if (latestGeneratedKind === 'writing' && latestGeneratedMode === 'new_chapter' && !replace) {
      appendGeneratedAsNewChapter();
      return;
    }

    const generatedTitle = latestGeneratedKind === 'outline'
      ? 'Generated Outline'
      : deriveGeneratedTitleFromHtml(latestGeneratedHtml, 'AI Writing Draft');

    if (replace) {
      syncActiveChapterFromEditor();
      currentDraft.chapters = [{
        id: utils.uid(8),
        title: generatedTitle,
        content: latestGeneratedHtml
      }];
      activeChapterIndex = 0;
      quill.root.innerHTML = latestGeneratedHtml;
      renderChapterList();
      updateMetrics();
      queueSave();
      utils.toast(latestGeneratedKind === 'outline' ? 'Outline replaced your current draft.' : 'AI draft replaced your current draft.');
      return;
    }

    const range = quill.getSelection(true);
    if (range) {
      quill.clipboard.dangerouslyPasteHTML(range.index, latestGeneratedHtml);
    } else {
      quill.clipboard.dangerouslyPasteHTML(quill.getLength() - 1, latestGeneratedHtml);
    }
    syncActiveChapterFromEditor();
    renderChapterList();
    updateMetrics();
    queueSave();
    utils.toast(latestGeneratedKind === 'outline' ? 'Outline inserted into your editor.' : 'AI writing inserted into your editor.');
  }

  async function generateWriting() {
    const prompt = writingPromptInput?.value.trim() || '';
    const mode = writingModeSelect?.value || 'auto';

    if (!prompt) {
      utils.toast('Tell the assistant what to write.');
      setWritingStatus('Add a writing request first — for example, write a 6 chapter ebook on any topic.', 'warning');
      writingPromptInput?.focus();
      return;
    }

    if (writingResult) writingResult.hidden = true;

    const stagedMessages = [
      'Reading your writing request…',
      'Planning a stronger structure…',
      'Drafting polished copy for your editor…'
    ];

    utils.setButtonState(generateWritingBtn, 'Thinking…');
    setSaveState('AI drafting…', 'active');

    let stageIndex = 0;
    setWritingStatus(stagedMessages[stageIndex], 'active');
    const stageTimer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stagedMessages.length - 1);
      setWritingStatus(stagedMessages[stageIndex], 'active');
    }, 520);

    try {
      const selectedRange = quill.getSelection();
      const selectedText = selectedRange && selectedRange.length > 0
        ? quill.getText(selectedRange.index, selectedRange.length).trim()
        : '';

      const markdown = await requestAssistant('generate_writing', {
        prompt,
        mode,
        title: titleInput?.value.trim() || '',
        author: authorInput?.value.trim() || '',
        currentContent: utils.stripHtml(draftPayload().content).slice(0, 9000),
        selectedText,
        chapterCount: currentDraft.chapters.length
      });

      const writingPackage = createWritingPackage(prompt, mode, quill.root.innerHTML);
      const generatedHtml = markdownToHtml(markdown);
      setPreviewContent('writing', generatedHtml, {
        label: 'AI writing preview',
        title: 'Review your generated writing',
        note: 'This draft is ready to drop into your editor. Review it first, then insert it only if it fits your voice.',
        mode: writingPackage.mode
      });

      if (writingSummary) writingSummary.innerHTML = buildWritingSummary(writingPackage);
      if (writingResult) writingResult.hidden = false;
      setWritingStatus(`${writingPackage.modeLabel} ready to review.`, 'success');
      setSaveState('Saved', 'success');
      utils.toast('AI writing generated.');
    } catch (error) {
      setWritingStatus(error.message || 'The assistant could not draft that request right now. Please try again.', 'error');
      setSaveState('Saved', 'default');
      utils.toast('AI writing failed.');
    } finally {
      window.clearInterval(stageTimer);
      utils.resetButtonState(generateWritingBtn);
    }
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

  document.querySelectorAll('[data-prompt-fill]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-prompt-fill]').forEach((item) => item.classList.remove('is-active'));
      chip.classList.add('is-active');
      if (outlinePromptInput) {
        outlinePromptInput.value = chip.dataset.promptFill || '';
        outlinePromptInput.focus();
      }
    });
  });

  generateOutlineBtn?.addEventListener('click', generateOutline);
  generateWritingBtn?.addEventListener('click', generateWriting);
  viewOutlineBtn?.addEventListener('click', () => {
    if (!latestOutlineHtml) {
      utils.toast('Generate an outline first.');
      return;
    }
    utils.openModal('aiPreviewModal');
  });
  viewWritingBtn?.addEventListener('click', () => {
    if (!latestGeneratedHtml || latestGeneratedKind !== 'writing') {
      utils.toast('Generate writing first.');
      return;
    }
    utils.openModal('aiPreviewModal');
  });
  insertGeneratedBtn?.addEventListener('click', () => {
    insertGeneratedIntoEditor(false);
    utils.closeModal('aiPreviewModal');
  });
  replaceGeneratedBtn?.addEventListener('click', () => {
    insertGeneratedIntoEditor(true);
    utils.closeModal('aiPreviewModal');
  });

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
    syncActiveChapterFromEditor();
    const payload = draftPayload();
    const editorHtml = quill.root.innerHTML || '';
    const editorText = utils.stripHtml(editorHtml).trim();

    if (!editorText) {
      utils.toast('Nothing to export yet. Write something first.');
      return;
    }

    utils.setButtonState(confirmExportBtn, 'Generating PDF…');
    setSaveState('Generating PDF…', 'active');

    const exportNode = document.createElement('div');
    exportNode.className = 'export-sheet export-sheet-render';
    exportNode.setAttribute('aria-hidden', 'true');
    exportNode.style.position = 'fixed';
    exportNode.style.left = '0';
    exportNode.style.top = '0';
    exportNode.style.zIndex = '9999';
    exportNode.style.pointerEvents = 'none';
    exportNode.style.opacity = '1';

    exportNode.innerHTML = `
      <h1>${payload.title}</h1>
      <div class="author">by ${payload.author}</div>
      <div class="export-body">${payload.content || editorHtml}</div>
      <div class="export-footer">Created with PeeyashBooks</div>
    `;
    document.body.appendChild(exportNode);

    const options = {
      margin: [10, 10, 14, 10],
      filename: `${utils.slugify(payload.title) || 'peeyashbooks-export'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await html2pdf().set(options).from(exportNode).save();
      utils.toast('PDF export complete.');
      utils.closeModal('exportModal');
      setSaveState('Saved', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
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

