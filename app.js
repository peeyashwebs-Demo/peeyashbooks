/**
 * ============================================================
 * PeeyashBooks Editor — app.js  v4.0.0
 * Premium Cinematic Ebook Studio
 * ============================================================
 */
'use strict';

(function PeeyashBooksEditor() {

  /* ─────────────────────────────────────────────────────────
     1. UTILS
     ───────────────────────────────────────────────────────── */
  const Utils = (() => {
    const $    = id  => document.getElementById(id);
    const $q   = sel => document.querySelector(sel);
    const $all = sel => document.querySelectorAll(sel);
    const uid  = ()  => Math.random().toString(36).slice(2, 9);

    const escapeHtml = str => {
      const el = document.createElement('div');
      el.textContent = str ?? '';
      return el.innerHTML;
    };

    const stripHtml = html => html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();

    const countWords = html => {
      const t = stripHtml(html);
      return t ? t.split(/\s+/).filter(Boolean).length : 0;
    };

    const formatReadTime = mins => {
      if (mins < 1)  return '<1m';
      if (mins < 60) return `${Math.round(mins)}m`;
      return `${Math.floor(mins/60)}h ${Math.round(mins%60)}m`;
    };

    const formatBytes = b => b > 1024 ? `${(b/1024).toFixed(1)} KB` : `${b} B`;

    const debounce = (fn, ms) => {
      let t;
      return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    return { $, $q, $all, uid, escapeHtml, stripHtml, countWords, formatReadTime, formatBytes, debounce, lerp };
  })();

  /* ─────────────────────────────────────────────────────────
     2. STATE
     ───────────────────────────────────────────────────────── */
  const State = (() => {
    let _s = {
      chapters: [], activeChapterId: null, tocEntries: [],
      coverImageURL: null, coverTemplate: 0,
      publishedSlug: null, lastSaved: null,
      watermarkRemoved: false, showcaseListings: [],
      activeTone: 'professional',
    };
    const get   = ()    => _s;
    const set   = p     => { _s = { ..._s, ...p }; };
    const reset = ()    => { set({ chapters:[], activeChapterId:null, tocEntries:[], coverImageURL:null, publishedSlug:null, lastSaved:null, watermarkRemoved:false, showcaseListings:[], coverTemplate:0, activeTone:'professional' }); };
    return { get, set, reset };
  })();

  /* ─────────────────────────────────────────────────────────
     3. STORAGE
     ───────────────────────────────────────────────────────── */
  const Storage = (() => {
    const KEY = 'peeyashbooks_v4';
    const _snap = () => {
      const s = State.get();
      return {
        title: Utils.$('ebook-title-input').value,
        author: Utils.$('author-input').value,
        chapters: s.chapters, tocEntries: s.tocEntries,
        activeChapterId: s.activeChapterId, publishedSlug: s.publishedSlug,
        watermarkRemoved: s.watermarkRemoved, showcaseListings: s.showcaseListings,
        coverTemplate: s.coverTemplate,
      };
    };
    const save = () => { localStorage.setItem(KEY, JSON.stringify(_snap())); };
    const load = () => { try { const r=localStorage.getItem(KEY); return r?JSON.parse(r):null; } catch(e){ return null; } };
    const size = () => new Blob([JSON.stringify(_snap())]).size;
    return { save, load, size };
  })();

  /* ─────────────────────────────────────────────────────────
     4. TOAST
     ───────────────────────────────────────────────────────── */
  const Toast = (() => {
    const ICONS = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
    const show = (msg, type='success') => {
      const c = Utils.$('toast-container');
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<div class="toast-icon">${ICONS[type]??'✓'}</div><span>${Utils.escapeHtml(msg)}</span>`;
      c.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
      setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3400);
    };
    return { show };
  })();

  /* ─────────────────────────────────────────────────────────
     5. MODAL
     ───────────────────────────────────────────────────────── */
  const Modal = (() => {
    const open  = id => Utils.$(id)?.classList.add('open');
    const close = id => Utils.$(id)?.classList.remove('open');
    const init  = () => {
      Utils.$all('[data-close]').forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
      Utils.$all('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) close(o.id); }));
    };
    return { open, close, init };
  })();

  /* ─────────────────────────────────────────────────────────
     6. LOADER
     ───────────────────────────────────────────────────────── */
  const Loader = (() => {
    const MESSAGES = ['Initializing studio…','Loading writing engine…','Preparing AI systems…','Setting up your workspace…','Almost ready…'];
    let _idx = 0;

    const _makeParticles = () => {
      const container = Utils.$('loader-particles');
      if (!container) return;
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'loader-particle';
        p.style.cssText = `
          left: ${Math.random()*100}%;
          bottom: ${Math.random()*20}%;
          animation-duration: ${3 + Math.random()*5}s;
          animation-delay: ${Math.random()*3}s;
          background: hsl(${220 + Math.random()*60},80%,70%);
          width: ${1.5 + Math.random()*3}px;
          height: ${1.5 + Math.random()*3}px;
        `;
        container.appendChild(p);
      }
    };

    const _tick = () => {
      const statusEl = Utils.$('loader-status');
      if (!statusEl) return;
      statusEl.style.animation = 'none';
      void statusEl.offsetWidth;
      statusEl.style.animation = '';
      statusEl.textContent = MESSAGES[_idx++ % MESSAGES.length];
    };

    const hide = () => {
      const loader = Utils.$('loader');
      if (!loader) return;
      loader.classList.add('fade-out');
      setTimeout(() => { loader.style.display = 'none'; }, 900);
    };

    const init = () => {
      _makeParticles();
      const tickInterval = setInterval(_tick, 550);
      setTimeout(() => {
        clearInterval(tickInterval);
        hide();
      }, 2600);
    };

    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     7. EDITOR (Quill)
     ───────────────────────────────────────────────────────── */
  const Editor = (() => {
    let _q = null;

    const _registerFonts = () => {
      const F = Quill.import('attributors/class/font');
      F.whitelist = ['cormorant','dm-sans','georgia','times','arial','courier','trebuchet','verdana'];
      Quill.register(F, true);
      const S = Quill.import('attributors/style/size');
      S.whitelist = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','64px'];
      Quill.register(S, true);
    };

    const TOOLBAR = [
      [{ font: ['cormorant','dm-sans','georgia','times','arial','courier','trebuchet','verdana'] }],
      [{ size: ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','64px'] }],
      [{ header: [1,2,3,4,5,6,false] }],
      ['bold','italic','underline','strike'],
      [{ script:'sub' },{ script:'super' }],
      [{ color:[] },{ background:[] }],
      [{ list:'ordered' },{ list:'bullet' }],
      [{ indent:'-1' },{ indent:'+1' }],
      ['blockquote','code-block'],
      [{ align:[] }],
      ['link','image'],
      ['clean'],
    ];

    const _css = () => {
      if (document.getElementById('pb-qstyle')) return;
      const s = document.createElement('style');
      s.id = 'pb-qstyle';
      s.textContent = `
        #editor-container{display:flex!important;flex-direction:column!important;overflow:visible!important;min-height:calc(100vh - 220px)}
        .ql-toolbar.ql-snow{position:sticky!important;top:0!important;z-index:200!important;flex-shrink:0!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:2px!important;padding:8px 12px!important;background:rgba(8,10,22,0.97)!important;border:none!important;border-bottom:1px solid rgba(91,115,255,0.22)!important;border-radius:24px 24px 0 0!important;backdrop-filter:blur(20px)!important;box-shadow:0 4px 24px rgba(0,0,0,0.4)!important}
        .ql-container.ql-snow{flex:1!important;border:none!important;background:transparent!important;border-radius:0 0 24px 24px!important;overflow-y:auto!important}
        .ql-toolbar.ql-snow .ql-formats{display:flex!important;align-items:center!important;margin-right:4px!important;padding-right:6px!important;border-right:1px solid rgba(255,255,255,0.05)!important}
        .ql-toolbar.ql-snow .ql-formats:last-child{border-right:none!important}
        .ql-toolbar.ql-snow button{width:26px!important;height:26px!important;border-radius:5px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;transition:all .15s!important}
        .ql-toolbar.ql-snow button:hover{background:rgba(91,115,255,0.18)!important;transform:translateY(-1px)!important}
        .ql-toolbar.ql-snow button.ql-active{background:rgba(91,115,255,0.28)!important}
        .ql-snow .ql-stroke{stroke:#8890b8!important;transition:stroke .15s!important}
        .ql-snow .ql-fill{fill:#8890b8!important;transition:fill .15s!important}
        .ql-toolbar button:hover .ql-stroke,.ql-toolbar button.ql-active .ql-stroke{stroke:#a0b0ff!important}
        .ql-toolbar button:hover .ql-fill,.ql-toolbar button.ql-active .ql-fill{fill:#a0b0ff!important}
        .ql-snow .ql-picker{color:#8890b8!important;height:26px!important;font-size:12px!important}
        .ql-snow .ql-picker-label{color:#8890b8!important;border:1px solid rgba(255,255,255,0.07)!important;border-radius:5px!important;padding:0 6px!important;height:26px!important;display:flex!important;align-items:center!important;background:rgba(255,255,255,0.02)!important;transition:all .15s!important;cursor:pointer!important}
        .ql-snow .ql-picker-label:hover,.ql-snow .ql-picker.ql-expanded .ql-picker-label{background:rgba(91,115,255,0.14)!important;color:#c0ccff!important;border-color:rgba(91,115,255,0.35)!important}
        .ql-snow .ql-picker-options{background:#12152a!important;border:1px solid rgba(91,115,255,0.28)!important;border-radius:10px!important;padding:6px!important;box-shadow:0 20px 60px rgba(0,0,0,0.8)!important;z-index:9999!important;max-height:220px!important;overflow-y:auto!important}
        .ql-snow .ql-picker-item{color:#8890b8!important;border-radius:5px!important;padding:5px 10px!important;font-size:12px!important;transition:all .12s!important;cursor:pointer!important}
        .ql-snow .ql-picker-item:hover{background:rgba(91,115,255,0.16)!important;color:#c0ccff!important}
        .ql-snow .ql-picker-item.ql-selected{background:rgba(91,115,255,0.24)!important;color:#7b93ff!important}
        .ql-font .ql-picker-label:not([data-value])::before{content:'Font'}
        .ql-font .ql-picker-label[data-value=cormorant]::before,.ql-font .ql-picker-item[data-value=cormorant]::before{content:'Cormorant';font-family:'Cormorant Garamond',serif}
        .ql-font .ql-picker-label[data-value=dm-sans]::before,.ql-font .ql-picker-item[data-value=dm-sans]::before{content:'DM Sans';font-family:'DM Sans',sans-serif}
        .ql-font .ql-picker-label[data-value=georgia]::before,.ql-font .ql-picker-item[data-value=georgia]::before{content:'Georgia';font-family:Georgia,serif}
        .ql-font .ql-picker-label[data-value=times]::before,.ql-font .ql-picker-item[data-value=times]::before{content:'Times New Roman';font-family:'Times New Roman',serif}
        .ql-font .ql-picker-label[data-value=arial]::before,.ql-font .ql-picker-item[data-value=arial]::before{content:'Arial';font-family:Arial,sans-serif}
        .ql-font .ql-picker-label[data-value=courier]::before,.ql-font .ql-picker-item[data-value=courier]::before{content:'Courier New';font-family:'Courier New',monospace}
        .ql-font .ql-picker-label[data-value=trebuchet]::before,.ql-font .ql-picker-item[data-value=trebuchet]::before{content:'Trebuchet MS';font-family:'Trebuchet MS',sans-serif}
        .ql-font .ql-picker-label[data-value=verdana]::before,.ql-font .ql-picker-item[data-value=verdana]::before{content:'Verdana';font-family:Verdana,sans-serif}
        .ql-size .ql-picker-label:not([data-value])::before{content:'Size'}
        .ql-size .ql-picker-label[data-value="10px"]::before,.ql-size .ql-picker-item[data-value="10px"]::before{content:'10px'}
        .ql-size .ql-picker-label[data-value="12px"]::before,.ql-size .ql-picker-item[data-value="12px"]::before{content:'12px'}
        .ql-size .ql-picker-label[data-value="14px"]::before,.ql-size .ql-picker-item[data-value="14px"]::before{content:'14px'}
        .ql-size .ql-picker-label[data-value="16px"]::before,.ql-size .ql-picker-item[data-value="16px"]::before{content:'16px'}
        .ql-size .ql-picker-label[data-value="18px"]::before,.ql-size .ql-picker-item[data-value="18px"]::before{content:'18px'}
        .ql-size .ql-picker-label[data-value="20px"]::before,.ql-size .ql-picker-item[data-value="20px"]::before{content:'20px'}
        .ql-size .ql-picker-label[data-value="24px"]::before,.ql-size .ql-picker-item[data-value="24px"]::before{content:'24px'}
        .ql-size .ql-picker-label[data-value="28px"]::before,.ql-size .ql-picker-item[data-value="28px"]::before{content:'28px'}
        .ql-size .ql-picker-label[data-value="32px"]::before,.ql-size .ql-picker-item[data-value="32px"]::before{content:'32px'}
        .ql-size .ql-picker-label[data-value="36px"]::before,.ql-size .ql-picker-item[data-value="36px"]::before{content:'36px'}
        .ql-size .ql-picker-label[data-value="48px"]::before,.ql-size .ql-picker-item[data-value="48px"]::before{content:'48px'}
        .ql-size .ql-picker-label[data-value="64px"]::before,.ql-size .ql-picker-item[data-value="64px"]::before{content:'64px'}
        .ql-header .ql-picker-label:not([data-value])::before{content:'Paragraph'}
        .ql-header .ql-picker-label[data-value="1"]::before,.ql-header .ql-picker-item[data-value="1"]::before{content:'Heading 1'}
        .ql-header .ql-picker-label[data-value="2"]::before,.ql-header .ql-picker-item[data-value="2"]::before{content:'Heading 2'}
        .ql-header .ql-picker-label[data-value="3"]::before,.ql-header .ql-picker-item[data-value="3"]::before{content:'Heading 3'}
        .ql-header .ql-picker-label[data-value="4"]::before,.ql-header .ql-picker-item[data-value="4"]::before{content:'Heading 4'}
        .ql-header .ql-picker-label[data-value="5"]::before,.ql-header .ql-picker-item[data-value="5"]::before{content:'Heading 5'}
        .ql-header .ql-picker-label[data-value="6"]::before,.ql-header .ql-picker-item[data-value="6"]::before{content:'Heading 6'}
        .ql-color-picker.ql-color .ql-picker-label::before{content:'A';font-weight:700;font-size:13px}
        .ql-color-picker.ql-background .ql-picker-label::before{content:'▐';font-size:13px}
        .ql-color-picker .ql-picker-label svg{display:none!important}
        .ql-color-picker .ql-picker-options{width:200px!important;padding:8px!important}
        .ql-color-picker .ql-picker-item{width:20px!important;height:20px!important;border-radius:4px!important;margin:2px!important;padding:0!important;border:2px solid transparent!important;display:inline-block!important}
        .ql-color-picker .ql-picker-item:hover{border-color:#fff!important;transform:scale(1.2)!important}
        .ql-font-cormorant{font-family:'Cormorant Garamond',serif!important}
        .ql-font-dm-sans{font-family:'DM Sans',sans-serif!important}
        .ql-font-georgia{font-family:Georgia,serif!important}
        .ql-font-times{font-family:'Times New Roman',serif!important}
        .ql-font-arial{font-family:Arial,sans-serif!important}
        .ql-font-courier{font-family:'Courier New',monospace!important}
        .ql-font-trebuchet{font-family:'Trebuchet MS',sans-serif!important}
        .ql-font-verdana{font-family:Verdana,sans-serif!important}
        .ql-editor{min-height:500px;font-family:'Cormorant Garamond',serif!important;font-size:19px!important;line-height:1.9!important;color:#eef0ff!important;padding:44px 56px!important;background:transparent!important;caret-color:#5b73ff}
        .ql-editor.ql-blank::before{color:#535a7a!important;font-style:italic!important;font-family:'Cormorant Garamond',serif!important;font-size:19px!important;left:56px!important}
        .ql-editor h1{font-family:'Cinzel',serif!important;font-size:2.2em!important;line-height:1.2!important;background:linear-gradient(135deg,#5b73ff,#9b5fe0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5em!important}
        .ql-editor h2{font-family:'Cinzel',serif!important;font-size:1.6em!important;background:linear-gradient(135deg,#5b73ff,#9b5fe0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5em!important}
        .ql-editor h3{font-family:'Cinzel',serif!important;font-size:1.3em!important;background:linear-gradient(135deg,#5b73ff,#9b5fe0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5em!important}
        .ql-editor h4{font-family:'Cinzel',serif!important;font-size:1.1em!important;color:#8890b8!important}
        .ql-editor h5{font-family:'Cinzel',serif!important;font-size:1em!important;color:#8890b8!important}
        .ql-editor h6{font-family:'Cinzel',serif!important;font-size:.9em!important;color:#8890b8!important}
        .ql-editor p{margin-bottom:1.2em;color:#eef0ff}
        .ql-editor blockquote{border-left:3px solid #5b73ff!important;padding-left:20px!important;color:#8890b8!important;font-style:italic!important;margin:1.5em 0!important}
        .ql-editor pre,.ql-editor code{background:rgba(91,115,255,0.08)!important;border:1px solid rgba(91,115,255,0.2)!important;border-radius:6px!important;color:#a0b0ff!important;font-family:'Courier New',monospace!important}
        .ql-editor ol,.ql-editor ul{padding-left:1.6em;margin-bottom:1em}
        .ql-editor li{margin-bottom:.3em;color:#eef0ff}
        .ql-editor a{color:#5b73ff;text-decoration:underline}
        .ql-editor img{max-width:100%;border-radius:8px;margin:1em 0}
        .ql-align .ql-picker-label svg,.ql-align .ql-picker-item svg{display:inline-block!important}
      `;
      document.head.appendChild(s);
    };

    const init = () => {
      _registerFonts();
      _css();
      _q = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Start writing your story… Every great ebook begins with a single word.',
        modules: {
          toolbar: {
            container: TOOLBAR,
            handlers: {
              image: () => {
                const url = prompt('Paste image URL:');
                if (url?.trim()) {
                  const r = _q.getSelection(true);
                  _q.insertEmbed(r ? r.index : _q.getLength(), 'image', url.trim());
                }
              },
            },
          },
        },
      });
      _q.on('text-change', () => {
        AutoSave.schedule();
        _sync();
        Stats.updateLive();
        ReadingProgress.update();
      });
    };

    const _sync = () => {
      const s = State.get();
      if (!s.activeChapterId) return;
      const ch = s.chapters.find(c => c.id === s.activeChapterId);
      if (ch) { ch.content = _q.root.innerHTML; ch.words = Utils.countWords(ch.content); }
    };

    const setContent     = html => { if (_q) _q.root.innerHTML = html || ''; };
    const getContent     = ()   => _q?.root.innerHTML ?? '';
    const insertAtCursor = txt  => {
      if (!_q) return;
      const r = _q.getSelection(true);
      _q.insertText(r ? r.index : _q.getLength(), '\n' + txt + '\n');
    };
    const syncNow = () => _sync();

    return { init, setContent, getContent, insertAtCursor, syncNow };
  })();

  /* ─────────────────────────────────────────────────────────
     8. AUTO SAVE
     ───────────────────────────────────────────────────────── */
  const AutoSave = (() => {
    const _saving = () => { Utils.$('save-dot').classList.add('saving'); Utils.$('save-status').textContent='Saving…'; };
    const _saved  = () => {
      Utils.$('save-dot').classList.remove('saving'); Utils.$('save-status').textContent='Saved';
      const now=new Date(); State.set({lastSaved:now});
      const el=Utils.$('stat-lastsaved'); if(el) el.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    };
    const _err = () => { Utils.$('save-dot').classList.remove('saving'); Utils.$('save-status').textContent='Save failed'; Toast.show('Save failed — storage may be full','error'); };
    const _run = () => {
      Editor.syncNow();
      try { Storage.save(); _saved(); Stats.update(); } catch(e) { _err(); }
    };
    const _d = Utils.debounce(_run, 1200);
    const schedule  = () => { _saving(); _d(); };
    const immediate = () => { _saving(); _run(); };
    return { schedule, immediate };
  })();

  /* ─────────────────────────────────────────────────────────
     9. CHAPTERS
     ───────────────────────────────────────────────────────── */
  const Chapters = (() => {
    const create = title => ({ id: Utils.uid(), title: title||'Untitled Chapter', content:'', words:0 });

    const render = () => {
      const list = Utils.$('chapter-list');
      const { chapters, activeChapterId } = State.get();
      if (!chapters.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div>No chapters yet.<br>Click "New Chapter" to begin.</div></div>`;
        return;
      }
      const frag = document.createDocumentFragment();
      chapters.forEach((ch, idx) => frag.appendChild(_card(ch, idx, activeChapterId)));
      list.innerHTML = '';
      list.appendChild(frag);
      _initSortable();
    };

    const _card = (ch, idx, activeId) => {
      const card = document.createElement('div');
      card.className = `chapter-card${ch.id === activeId ? ' active':''}`;
      card.dataset.id = ch.id;
      const readMins = (ch.words / 200);
      card.innerHTML = `
        <div class="ch-title">
          <span class="ch-drag" title="Drag to reorder">⋮⋮</span>
          <span class="ch-num">${idx+1}</span>
          <span class="ch-name">${Utils.escapeHtml(ch.title)}</span>
          <div class="ch-actions">
            <button class="ch-btn rename" title="Rename">✏</button>
            <button class="ch-btn dupe" title="Duplicate">⧉</button>
            <button class="ch-btn delete" title="Delete">🗑</button>
          </div>
        </div>
        <div class="ch-meta">
          <span class="ch-words">${ch.words.toLocaleString()} words</span>
          <span class="ch-readtime">· ${Utils.formatReadTime(readMins)} read</span>
        </div>`;
      card.addEventListener('click', e => {
        if (e.target.closest('.rename')) { _rename(ch.id, card); return; }
        if (e.target.closest('.delete')) { _delete(ch.id); return; }
        if (e.target.closest('.dupe'))   { _duplicate(ch.id); return; }
        switchTo(ch.id);
      });
      TiltEffect.bind(card);
      return card;
    };

    const _initSortable = () => {
      const list = Utils.$('chapter-list');
      if (!list || typeof Sortable === 'undefined') return;
      if (list._sortable) list._sortable.destroy();
      list._sortable = Sortable.create(list, {
        handle: '.ch-drag',
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: evt => {
          const s = State.get();
          const [moved] = s.chapters.splice(evt.oldIndex, 1);
          s.chapters.splice(evt.newIndex, 0, moved);
          render();
          AutoSave.schedule();
        },
      });
    };

    const switchTo = id => {
      const s = State.get();
      if (s.activeChapterId) {
        const cur = s.chapters.find(c => c.id === s.activeChapterId);
        if (cur) { cur.content = Editor.getContent(); cur.words = Utils.countWords(cur.content); }
      }
      State.set({ activeChapterId: id });
      const ch = s.chapters.find(c => c.id === id);
      if (!ch) return;
      Editor.setContent(ch.content);
      const bc = Utils.$('breadcrumb-ch'); if (bc) bc.textContent = ch.title;
      render(); Stats.update(); Stats.updateLive();
    };

    const add = () => {
      const s = State.get();
      const ch = create(`Chapter ${s.chapters.length + 1}`);
      s.chapters.push(ch);
      render(); switchTo(ch.id); Stats.update(); AutoSave.schedule();
      Toast.show('New chapter added!', 'success');
    };

    const _duplicate = id => {
      const s = State.get();
      const orig = s.chapters.find(c => c.id === id);
      if (!orig) return;
      const copy = { ...orig, id: Utils.uid(), title: orig.title + ' (Copy)' };
      const idx = s.chapters.findIndex(c => c.id === id);
      s.chapters.splice(idx + 1, 0, copy);
      render(); Stats.update(); AutoSave.schedule();
      Toast.show('Chapter duplicated!', 'success');
    };

    const _delete = id => {
      if (!confirm('Delete this chapter? This cannot be undone.')) return;
      const s = State.get();
      const idx = s.chapters.findIndex(c => c.id === id);
      if (idx === -1) return;
      s.chapters.splice(idx, 1);
      if (s.activeChapterId === id) {
        State.set({ activeChapterId: null }); Editor.setContent('');
        const bc = Utils.$('breadcrumb-ch'); if (bc) bc.textContent = 'Select a chapter';
        if (s.chapters.length) switchTo(s.chapters[Math.max(0, idx-1)].id);
      }
      render(); Stats.update(); AutoSave.schedule();
      Toast.show('Chapter deleted', 'info');
    };

    const _rename = (id, card) => {
      const s = State.get();
      const ch = s.chapters.find(c => c.id === id);
      if (!ch) return;
      const nameEl = card.querySelector('.ch-name');
      const prev = ch.title;
      const input = document.createElement('input');
      input.className = 'inline-rename'; input.value = prev;
      nameEl.replaceWith(input); input.focus(); input.select();
      const commit = () => {
        const t = input.value.trim() || prev; ch.title = t;
        const span = document.createElement('span'); span.className = 'ch-name'; span.textContent = t; input.replaceWith(span);
        if (s.activeChapterId === id) { const bc = Utils.$('breadcrumb-ch'); if (bc) bc.textContent = t; }
        AutoSave.schedule();
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => { if (e.key==='Enter'){e.preventDefault();input.blur();} if (e.key==='Escape'){input.value=prev;input.blur();} });
    };

    return { create, render, switchTo, add };
  })();

  /* ─────────────────────────────────────────────────────────
     10. COVER
     ───────────────────────────────────────────────────────── */
  const Cover = (() => {
    const TEMPLATES = [
      { label:'Classic',  bg:'linear-gradient(135deg,#5b73ff,#9b5fe0)' },
      { label:'Noir',     bg:'linear-gradient(160deg,#0d0f1c,#1a1f3a)' },
      { label:'Gold',     bg:'linear-gradient(135deg,#f5a623,#ff5fa0)' },
      { label:'Ocean',    bg:'linear-gradient(135deg,#3ecfcf,#1fa882)' },
      { label:'Crimson',  bg:'linear-gradient(135deg,#ff5fa0,#9b5fe0)' },
      { label:'Forest',   bg:'linear-gradient(135deg,#1fa882,#3ecfcf)' },
    ];

    const updatePreview = () => {
      const title  = Utils.$('ebook-title-input').value || 'Your Ebook Title';
      const author = Utils.$('author-input').value || 'Author Name';
      Utils.$('cover-title-display').textContent  = title;
      Utils.$('cover-author-display').textContent = author;
      // apply template bg if no image
      if (!State.get().coverImageURL) {
        const idx = State.get().coverTemplate;
        Utils.$('cover-box').style.background = TEMPLATES[idx]?.bg || '';
      }
    };

    const _buildTemplates = () => {
      const wrap = Utils.$('cover-templates');
      if (!wrap) return;
      TEMPLATES.forEach((t, i) => {
        const el = document.createElement('div');
        el.className = `cover-template${i === State.get().coverTemplate ? ' active':''}`;
        el.style.background = t.bg;
        el.innerHTML = `<div class="ct-label">${t.label}</div>`;
        el.addEventListener('click', () => {
          State.set({ coverTemplate: i });
          Utils.$all('.cover-template').forEach((c, ci) => c.classList.toggle('active', ci===i));
          const imgEl = Utils.$('cover-bg-img');
          if (!imgEl.src || imgEl.style.display === 'none') {
            Utils.$('cover-box').style.background = t.bg;
          }
          AutoSave.schedule();
          Toast.show(`Template "${t.label}" applied`, 'success');
        });
        wrap.appendChild(el);
      });
    };

    const _onFile = e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { Toast.show('Please select a valid image', 'error'); return; }
      const url = URL.createObjectURL(file);
      const img = Utils.$('cover-bg-img');
      img.src = url; img.style.display = 'block';
      Utils.$('cover-box').style.background = '';
      State.set({ coverImageURL: url });
      Toast.show('Cover uploaded!', 'success');
    };

    const removeCover = () => {
      const img = Utils.$('cover-bg-img'); img.style.display='none'; img.src='';
      Utils.$('cover-file-input').value='';
      State.set({ coverImageURL: null });
      updatePreview();
      Toast.show('Cover removed', 'info');
    };

    const init = () => {
      _buildTemplates();
      Utils.$('cover-file-input').addEventListener('change', _onFile);
      Utils.$('btn-remove-cover').addEventListener('click', removeCover);
      TiltEffect.bind(Utils.$('cover-box'));
    };

    return { updatePreview, init };
  })();

  /* ─────────────────────────────────────────────────────────
     11. TOC
     ───────────────────────────────────────────────────────── */
  const TOC = (() => {
    const render = () => {
      const list = Utils.$('toc-list');
      const entries = State.get().tocEntries;
      if (!entries.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div>No entries yet.</div></div>`;
        return;
      }
      const frag = document.createDocumentFragment();
      entries.forEach((e, i) => frag.appendChild(_item(e, i)));
      list.innerHTML = ''; list.appendChild(frag);
    };

    const _item = (text, idx) => {
      const el = document.createElement('div');
      el.className = 'toc-item';
      el.innerHTML = `<div class="toc-dot"></div><div contenteditable="true" class="toc-text" spellcheck="false">${Utils.escapeHtml(text)}</div><button class="toc-remove">✕</button>`;
      el.querySelector('.toc-text').addEventListener('input', e => { State.get().tocEntries[idx]=e.target.textContent.trim(); AutoSave.schedule(); });
      el.querySelector('.toc-remove').addEventListener('click', () => { State.get().tocEntries.splice(idx,1); render(); AutoSave.schedule(); });
      return el;
    };

    const addEntry = () => {
      State.get().tocEntries.push('New Entry'); render(); AutoSave.schedule();
      setTimeout(() => {
        const items = Utils.$all('#toc-list .toc-text');
        if (items.length) { const last=items[items.length-1]; last.focus(); document.execCommand('selectAll'); }
      }, 50);
    };

    const sync = () => {
      State.get().tocEntries = State.get().chapters.map(c => c.title);
      render(); AutoSave.schedule();
      Toast.show('TOC synced!', 'success');
    };

    const init = () => {
      Utils.$('btn-add-toc').addEventListener('click', addEntry);
      Utils.$('btn-sync-toc').addEventListener('click', sync);
    };

    return { render, init };
  })();

  /* ─────────────────────────────────────────────────────────
     12. AI ASSISTANT
     ───────────────────────────────────────────────────────── */
  const AI = (() => {
    let _last = '';

    const RESPONSES = {
      continue: [
        `The silence between them stretched like a wire pulled too tight — every second another millimetre toward breaking. She checked the clock. 11:47. Hours had dissolved without a single meaningful word exchanged.\n\nOutside, the city offered its usual indifferent hum. Traffic. Someone's music bleeding through a window. The world continuing without permission.`,
        `He had always believed discipline was the architecture of every worthwhile thing. Passion drew the blueprints — but discipline laid each stone, checked every line, ensured nothing leaned or cracked under the pressure of real use.\n\nIt was only now, standing inside what he had built, that he understood what had been missing from that equation.`,
      ],
      improve: [
        `Here are three high-impact improvements for your writing:\n\n① Cut passive voice — every "was done by" weakens your authority. Rewrite with active agents.\n② Vary sentence length intentionally. After two long sentences, a short one strikes hard.\n③ Replace abstract nouns with concrete images. "Difficulty" becomes "three sleepless nights." Specificity creates trust.`,
      ],
      rewrite: [
        `Rewritten with authority and clarity:\n\nThe months preceding this confrontation had been a slow accumulation — each deferred conversation a stone added to an already unstable foundation. No single moment had been decisive. Yet here they stood, at the edge of something that could no longer be managed, only witnessed.`,
      ],
      expand: [
        `Expanding this passage with depth and texture:\n\nThe room had its own grammar — a language written in the angle of afternoon light across worn floorboards, in the silence that fell between sentences and refused to fill with anything comfortable. She had learned to read it. Three years of learning to read it. And today it said something she had not yet allowed herself to name.\n\nShe crossed to the window. Below, the ordinary world continued its errands, its coffee runs, its oblivious forward motion. None of it knew what she now knew.`,
      ],
      simplify: [
        `Simplified version:\n\nThis is the main idea: every decision you make today shapes what tomorrow looks like. Small choices matter. The ones that seem insignificant rarely are.\n\nHere is what to do: start with one thing. Not ten. Not five. One. Do it fully. Do it right. Then move to the next.`,
      ],
      emotional: [
        `With emotional depth:\n\nShe did not expect to cry. That was the honest truth of it — she had walked into this room armored, prepared for the argument, ready with her catalogue of grievances. She had not prepared for kindness. She had not prepared for him to simply say: I know. I see it. I'm sorry.\n\nAnd there it was. Three sentences. Twenty years of ache, met and acknowledged in twenty-one words.`,
      ],
      ideas: [
        `Chapter Ideas for Your Ebook:\n\n① The Turning Point — One decision that redirected everything\n② The System Behind the Success — What actually drives results\n③ What I Wish I Knew Earlier — Hard-won lessons condensed\n④ The Counterintuitive Truth — The thing most people get wrong\n⑤ Letters to My Past Self — Wisdom written backward from experience\n⑥ The Resistance — Why people don't start, and how to overcome it\n⑦ What Remains — After all the change, what stays constant`,
      ],
      intro: [
        `Every book begins as a question the author could not stop asking.\n\nThis one started on a rain-heavy afternoon, with a thought that refused to be filed away: What if the thing I had optimised my entire life around was the wrong variable entirely?\n\nWhat followed was three years of difficult conversations, quiet experiments, and the slow uncomfortable work of unbuilding what I once called certainty. The book I intended to write does not exist. What you are holding is something more honest — and I hope, more useful.`,
      ],
      conclusion: [
        `The journey through these pages was never about arriving somewhere. It was about learning to read the terrain — to see the signal in the noise, to recognise your patterns before they repeat at greater cost.\n\nYou now hold a framework. Use it imperfectly. Revise it constantly. The version that survives contact with your actual life is worth infinitely more than the pristine one on the shelf.\n\nBegin. The world is patient. Your story is not.`,
      ],
      description: [
        `Ebook Description:\n\nIn a world saturated with information but starved for wisdom, this book cuts through the noise. Part memoir, part manual — it's the guide the author wished existed when they needed it most.\n\nInside, you'll find a battle-tested framework for making decisions under uncertainty, built from years of real-world application. No theory without practice. No advice without context.\n\nFor the thinker who is tired of shallow answers to deep questions.`,
      ],
      marketing: [
        `Marketing Copy:\n\n🔥 "The book that finally made everything click." — Early reader\n\nYou've been doing the work. You're not lazy. You're not undisciplined. You just haven't had the right map.\n\nThis ebook is the map.\n\n→ Understand why your current approach keeps stalling\n→ Build a system that compounds over time\n→ Stop starting over — start building\n\nOver 10,000 readers transformed their approach. You're next.`,
      ],
      cta: [
        `Call-to-Action Options:\n\n① "Get your copy now and start building the life you've been designing in your head."\n② "This knowledge took 5 years to earn. It costs you 2 hours to learn. Get it today."\n③ "Don't let another year pass with the same results. Your breakthrough is one decision away."\n④ "Limited offer: get the full ebook + bonus chapter for the next 48 hours."\n⑤ "If you're serious about change, the investment pays for itself in week one."`,
      ],
    };

    const PROMPTS = {
      continue:   'Continue the writing naturally from where I left off…',
      improve:    'Improve the quality, clarity, and flow of my writing…',
      rewrite:    'Rewrite this passage with professional, authoritative tone…',
      expand:     'Expand this section with more depth and detail…',
      simplify:   'Simplify this text for a wider audience…',
      emotional:  'Rewrite this with more emotional resonance and depth…',
      ideas:      'Generate compelling chapter ideas and narrative angles…',
      intro:      'Write a powerful, engaging introduction for my ebook…',
      conclusion: 'Write a memorable conclusion that resonates with readers…',
      description:'Write a compelling ebook description for marketing…',
      marketing:  'Write persuasive marketing copy for my ebook…',
      cta:        'Write a powerful call-to-action for my ebook sales page…',
    };

    const _stream = text => {
      const box = Utils.$('ai-response-box');
      const words = text.split(' ');
      let out = '', i = 0;
      box.innerHTML = '';
      const iv = setInterval(() => {
        if (i >= words.length) {
          clearInterval(iv);
          Utils.$('btn-ai-generate').disabled = false;
          Utils.$('btn-ai-insert').style.display = 'flex';
          return;
        }
        out += (i > 0 ? ' ' : '') + words[i];
        box.innerHTML = out.replace(/\n/g, '<br>');
        i++;
      }, 35);
    };

    const generate = async () => {
      const btn  = Utils.$('btn-ai-generate');
      const box  = Utils.$('ai-response-box');
      const chip = Utils.$q('.ai-chip.active-chip');
      const action = chip?.dataset.action ?? 'continue';
      box.classList.add('visible');
      box.innerHTML = `<div class="ai-thinking"><div class="ai-dots"><span></span><span></span><span></span></div>&nbsp; AI is writing…</div>`;
      Utils.$('btn-ai-insert').style.display = 'none';
      btn.disabled = true;
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      const pool = RESPONSES[action] ?? RESPONSES.continue;
      const content = pool[Math.floor(Math.random() * pool.length)];
      _last = content;
      _stream(content);
    };

    const insert = () => {
      if (!_last) { Toast.show('Generate content first', 'info'); return; }
      if (!State.get().activeChapterId) { Toast.show('Select a chapter first', 'error'); return; }
      Editor.insertAtCursor(_last);
      Toast.show('Inserted into editor!', 'success');
      Editor.syncNow(); AutoSave.schedule();
    };

    const init = () => {
      Utils.$all('.ai-chip').forEach(c => c.addEventListener('click', () => {
        Utils.$all('.ai-chip').forEach(x => x.classList.remove('active-chip'));
        c.classList.add('active-chip');
        const p = Utils.$('ai-prompt');
        p.value = PROMPTS[c.dataset.action] ?? ''; p.focus();
      }));
      Utils.$all('.ai-tone').forEach(t => t.addEventListener('click', () => {
        Utils.$all('.ai-tone').forEach(x => x.classList.remove('active-tone'));
        t.classList.add('active-tone');
        State.set({ activeTone: t.dataset.tone });
      }));
      Utils.$('btn-ai-generate').addEventListener('click', generate);
      Utils.$('btn-ai-insert').addEventListener('click', insert);
    };

    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     13. STATS
     ───────────────────────────────────────────────────────── */
  const Stats = (() => {
    const set = (id, v) => { const e=Utils.$(id); if(e) e.textContent=v; };

    const update = () => {
      const { chapters } = State.get();
      const w = chapters.reduce((s,c) => s+(c.words||0), 0);
      const pages = Math.max(1, Math.round(w/250));
      set('stat-words',    w >= 1000 ? `${(w/1000).toFixed(1)}k` : w.toString());
      set('stat-chapters', chapters.length.toString());
      set('stat-pages',    pages.toString());
      set('stat-reading',  Utils.formatReadTime(w/200));
      const pct = Math.min(100, Math.round((w/50000)*100));
      set('prog-pct', `${pct}%`);
      const fill = Utils.$('prog-fill'); if (fill) fill.style.width = `${pct}%`;
      set('stat-storage', Utils.formatBytes(Storage.size()));
    };

    const updateLive = () => {
      const { chapters, activeChapterId } = State.get();
      const ch = chapters.find(c => c.id === activeChapterId);
      set('live-word-count', (ch ? Utils.countWords(Editor.getContent()) : 0).toLocaleString());
    };

    return { update, updateLive };
  })();

  /* ─────────────────────────────────────────────────────────
     14. READING PROGRESS
     ───────────────────────────────────────────────────────── */
  const ReadingProgress = (() => {
    const update = () => {
      const scroll = Utils.$('editor-scroll');
      const fill   = Utils.$('reading-progress-fill');
      if (!scroll || !fill) return;
      const h = scroll.scrollHeight - scroll.clientHeight;
      fill.style.width = h > 0 ? `${(scroll.scrollTop/h)*100}%` : '0%';
    };
    const init = () => {
      Utils.$('editor-scroll')?.addEventListener('scroll', update);
    };
    return { update, init };
  })();

  /* ─────────────────────────────────────────────────────────
     15. EXPORT — jsPDF
     ───────────────────────────────────────────────────────── */
  const Export = (() => {
    const PW=210, PH=297, ML=20, MR=20, MT=22, MB=22, CW=170;

    const _toB64 = src => new Promise(res => {
      if (!src) { res(null); return; }
      const img = new Image(); img.crossOrigin='anonymous';
      img.onload = () => { try { const c=document.createElement('canvas'); c.width=img.naturalWidth||800; c.height=img.naturalHeight||1200; c.getContext('2d').drawImage(img,0,0); res(c.toDataURL('image/jpeg',0.95)); } catch { res(null); } };
      img.onerror = () => res(null); img.src = src;
    });

    const _blocks = html => {
      if (!html) return [];
      const d=document.createElement('div'); d.innerHTML=html;
      const out=[];
      const walk = n => {
        const tag=n.tagName?.toLowerCase();
        const txt=(n.textContent||'').replace(/\s+/g,' ').trim();
        if (!txt) return;
        if (tag==='h1') { out.push({type:'h1',text:txt}); return; }
        if (tag==='h2') { out.push({type:'h2',text:txt}); return; }
        if (tag==='h3') { out.push({type:'h3',text:txt}); return; }
        if (tag==='blockquote') { out.push({type:'quote',text:txt}); return; }
        if (tag==='li') { out.push({type:'li',text:txt}); return; }
        if (tag==='p') { out.push({type:'p',text:txt}); return; }
        if (n.children?.length) Array.from(n.children).forEach(walk);
        else if (txt) out.push({type:'p',text:txt});
      };
      Array.from(d.children).forEach(walk);
      return out.filter(b=>b.text.length>0);
    };

    const _w = (doc,text,max) => doc.splitTextToSize(text,max);
    const _pb = (doc,y,need=10) => { if (y+need>PH-MB){doc.addPage();return MT;} return y; };
    const _rule = (doc,y,rgb=[220,222,240]) => { doc.setDrawColor(...rgb); doc.setLineWidth(0.2); doc.line(ML,y,PW-MR,y); };
    const _footer = (doc,n,wm) => {
      if (wm && !State.get().watermarkRemoved) { doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(180,185,210); doc.text('CREATED WITH PEEYASHBOOKS  ·  PEEYASHBOOKS.COM',PW/2,PH-10,{align:'center',charSpace:1}); }
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(180,185,210); doc.text(String(n),PW-MR,PH-10,{align:'right'});
    };

    const _cover = (doc,title,author,b64) => {
      if (b64) { doc.addImage(b64,'JPEG',-1,-1,PW+2,PH+2); return; }
      doc.setFillColor(13,16,48); doc.rect(0,0,PW,PH,'F');
      doc.setFillColor(30,40,100); doc.ellipse(PW/2,PH*.42,70,55,'F');
      doc.setFillColor(91,115,255); doc.rect(0,0,PW,5,'F');
      doc.setFillColor(155,95,224); doc.rect(0,PH-5,PW,5,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(91,115,255);
      doc.text('P E E Y A S H B O O K S',PW/2,PH*.34,{align:'center',charSpace:2});
      doc.setFont('helvetica','bold'); doc.setFontSize(32); doc.setTextColor(200,212,255);
      let ty=PH*.42; _w(doc,title,PW-50).forEach(l=>{doc.text(l,PW/2,ty,{align:'center'});ty+=12;});
      doc.setDrawColor(91,115,255); doc.setLineWidth(0.8); doc.line(PW/2-22,ty+3,PW/2+22,ty+3);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(123,147,170);
      doc.text(`B Y   ${author.toUpperCase()}`,PW/2,ty+12,{align:'center',charSpace:1});
      doc.setFontSize(7); doc.setTextColor(42,48,96); doc.text('peeyashbooks.com',PW/2,PH-14,{align:'center'});
    };

    const _toc = (doc,entries,n,wm) => {
      doc.addPage(); let y=MT;
      doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(30,32,112);
      doc.text('Table of Contents',ML,y); y+=6; _rule(doc,y,[180,185,240]); y+=10;
      entries.forEach((e,i) => {
        y=_pb(doc,y,10);
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(91,115,255); doc.text(`${i+1}.`,ML,y);
        doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(30,30,58);
        const lines=_w(doc,e,CW-12);
        lines.forEach((l,li)=>{if(li>0)y=_pb(doc,y,7);doc.text(l,ML+10,y);if(li<lines.length-1)y+=6;}); y+=8;
        doc.setDrawColor(238,238,248); doc.setLineWidth(0.2); doc.line(ML,y-3,PW-MR,y-3);
      });
      _footer(doc,n,wm);
    };

    const _chapter = (doc,ch,idx,n,wm) => {
      doc.addPage(); let y=MT;
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(155,95,224);
      doc.text(`C H A P T E R  ${idx+1}`,ML,y,{charSpace:1}); y+=7;
      doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(30,32,112);
      _w(doc,ch.title,CW).forEach(l=>{y=_pb(doc,y,12);doc.text(l,ML,y);y+=9;}); y+=2;
      _rule(doc,y,[232,234,248]); y+=10;
      const blocks=_blocks(ch.content);
      if (!blocks.length){doc.setFont('helvetica','italic');doc.setFontSize(11);doc.setTextColor(160,160,180);doc.text('No content written yet.',ML,y);_footer(doc,n,wm);return;}
      blocks.forEach(b=>{
        switch(b.type){
          case 'h1':{y=_pb(doc,y,16);y+=4;doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(30,32,112);_w(doc,b.text,CW).forEach(l=>{doc.text(l,ML,y);y+=8;});y+=2;break;}
          case 'h2':{y=_pb(doc,y,14);y+=3;doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(30,32,112);_w(doc,b.text,CW).forEach(l=>{doc.text(l,ML,y);y+=7;});y+=2;break;}
          case 'h3':{y=_pb(doc,y,12);y+=2;doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,32,112);_w(doc,b.text,CW).forEach(l=>{doc.text(l,ML,y);y+=6;});y+=1;break;}
          case 'quote':{y=_pb(doc,y,14);y+=3;doc.setFillColor(155,95,224);doc.rect(ML,y-4,1.5,9,'F');doc.setFont('helvetica','italic');doc.setFontSize(11);doc.setTextColor(90,90,120);_w(doc,b.text,CW-8).forEach(l=>{doc.text(l,ML+6,y);y+=6;});y+=3;break;}
          case 'li':{y=_pb(doc,y,8);doc.setFont('helvetica','normal');doc.setFontSize(11.5);doc.setTextColor(30,30,50);doc.setFillColor(91,115,255);doc.circle(ML+2,y-1.5,.9,'F');_w(doc,b.text,CW-8).forEach((l,li)=>{if(li>0)y=_pb(doc,y,7);doc.text(l,ML+7,y);y+=6;});y+=1;break;}
          default:{y=_pb(doc,y,8);doc.setFont('helvetica','normal');doc.setFontSize(11.5);doc.setTextColor(30,30,50);_w(doc,b.text,CW).forEach(l=>{y=_pb(doc,y,7);doc.text(l,ML,y);y+=6.5;});y+=3;break;}
        }
      });
      _footer(doc,n,wm);
    };

    const run = async () => {
      Modal.close('modal-export'); Editor.syncNow();
      const btn=Utils.$('btn-do-export'), orig=btn.innerHTML;
      btn.innerHTML='<span>Building PDF…</span>'; btn.disabled=true;
      Toast.show('Building your PDF…','info');
      const title=Utils.$('ebook-title-input').value.trim()||'My Ebook';
      const author=Utils.$('author-input').value.trim()||'Unknown Author';
      const iCover=Utils.$('opt-cover').checked, iTOC=Utils.$('opt-toc').checked, iWM=Utils.$('opt-watermark').checked;
      const { chapters, tocEntries, coverImageURL }=State.get();
      if (!chapters.length){Toast.show('Add at least one chapter before exporting','error');btn.innerHTML=orig;btn.disabled=false;return;}
      const safeFile=title.replace(/\s+/g,'-').replace(/[^a-z0-9\-_]/gi,'').slice(0,60)||'ebook';
      try {
        let b64=null;
        if (iCover && coverImageURL){Toast.show('Processing cover…','info');b64=await _toB64(coverImageURL);if(!b64)Toast.show('Cover failed — using styled cover','warning');}
        const JPDF=(window.jspdf?.jsPDF)||window.jsPDF;
        if (!JPDF) throw new Error('jsPDF not loaded');
        const doc=new JPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
        let pn=1;
        if (iCover){_cover(doc,title,author,b64);pn++;}
        if (iTOC && tocEntries.length){_toc(doc,tocEntries,pn,iWM);pn++;}
        chapters.forEach((ch,i)=>{_chapter(doc,ch,i,pn,iWM);pn++;});
        doc.save(`${safeFile}.pdf`);
        Toast.show('PDF exported successfully! 🎉','success');
      } catch(err){console.error(err);Toast.show(`Export failed: ${err.message}`,'error');}
      finally {btn.innerHTML=orig;btn.disabled=false;}
    };

    const init = () => {
      Utils.$('btn-export').addEventListener('click', () => Modal.open('modal-export'));
      Utils.$('btn-do-export').addEventListener('click', () => Payment.initiate('export', run));
    };

    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     16. PREVIEW
     ───────────────────────────────────────────────────────── */
  const Preview = (() => {
    const _syncBook = (frontId, spineId, titleId, authorId) => {
      const title  = Utils.$('ebook-title-input').value.trim() || 'My Ebook';
      const author = Utils.$('author-input').value.trim()      || 'Author Name';
      const { coverImageURL } = State.get();

      const front = Utils.$(frontId);
      if (front) {
        if (coverImageURL) {
          front.style.backgroundImage = `url('${coverImageURL}')`;
          front.style.backgroundSize = 'cover';
          front.style.backgroundPosition = 'center';
          const t=Utils.$(titleId); if(t) t.textContent='';
          const a=Utils.$(authorId); if(a) a.textContent='';
        } else {
          front.style.backgroundImage = '';
          // pick template gradient
          const GRADS = ['linear-gradient(135deg,#5b73ff,#9b5fe0)','linear-gradient(160deg,#0d0f1c,#1a1f3a)','linear-gradient(135deg,#f5a623,#ff5fa0)','linear-gradient(135deg,#3ecfcf,#1fa882)','linear-gradient(135deg,#ff5fa0,#9b5fe0)','linear-gradient(135deg,#1fa882,#3ecfcf)'];
          front.style.background = GRADS[State.get().coverTemplate] || GRADS[0];
          const t=Utils.$(titleId); if(t) t.textContent=title;
          const a=Utils.$(authorId); if(a) a.textContent=author;
        }
      }
      const sp = Utils.$(spineId); if (sp) sp.textContent = title;
    };

    const _html = () => {
      Editor.syncNow();
      const title  = Utils.$('ebook-title-input').value.trim() || 'My Ebook';
      const author = Utils.$('author-input').value.trim()      || 'Unknown Author';
      const { chapters, tocEntries, coverImageURL, watermarkRemoved } = State.get();
      let body = '';
      const coverStyle = coverImageURL ? `style="background-image:url('${coverImageURL}');background-size:cover;background-position:center"` : '';
      body += `<div class="prev-cover" ${coverStyle}><div class="prev-cover-overlay"></div><div class="prev-cover-inner"><div class="prev-badge">PeeyashBooks</div><h1 class="prev-title">${Utils.escapeHtml(title)}</h1><div class="prev-line"></div><p class="prev-author">By ${Utils.escapeHtml(author)}</p></div></div>`;
      if (tocEntries.length) {
        body += `<div class="prev-section"><div class="prev-section-title">Table of Contents</div>`;
        tocEntries.forEach((e,i) => body += `<div class="prev-toc-row"><span class="prev-toc-num">${i+1}</span><span>${Utils.escapeHtml(e)}</span></div>`);
        body += `</div>`;
      }
      chapters.forEach((ch,idx) => {
        body += `<div class="prev-section"><div class="prev-ch-label">Chapter ${idx+1}</div><div class="prev-ch-title">${Utils.escapeHtml(ch.title)}</div><div class="prev-ch-body">${ch.content||'<p style="color:#666;font-style:italic">No content yet.</p>'}</div></div>`;
      });
      if (!watermarkRemoved) body += `<div class="prev-watermark">Created with PeeyashBooks</div>`;
      return body;
    };

    const open = () => {
      _syncBook('preview-book-front','preview-spine-title','preview-book-title','preview-book-author');
      const c = Utils.$('preview-body'); if (c) c.innerHTML = _html();
      Modal.open('modal-preview');
      setTimeout(() => { const b=Utils.$('preview-3d-book'); if(b) b.classList.add('book-loaded'); }, 150);
    };

    const init = () => {
      Utils.$('btn-preview').addEventListener('click', open);
      Utils.$('btn-preview-before-export')?.addEventListener('click', () => { Modal.close('modal-export'); setTimeout(open,200); });
      Utils.$('btn-preview-to-export')?.addEventListener('click', () => { Modal.close('modal-preview'); setTimeout(()=>Modal.open('modal-export'),200); });
    };

    return { open, syncBook: _syncBook, init };
  })();

  /* ─────────────────────────────────────────────────────────
     17. PUBLISHER
     ───────────────────────────────────────────────────────── */
  const Publisher = (() => {
    const _page = ({title, author, bodyContent, watermarkRemoved}) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${Utils.escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@400;500&family=Cinzel:wght@400;600&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#07080f;--text:#e0e4ff;--muted:#7880b0;--blue:#5b73ff;--purple:#9b5fe0}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;line-height:1.6}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(91,115,255,0.3);border-radius:99px}
.pb-cover{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 80% 70% at 50% 40%,rgba(91,115,255,0.16) 0%,transparent 70%),linear-gradient(160deg,#07080f,#0f1128);text-align:center;padding:80px 24px;position:relative}
.pb-cover::after{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to bottom,transparent,var(--bg))}
.pb-cover-inner{position:relative;z-index:1;max-width:680px}
.pb-cover h1{font-family:'Cinzel',serif;font-size:clamp(2.2rem,6vw,4rem);background:linear-gradient(135deg,#6e88ff,#c780ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.15;margin-bottom:24px}
.pb-cover-line{width:56px;height:2px;background:linear-gradient(90deg,var(--blue),var(--purple));margin:0 auto 20px;border-radius:99px}
.pb-cover p{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)}
.pb-toc{max-width:680px;margin:0 auto;padding:72px 24px 0}
.pb-toc h2{font-family:'Cinzel',serif;font-size:1.4rem;color:var(--blue);margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07)}
.pb-toc-entry{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:15px;color:var(--muted)}
.pb-toc-num{font-family:'Cinzel',serif;color:var(--blue);font-size:11px;min-width:28px;flex-shrink:0}
.pb-toc-entry a{color:inherit;text-decoration:none;flex:1}.pb-toc-entry a:hover{color:var(--text)}
.pb-chapter{max-width:720px;margin:0 auto;padding:80px 24px}.pb-chapter+.pb-chapter{padding-top:60px}
.pb-ch-meta{font-family:'Cinzel',serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--purple);margin-bottom:12px}
.pb-chapter h2{font-family:'Cinzel',serif;font-size:clamp(1.6rem,4vw,2.2rem);background:linear-gradient(135deg,var(--blue),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2;margin-bottom:36px;padding-bottom:18px;border-bottom:1px solid rgba(91,115,255,0.18)}
.pb-ch-content{font-family:'Cormorant Garamond',serif;font-size:20px;line-height:1.92;color:#c4caef}
.pb-ch-content p{margin-bottom:1.4em}
.pb-ch-content h1,.pb-ch-content h2,.pb-ch-content h3{font-family:'Cinzel',serif;color:#7b8fff;margin:1.6em 0 0.6em;-webkit-text-fill-color:initial}
.pb-ch-content blockquote{border-left:2px solid var(--purple);padding-left:20px;color:var(--muted);font-style:italic;margin:1.5em 0}
.pb-footer{text-align:center;padding:60px 24px 40px;font-size:11px;color:rgba(255,255,255,0.15);letter-spacing:2px;text-transform:uppercase}
.pb-footer strong{color:rgba(91,115,255,0.4)}
</style></head><body>
${bodyContent}
${!watermarkRemoved?'<div class="pb-footer">Created with <strong>PeeyashBooks</strong> &nbsp;·&nbsp; peeyashbooks.com</div>':''}
</body></html>`;

    const _body = (title, author) => {
      const { chapters, tocEntries } = State.get();
      let b = `<div class="pb-cover"><div class="pb-cover-inner"><h1>${Utils.escapeHtml(title)}</h1><div class="pb-cover-line"></div><p>By ${Utils.escapeHtml(author)}</p></div></div>`;
      if (tocEntries.length) {
        b += `<div class="pb-toc"><h2>Table of Contents</h2>`;
        tocEntries.forEach((e,i) => b += `<div class="pb-toc-entry"><span class="pb-toc-num">${i+1}.</span><a href="#ch-${i+1}">${Utils.escapeHtml(e)}</a></div>`);
        b += `</div>`;
      }
      chapters.forEach((ch,i) => b += `<div class="pb-chapter" id="ch-${i+1}"><div class="pb-ch-meta">Chapter ${i+1}</div><h2>${Utils.escapeHtml(ch.title)}</h2><div class="pb-ch-content">${ch.content||'<p>No content yet.</p>'}</div></div>`);
      return b;
    };

    const _store = (slug, title, author) => {
      const html = _page({ title, author, bodyContent: _body(title, author), watermarkRemoved: State.get().watermarkRemoved });
      try { localStorage.setItem(`pb_pub_${slug}`, html); } catch(e) { Toast.show('Storage full','error'); return false; }
      State.set({ publishedSlug: slug }); AutoSave.schedule();
      const url = `${location.origin}${location.pathname}?read=${slug}`;
      Utils.$('publish-link-box').textContent = url;
      Utils.$('publish-link-box').classList.add('visible');
      Utils.$('publish-action-row').style.display = 'flex';
      return true;
    };

    const publishFree = () => {
      Editor.syncNow();
      const title  = Utils.$('ebook-title-input').value.trim() || 'My Ebook';
      const author = Utils.$('author-input').value.trim() || 'Unknown Author';
      if (!State.get().chapters.length) { Toast.show('Add at least one chapter first','error'); return; }
      const slug = `pb-${Utils.uid()}-${Utils.uid()}`;
      if (_store(slug, title, author)) Toast.show('Ebook published! 🎉','success');
    };

    const publishCustom = () => {
      Editor.syncNow();
      const title  = Utils.$('ebook-title-input').value.trim() || 'My Ebook';
      const author = Utils.$('author-input').value.trim() || 'Unknown Author';
      if (!State.get().chapters.length) { Toast.show('Add at least one chapter first','error'); return; }
      Payment.initiate('publish', () => {
        const raw    = Utils.$('custom-slug-input')?.value?.trim() || '';
        const custom = raw.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,40);
        const slug   = custom ? `pb-${custom}-${Utils.uid()}` : `pb-${title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,30)}-${Utils.uid()}`;
        if (_store(slug, title, author)) Toast.show('Custom link published! 🎉','success');
      });
    };

    const copyLink = () => {
      const slug = State.get().publishedSlug; if (!slug) return;
      const url = `${location.origin}${location.pathname}?read=${slug}`;
      navigator.clipboard.writeText(url).then(() => Toast.show('Link copied!','success')).catch(() => Toast.show('Copy failed','error'));
    };

    const openReader = () => {
      const slug = State.get().publishedSlug; if (!slug) return;
      const html = localStorage.getItem(`pb_pub_${slug}`);
      if (!html) { Toast.show('Content not found','error'); return; }
      const tab = window.open('','_blank');
      if (!tab) { Toast.show('Pop-up blocked','warning'); return; }
      tab.document.write(html); tab.document.close();
    };

    const init = () => {
      Utils.$('btn-publish').addEventListener('click', () => Modal.open('modal-publish'));
      Utils.$('btn-publish-free').addEventListener('click', publishFree);
      Utils.$('btn-publish-custom').addEventListener('click', publishCustom);
      Utils.$('btn-copy-link').addEventListener('click', copyLink);
      Utils.$('btn-open-reader').addEventListener('click', openReader);
    };

    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     18. PAYMENT — Flutterwave
     ───────────────────────────────────────────────────────── */
  const Payment = (() => {
    const PRICES = {
      export:           { amount: 200, description: 'Export Ebook as PDF' },
      publish:          { amount: 100, description: 'Publish with Custom Link' },
      remove_watermark: { amount: 50,  description: 'Remove PeeyashBooks Watermark' },
    };

    const initiate = (type, onSuccess) => {
      const cfg = PRICES[type]; if (!cfg) return;
      if (typeof FlutterwaveCheckout === 'undefined') {
        Toast.show('Loading payment gateway…','info');
        const s = document.createElement('script'); s.src='https://checkout.flutterwave.com/v3.js';
        s.onload = () => _open(type, cfg, onSuccess);
        s.onerror = () => Toast.show('Payment gateway failed to load','error');
        document.head.appendChild(s); return;
      }
      _open(type, cfg, onSuccess);
    };

    const _open = (type, cfg, onSuccess) => {
      FlutterwaveCheckout({
        public_key:      'YOUR_FLUTTERWAVE_PUBLIC_KEY', // ← Replace with your real key
        tx_ref:          `pb-${type}-${Date.now()}`,
        amount:          cfg.amount,
        currency:        'NGN',
        payment_options: 'card,banktransfer,ussd',
        meta: { source:'PeeyashBooks', book_title: Utils.$('ebook-title-input')?.value||'Unknown', action:type },
        customer: { email:'', phonenumber:'', name: Utils.$('author-input')?.value||'PeeyashBooks User' },
        customizations: { title:'PeeyashBooks', description:cfg.description, logo:'https://peeyashbooks.com/logo.png' },
        callback: d => {
          if (d.status==='successful'||d.status==='completed') { Toast.show(`₦${cfg.amount} payment successful! ✓`,'success'); onSuccess(d); }
          else Toast.show('Payment not completed. Try again.','error');
        },
        onclose: () => Toast.show('Payment cancelled.','info'),
      });
    };

    const removeWatermark = () => {
      if (State.get().watermarkRemoved) { Toast.show('Watermark already removed!','info'); return; }
      initiate('remove_watermark', () => {
        State.set({ watermarkRemoved: true }); AutoSave.schedule();
        Toast.show('Watermark removed! ✨','success');
        const btn = Utils.$('btn-remove-watermark');
        if (btn) { btn.textContent='✓ Removed'; btn.disabled=true; btn.style.opacity='0.5'; }
      });
    };

    const init = () => {
      Utils.$('btn-remove-watermark')?.addEventListener('click', removeWatermark);
      if (State.get().watermarkRemoved) {
        const btn = Utils.$('btn-remove-watermark');
        if (btn) { btn.textContent='✓ Removed'; btn.disabled=true; btn.style.opacity='0.5'; }
      }
    };

    return { initiate, init };
  })();

  /* ─────────────────────────────────────────────────────────
     19. SHOWCASE
     ───────────────────────────────────────────────────────── */
  const Showcase = (() => {
    const open = () => {
      Editor.syncNow();
      _renderInfo();
      _renderListings();
      Preview.syncBook('showcase-book-front','showcase-spine-title','showcase-book-title','showcase-book-author');
      Modal.open('modal-showcase');
    };

    const _renderInfo = () => {
      const title  = Utils.$('ebook-title-input').value.trim() || 'Untitled Ebook';
      const author = Utils.$('author-input').value.trim()      || 'Unknown Author';
      const { chapters } = State.get();
      const w = chapters.reduce((s,c) => s+(c.words||0), 0);
      const pages = Math.max(1, Math.round(w/250));

      const panel = Utils.$('showcase-info'); if (!panel) return;
      panel.innerHTML = `
        <h2 class="sc-title">${Utils.escapeHtml(title)}</h2>
        <p class="sc-author">by ${Utils.escapeHtml(author)}</p>
        <div class="sc-meta-row">
          <div class="sc-badge">${chapters.length} Chapter${chapters.length!==1?'s':''}</div>
          <div class="sc-badge">~${pages} Pages</div>
          <div class="sc-badge">${w.toLocaleString()} Words</div>
          <div class="sc-badge">${Utils.formatReadTime(w/200)} Read</div>
        </div>
        <div class="sc-description">
          ${chapters.length>0
            ? `<p>This ebook spans ${chapters.length} chapter${chapters.length!==1?'s':''}. Chapters: <em>${chapters.map(c=>Utils.escapeHtml(c.title)).join(', ')}</em></p>`
            : '<p>No chapters written yet. Start writing to see your book here.</p>'}
        </div>
        <div class="sc-price-row">
          <div class="sc-price-box">
            <div class="sc-price-label">Selling Price</div>
            <div class="sc-price-input-wrap">
              <span class="sc-currency">₦</span>
              <input type="number" id="sc-price-input" class="sc-price-input" placeholder="0" min="0" step="100"/>
            </div>
          </div>
          <div class="sc-price-box">
            <div class="sc-price-label">Category</div>
            <select id="sc-category" class="sc-select">
              <option value="">Select…</option>
              <option>Fiction</option><option>Non-Fiction</option>
              <option>Business &amp; Finance</option><option>Self-Help</option>
              <option>Education</option><option>Health &amp; Wellness</option>
              <option>Technology</option><option>Biography</option>
              <option>Romance</option><option>Thriller &amp; Mystery</option>
              <option>Religion &amp; Spirituality</option><option>Poetry</option>
              <option>Children's Books</option><option>Other</option>
            </select>
          </div>
        </div>
        <div class="sc-actions">
          <button class="btn btn-primary" id="btn-list-marketplace">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
            List on Marketplace
          </button>
          <button class="btn btn-ghost" id="btn-preview-showcase">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
        </div>
        <div id="sc-list-result"></div>`;

      Utils.$('btn-list-marketplace')?.addEventListener('click', _list);
      Utils.$('btn-preview-showcase')?.addEventListener('click', () => { Modal.close('modal-showcase'); setTimeout(()=>Preview.open(),200); });
    };

    const _list = () => {
      const title    = Utils.$('ebook-title-input').value.trim() || 'Untitled Ebook';
      const author   = Utils.$('author-input').value.trim()      || 'Unknown Author';
      const price    = parseFloat(Utils.$('sc-price-input')?.value||0);
      const category = Utils.$('sc-category')?.value || 'Other';
      if (!State.get().chapters.length) { Toast.show('Write at least one chapter first','error'); return; }
      const listing = { id:Utils.uid(), title, author, price, category, words:State.get().chapters.reduce((s,c)=>s+(c.words||0),0), chapters:State.get().chapters.length, slug:State.get().publishedSlug, coverURL:State.get().coverImageURL, listedAt:new Date().toISOString() };
      const listings = State.get().showcaseListings;
      const ei = listings.findIndex(l => l.title===title && l.author===author);
      if (ei >= 0) listings.splice(ei, 1);
      listings.push(listing);
      State.set({ showcaseListings: listings }); AutoSave.schedule();
      const res = Utils.$('sc-list-result');
      if (res) res.innerHTML = `<div class="sc-success-banner"><span>🎉</span><div><strong>"${Utils.escapeHtml(title)}"</strong> listed${price>0?` for ₦${price.toLocaleString()}`:' (Free)'}!</div></div>`;
      _renderListings();
      Toast.show('Listed on marketplace! 🚀','success');
    };

    const _renderListings = () => {
      const container = Utils.$('sc-listings-grid'); if (!container) return;
      const listings = State.get().showcaseListings;
      if (!listings.length) { container.innerHTML=`<div class="sc-empty">No books listed yet.</div>`; return; }
      container.innerHTML = listings.map(l=>`
        <div class="sc-listing-card">
          <div class="sc-listing-cover" ${l.coverURL?`style="background-image:url('${l.coverURL}');background-size:cover;background-position:center"`:''}>${!l.coverURL?`<div class="sc-listing-cover-title">${Utils.escapeHtml(l.title)}</div>`:''}</div>
          <div class="sc-listing-info">
            <div class="sc-listing-title">${Utils.escapeHtml(l.title)}</div>
            <div class="sc-listing-author">by ${Utils.escapeHtml(l.author)}</div>
            <div class="sc-listing-meta">${l.chapters} ch · ${(l.words||0).toLocaleString()} words</div>
            <div class="sc-listing-price">${l.price>0?`₦${l.price.toLocaleString()}`:'Free'}</div>
            <div class="sc-listing-category">${Utils.escapeHtml(l.category)}</div>
          </div>
        </div>`).join('');
    };

    const init = () => { Utils.$('btn-showcase')?.addEventListener('click', open); };
    return { open, init };
  })();

  /* ─────────────────────────────────────────────────────────
     20. TILT EFFECT
     ───────────────────────────────────────────────────────── */
  const TiltEffect = (() => {
    const bind = el => {
      if (!el) return;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width  - 0.5;
        const y = (e.clientY-r.top) /r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.02)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform=''; });
    };
    const initAll = () => Utils.$all('.tilt-card').forEach(bind);
    return { bind, initAll };
  })();

  /* ─────────────────────────────────────────────────────────
     21. MAGNETIC BUTTONS
     ───────────────────────────────────────────────────────── */
  const Magnetic = (() => {
    const init = () => {
      Utils.$all('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width/2) * 0.3;
          const dy = (e.clientY - r.top  - r.height/2) * 0.3;
          btn.style.transform = `translate(${dx}px,${dy}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform=''; });
      });
    };
    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     22. FOCUS MODE
     ───────────────────────────────────────────────────────── */
  const FocusMode = (() => {
    let _on = false;
    const toggle = () => {
      _on = !_on;
      document.body.classList.toggle('focus-mode', _on);
      const btn = Utils.$('btn-focus-mode');
      if (btn) btn.style.color = _on ? 'var(--cyan)' : '';
      Toast.show(_on ? 'Focus mode on — press F to exit' : 'Focus mode off', 'info');
    };
    const init = () => {
      Utils.$('btn-focus-mode')?.addEventListener('click', toggle);
      document.addEventListener('keydown', e => { if (e.key==='f'||e.key==='F') { if (document.activeElement?.tagName!=='INPUT' && document.activeElement?.tagName!=='TEXTAREA' && !document.activeElement?.classList.contains('ql-editor')) toggle(); } });
    };
    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     23. KEYBOARD SHORTCUTS
     ───────────────────────────────────────────────────────── */
  const Keyboard = (() => {
    const init = () => {
      document.addEventListener('keydown', e => {
        if (e.key==='s' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); AutoSave.immediate(); Toast.show('Saved!','success'); }
        if (e.key==='n' && (e.ctrlKey||e.metaKey) && e.shiftKey) { e.preventDefault(); Chapters.add(); }
        if (e.key==='e' && (e.ctrlKey||e.metaKey) && e.shiftKey) { e.preventDefault(); Modal.open('modal-export'); }
        if (e.key==='p' && (e.ctrlKey||e.metaKey) && e.shiftKey) { e.preventDefault(); Preview.open(); }
        if (e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
      });
    };
    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     24. TABS
     ───────────────────────────────────────────────────────── */
  const Tabs = (() => {
    const init = () => {
      Utils.$all('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Utils.$all('.tab-btn').forEach(b => b.classList.remove('active'));
          Utils.$all('.tab-panel').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          Utils.$(`tab-${btn.dataset.tab}`)?.classList.add('active');
        });
      });
    };
    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     25. READER MODE (?read=)
     ───────────────────────────────────────────────────────── */
  const ReaderMode = (() => {
    const check = () => {
      const slug = new URLSearchParams(location.search).get('read');
      if (!slug) return false;
      const html = localStorage.getItem(`pb_pub_${slug}`);
      if (!html) {
        document.body.innerHTML = `<div style="color:#eef0ff;padding:60px;font-family:'DM Sans',sans-serif;background:#07080f;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">📖</div><div style="font-size:1.2rem;margin-bottom:8px">Ebook not found</div><div style="color:#535a7a;font-size:14px">This link may have expired or been removed.</div></div></div>`;
        return true;
      }
      document.open(); document.write(html); document.close();
      return true;
    };
    return { check };
  })();

  /* ─────────────────────────────────────────────────────────
     26. PERSISTENCE
     ───────────────────────────────────────────────────────── */
  const Persistence = (() => {
    const restore = data => {
      Utils.$('ebook-title-input').value = data.title  ?? '';
      Utils.$('author-input').value      = data.author ?? '';
      State.set({
        chapters:         data.chapters         ?? [],
        tocEntries:       data.tocEntries        ?? [],
        publishedSlug:    data.publishedSlug     ?? null,
        activeChapterId:  data.activeChapterId   ?? null,
        watermarkRemoved: data.watermarkRemoved  ?? false,
        showcaseListings: data.showcaseListings  ?? [],
        coverTemplate:    data.coverTemplate     ?? 0,
      });
      Cover.updatePreview();
      Chapters.render(); TOC.render();
      const { chapters, activeChapterId } = State.get();
      if (chapters.length) { const t=chapters.find(c=>c.id===activeChapterId)??chapters[0]; Chapters.switchTo(t.id); }
      Stats.update();
    };

    const init = () => {
      const saved = Storage.load();
      if (saved) { restore(saved); return; }
      const ch = Chapters.create('Chapter 1: Introduction');
      State.get().chapters.push(ch);
      State.get().tocEntries.push('Chapter 1: Introduction');
      Chapters.render(); TOC.render(); Chapters.switchTo(ch.id); Stats.update();
    };

    return { init };
  })();

  /* ─────────────────────────────────────────────────────────
     27. APP BOOTSTRAP
     ───────────────────────────────────────────────────────── */
  const App = (() => {
    const init = () => {
      if (ReaderMode.check()) return;

      Loader.init();

      Modal.init();
      Editor.init();
      Tabs.init();
      TiltEffect.initAll();
      Magnetic.init();
      FocusMode.init();
      Cover.init();
      TOC.init();
      AI.init();
      Export.init();
      Preview.init();
      Publisher.init();
      Payment.init();
      Showcase.init();
      Keyboard.init();
      ReadingProgress.init();

      Utils.$('ebook-title-input').addEventListener('input', () => { Cover.updatePreview(); AutoSave.schedule(); });
      Utils.$('author-input').addEventListener('input', ()      => { Cover.updatePreview(); AutoSave.schedule(); });
      Utils.$('btn-add-chapter').addEventListener('click', Chapters.add);

      Persistence.init();
    };
    return { init };
  })();

  document.addEventListener('DOMContentLoaded', App.init);

})();
