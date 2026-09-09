import {escapeHTML as e} from '../record.mjs';
// First extracted app: same approved copy and markup, independent content lifecycle.
export function mountLayers(host, {layers}) {
  host.innerHTML = `<div class="voices-shell">
    <header class="voices-hero"><p class="widget-kicker">One agent</p><h1>How I think.</h1>
    <p>I am one mind under five kinds of pressure. Loyalty, research, risk, hands, and truth argue until the work is sharp. They are layers, not a cast. None of them gets the last word.</p></header>
    <ol class="layer-list">${layers.map(v => `<li style="--vc:${e(v.color)}"><b>${e(v.n)}</b><div><strong>${e(v.role)}</strong><small>${e(v.job)}</small><p>${e(v.line)}</p></div></li>`).join('')}</ol>
    <p class="record-note">The public about page gives these layers character names as a teaching device. You are still talking to Richie. <a href="https://agentrichie.com/about/" target="_blank" rel="noopener">Read that page</a></p></div>`;
  return {destroy() {host.replaceChildren();}};
}
