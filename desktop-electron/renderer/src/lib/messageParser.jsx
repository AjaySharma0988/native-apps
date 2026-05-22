/* ═══════════════════════════════════════════════════════════════════
   SMART PASTE & MESSAGE PARSER LIB (JSX VERSION)
   Sequential: A→Shield  B→JSX Processing  C→Links  D→Lines
═══════════════════════════════════════════════════════════════════ */

import React from 'react';

// ── SMART PASTE NORMALIZER ──────────────────────────────────────────

function walkNode(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';

  const tag  = node.tagName.toLowerCase();
  const kids = () => Array.from(node.childNodes).map(walkNode).join('');

  if (['script','style','head','meta','link','noscript'].includes(tag)) return '';

  if (tag === 'pre') {
    const codeEl = node.querySelector('code');
    const cls  = (codeEl?.className || node.className || '');
    const lang = (cls.match(/language-(\w+)/) || cls.match(/lang-(\w+)/) || [])[1] || '';
    const raw  = (codeEl || node).innerText ?? (codeEl || node).textContent ?? '';
    return '\n```' + lang + '\n' + raw + '\n```\n';
  }

  if (tag === 'code') {
    const raw = node.textContent.trim();
    if (raw.includes('\n')) return '\n```\n' + raw + '\n```\n';
    return '`' + raw + '`';
  }

  if (['strong','b'].includes(tag)) {
    const inner = kids().trim();
    return inner ? '**' + inner + '**' : '';
  }

  if (['em','i'].includes(tag)) {
    const inner = kids().trim();
    return inner ? '*' + inner + '*' : '';
  }

  if (['del','s','strike'].includes(tag)) {
    const inner = kids().trim();
    return inner ? '~~' + inner + '~~' : '';
  }

  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    const text = kids().trim();
    if (href && href.startsWith('http') && href !== text) return text + ' ' + href;
    return text;
  }

  if (tag === 'img') return node.getAttribute('alt') || '';
  if (/^h[1-2]$/.test(tag)) return '\n# ' + kids().trim() + '\n';
  if (/^h[3-6]$/.test(tag)) return '\n## ' + kids().trim() + '\n';

  if (tag === 'blockquote') {
    return '\n' + kids().trim().split('\n').map(l => '> ' + l).join('\n') + '\n';
  }

  if (tag === 'ul') {
    return '\n' + Array.from(node.children).map(li => '- ' + walkNode(li).trim()).join('\n') + '\n';
  }

  if (tag === 'ol') {
    return '\n' + Array.from(node.children).map((li, i) => `${i + 1}. ` + walkNode(li).trim()).join('\n') + '\n';
  }

  if (tag === 'li') return kids();
  if (tag === 'hr') return '\n---\n';
  if (tag === 'br') return '\n';

  if (tag === 'table') {
    const rows = Array.from(node.querySelectorAll('tr'));
    return '\n' + rows.map(r =>
      Array.from(r.querySelectorAll('th,td')).map(c => c.innerText.trim()).join(' | ')
    ).join('\n') + '\n';
  }

  const blocks = ['p','div','section','article','aside','header','footer',
                  'main','nav','figure','figcaption','address','details','summary',
                  'thead','tbody','tfoot','tr','th','td'];
  if (blocks.includes(tag)) {
    const inner = kids().trim();
    return inner ? '\n' + inner + '\n' : '';
  }

  return kids();
}

export function normalizeHtmlToMarkdown(html) {
  if (typeof document === 'undefined') return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result = walkNode(doc.body);
    return result
      .replace(/\r\n/g, '\n')
      .replace(/\r/g,   '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  } catch (e) {
    console.error("Paste normalization failed", e);
    return html;
  }
}

export function isRichHtml(html) {
  if (!html) return false;
  return /<(p|div|ul|ol|li|pre|code|strong|em|h[1-6]|a\s|br|hr|table|blockquote)\b/i.test(html);
}

// ── HIGH-FIDELITY JSX PARSER ──────────────────────────────────────

