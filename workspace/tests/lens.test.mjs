import test from 'node:test';
import assert from 'node:assert/strict';
import {TIERS, UNSOURCED, CLAIM_SELECTOR, EXEMPT_SELECTOR, readRegions} from '../lens.mjs';

/* A tiny DOM stub: enough to exercise readRegions' counting rules
   without a browser. Real painting is checked in work/c10-lens.mjs. */
function el(tag, {tier, text = 'a sentence with words', children = []} = {}) {
  const node = {
    tagName: tag.toUpperCase(), hidden: false, isConnected: true, dataset: tier ? {tier} : {},
    children, textContent: text || children.map((c) => c.textContent).join(' '), parent: null,
  };
  for (const c of children) c.parent = node;
  node.matches = (sel) => sel.split(',').map((s) => s.trim()).includes(tag);
  node.closest = (sel) => {
    const parts = sel.split(',').map((s) => s.trim());
    for (let n = node; n; n = n.parent) {
      if (parts.includes(n.tagName.toLowerCase())) return n;
      if (parts.includes('[data-tier]') && n.dataset.tier) return n;
      if (n.dataset.tier && parts.includes(`[data-tier="${n.dataset.tier}"]`)) return n;
    }
    return null;
  };
  node.querySelectorAll = (sel) => {
    const parts = sel.split(',').map((s) => s.trim());
    const out = [];
    const walk = (n) => { for (const c of n.children) { if (parts.includes(c.tagName.toLowerCase())) out.push(c); walk(c); } };
    walk(node); return out;
  };
  node.querySelector = (sel) => node.querySelectorAll(sel)[0] || null;
  return node;
}

test('the tier vocabulary is closed, coloured and explained, and unsourced is not one of the tiers', () => {
  assert.deepEqual(Object.keys(TIERS), ['export', 'derived', 'git', 'editorial', 'live', 'chrome']);
  for (const [k, t] of Object.entries(TIERS)) {
    assert.match(t.color, /^#[0-9a-f]{6}$/i, k + ' has a colour');
    assert.ok(t.note.length > 30 && /\.$/.test(t.note), k + ' explains itself in a sentence');
    assert.ok(!t.note.includes('—'), k + ' carries no em dash');
  }
  assert.ok(!Object.keys(TIERS).includes('unsourced'));
  assert.match(UNSOURCED.note, /defect/, 'an unsourced statement is named as a defect, not a category');
});

test('prose is counted by its nearest declared tier; declared interface is counted nowhere', () => {
  const region = el('div', {children: [
    el('p', {tier: 'export'}),
    el('p', {tier: 'editorial'}),
    el('p', {tier: 'chrome'}),
    el('p', {}),                                   // the defect
  ]});
  const {counts, marks} = readRegions([region]);
  assert.equal(counts.export, 1);
  assert.equal(counts.editorial, 1);
  assert.equal(counts.unsourced, 1);
  assert.equal(marks.length, 3, 'declared interface is not painted');
  assert.ok(!marks.some((m) => m.key === 'chrome'));
});

test('a tier on a wrapper covers the prose inside it, and the wrapper is not double counted', () => {
  const inner = el('p', {text: 'the quoted reason'});
  const region = el('div', {children: [el('li', {tier: 'export', children: [inner]})]});
  const {counts} = readRegions([region]);
  assert.equal(counts.export, 1, 'counted once, at the innermost prose');
  assert.equal(counts.unsourced, 0);
});

test('elements with no words are not sentences and are never called unsourced', () => {
  const region = el('div', {children: [el('p', {text: '60'}), el('p', {text: '·'}), el('p', {text: ''})]});
  assert.equal(readRegions([region]).counts.unsourced, 0);
});

test('the scan rule is narrow on purpose, and controls are exempt by ancestor', () => {
  for (const t of ['p', 'li', 'dd', 'td', 'th', 'blockquote', 'pre', 'figcaption']) assert.ok(CLAIM_SELECTOR.includes(t), t);
  for (const t of ['h1', 'h2', 'h3', 'span', 'div', 'strong', 'time', 'code']) assert.ok(!CLAIM_SELECTOR.split(',').map((s) => s.trim()).includes(t), t + ' is not prose');
  for (const t of ['button', 'nav', 'label', 'summary']) assert.ok(EXEMPT_SELECTOR.includes(t), t + ' is exempt');
  const region = el('div', {children: [el('button', {children: [el('li', {text: 'a control label'})]})]});
  assert.equal(readRegions([region]).counts.unsourced, 0, 'a label inside a control claims nothing');
});