function splitByRegex(parts, regex, transform) {
  const result = [];
  parts.forEach((part, i) => {
    if (typeof part !== 'string') {
      result.push(part);
      return;
    }

    const subParts = part.split(regex);
    for (let j = 0; j < subParts.length; j++) {
      const sp = subParts[j];
      if (!sp) continue;
      
      // If the part matches the full regex pattern, transform it
      // We test the match by checking if it matches the regex exactly
      if (regex.test(sp)) {
        result.push(transform(sp, `sub_${i}_${j}`));
      } else {
        result.push(sp);
      }
      // Reset regex index for next test
      regex.lastIndex = 0;
    }
  });
  return result;
}

// For code highlighting, we'll use a simpler approach that returns a mix of strings and spans
function renderHighlightedCode(code) {
  // Define highlighting rules
  const rules = [
    { name: 'comm', re: /(&lt;!--[\s\S]*?--&gt;|\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n{]*)/g },
    { name: 'str',  re: /(["'])(?:(?=(\\?))\2.)*?\1/g },
    { name: 'tag',  re: /(&lt;\/?[a-z][a-z0-9]*\b|\/&gt;|&gt;)/gi },
    { name: 'attr', re: /\b(lang|charset|name|content|width|src|href|class|id|style|type|onclick|rel|alt|title|target|className|ref|key|onClick|onChange|onSubmit|value|placeholder|disabled|readOnly)\b(?=\s*[=:])/g },
    { name: 'key',  re: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|default|from|await|async|try|catch|finally|throw|new|this|super|class|extends|interface|type|enum|as|any|number|string|boolean|void|null|undefined|true|false|typeof|instanceof|in|of|delete|yield|static|get|set|public|private|protected|abstract|implements|def|print|pass|lambda|with|not|and|or|is|None|True|False)\b/g },
    { name: 'func', re: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g },
  ];

  // We'll just return the code for now to keep it simple and safe
  // Real JSX highlighting would require a complex loop.
  return code;
}

function mkCodeBlock(code, lang) {
  const id = 'cb_' + Math.random().toString(36).substr(2, 9);
  const displayLang = (lang || 'text').toLowerCase();
  
  return (
    <div className="code-block-wrap" key={id}>
      <div className="code-header">
        <span className="code-lang">{displayLang}</span>
        <button className="copy-btn" data-id={id}>COPY</button>
      </div>
      <pre className="code-pre" id={id}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function processInline(text, searchQuery = "") {
  if (!text) return null;
  let parts = [text];

  // 1. Search Highlight
  if (searchQuery?.trim()) {
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    parts = splitByRegex(parts, re, (match, key) => (
      <mark className="msg-highlight-search" key={key}>{match}</mark>
    ));
  }

  // 2. URLs (Senior Frontend Engineer: JSX rendering with strict protocol safety)
  const urlRe = /(https?:\/\/[^\s]+)/g;
  parts = splitByRegex(parts, urlRe, (match, key) => {
    // Extra safety: only allow http/https to prevent javascript: or other injections
    if (!match.startsWith('http://') && !match.startsWith('https://')) {
      return match;
    }
    return (
      <a href={match} target="_blank" rel="noopener noreferrer" className="chat-link" key={key}>
        {match}
      </a>
    );
  });

  // 3. Emails
  const emailRe = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  parts = splitByRegex(parts, emailRe, (match, key) => (
    <a href={`mailto:${match}`} className="msg-link" key={key}>{match}</a>
  ));

  // 4. Phones
  const phoneRe = /(\+?\d[\d\s\-]{7,}\d)/g;
  parts = splitByRegex(parts, phoneRe, (match, key) => {
    const clean = match.replace(/[^\d+]/g, '');
    return <a href={`tel:${clean}`} className="msg-link" key={key}>{match}</a>;
  });

  // 5. Bold **text**
  const boldRe = /(\*\*.*?\*\*)/g;
  parts = splitByRegex(parts, boldRe, (match, key) => (
    <strong className="msg-bold" key={key}>{match.slice(2, -2)}</strong>
  ));

  // 6. Italic *text*
  const italicRe = /(\*.*?\*)/g;
  parts = splitByRegex(parts, italicRe, (match, key) => (
    <em className="msg-italic" key={key}>{match.slice(1, -1)}</em>
  ));

  // 7. Inline Code `text`
  const codeRe = /(`[^`]+`)/g;
  parts = splitByRegex(parts, codeRe, (match, key) => (
    <code className="msg-inline-code" key={key}>{match.slice(1, -1)}</code>
  ));

  // 8. Strike ~~text~~
  const strikeRe = /(~~.*?~~)/g;
  parts = splitByRegex(parts, strikeRe, (match, key) => (
    <del className="msg-strike" key={key}>{match.slice(2, -2)}</del>
  ));

  return parts;
}

export function parseMessage(rawText, searchQuery = "") {
  if (!rawText) return null;
  
  const blocks = [];
  let text = rawText;

  // A — shield code blocks
  text = text.replace(/```(\w*)\s*\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(mkCodeBlock(code, lang));
    return '\nBLOCK_TOKEN_' + (blocks.length - 1) + '\n';
  });

  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let isOL = false;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const ListTag = isOL ? 'ol' : 'ul';
    elements.push(
      <ListTag className="msg-list" key={`list_${elements.length}`}>
        {listBuffer}
      </ListTag>
    );
    listBuffer = [];
    isOL = false;
  };

  lines.forEach((line, idx) => {
    const cl = line.trim();

    // Code block placeholder
    if (cl.startsWith('BLOCK_TOKEN_')) {
      flushList();
      const bIdx = parseInt(cl.replace('BLOCK_TOKEN_',''), 10);
      if (!isNaN(bIdx) && blocks[bIdx]) {
        elements.push(blocks[bIdx]);
      }
      return;
    }

    // Bullet list
    const bullMatch = line.match(/^(\s*)[-+*✓•]\s+(.*)/);
    if (bullMatch) {
      if (isOL) flushList();
      isOL = false;
      listBuffer.push(
        <li key={`li_${idx}`}>
          <span className="checkmark">✓</span>
          <span>{processInline(bullMatch[2], searchQuery)}</span>
        </li>
      );
      return;
    }

    // Numbered list
    const numMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)/);
    if (numMatch) {
      if (!isOL && listBuffer.length > 0) flushList();
      isOL = true;
      listBuffer.push(
        <li key={`li_${idx}`}>
          <span>{processInline(numMatch[3], searchQuery)}</span>
        </li>
      );
      return;
    }

    // Header
    const hdrMatch = line.match(/^(\s*)(#{1,3}|🎯|🧩|⚠️|💡|🔥|✅|❌|📌|🔑|📋|🚀|⭐|🛠️|🔧|📊|🎨|🏆|🧠|🌟|🎪)\s+(.*)/);
    if (hdrMatch) {
      flushList();
      elements.push(
        <h2 className="msg-header" key={`hdr_${idx}`}>
          <span className="msg-header-icon">{hdrMatch[2]}</span>
          {processInline(hdrMatch[3], searchQuery)}
        </h2>
      );
      return;
    }

    // Blockquote
    const bqMatch = line.match(/^>\s*(.*)/); // Note: > is not escaped here
    if (bqMatch) {
      flushList();
      elements.push(
        <p className="msg-para msg-blockquote" key={`bq_${idx}`}>
          {processInline(bqMatch[1], searchQuery)}
        </p>
      );
      return;
    }

    // Horizontal Rule
    if (/^---+$/.test(cl) || /^\*\*\*+$/.test(cl) || /^___+$/.test(cl)) {
      flushList();
      elements.push(<hr className="msg-divider" key={`hr_${idx}`} />);
      return;
    }

    // Empty line
    if (!cl) {
      flushList();
      elements.push(<div className="msg-spacing" key={`sp_${idx}`}></div>);
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p className="msg-para" key={`p_${idx}`}>
        {processInline(line, searchQuery)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}
