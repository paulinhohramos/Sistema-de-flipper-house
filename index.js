const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)]
const R = v =>
  (v < 0 ? '−' : '') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR')
const P = v =>
  (v < 0 ? '−' : '') +
  Math.abs(v * 100)
    .toFixed(1)
    .replace('.', ',') +
  '%'
const E = s =>
  String(s ?? '').replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  )
const KEY = 'flipper-v1',
  mesAtual = () =>
    new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const GLOBAL = {
  meta: 30,
  capital: 0,
  itbi: 2,
  escr: 1.5,
  reg: 1000,
  corr: 5,
  ir: 15,
  ent: 20,
  taxa: 12,
  nfin: 360,
  regf: 1500,
  canc: 1070
}
const GL = {
  meta: 'Meta de rentab. %',
  capital: 'Capital disponível R$',
  itbi: 'ITBI %',
  escr: 'Escritura %',
  reg: 'Registro R$',
  corr: 'Corretagem %',
  ir: 'Imposto s/ ganho %',
  ent: 'Entrada %',
  taxa: 'Taxa nominal a.a. %',
  nfin: 'Prazo financ. (meses)',
  regf: 'Registro financ. R$',
  canc: 'Cancel. alienação R$'
}
const blank = () => ({
  id: Date.now() + Math.random(),
  nome: 'Novo imóvel',
  tipo: 'Apartamento',
  cidade: 'Brasília',
  mes: mesAtual(),
  corretor: '',
  whats: '',
  link: '',
  area: 60,
  anun: 600000,
  oferta: 500000,
  venda: 700000,
  meses: 6,
  obs: '',
  dias: 0,
  adq: false,
  refPct: 15,
  refFixo: 0,
  desp: 800,
  extras: 0,
  tarifas: 0
})
const seed = () => [
  {
    ...blank(),
    id: 1,
    nome: 'Asa Sul SQS 409',
    area: 61.7,
    anun: 659000,
    oferta: 500000,
    venda: 710000,
    dias: 95,
    tarifas: 3496,
    corretor: 'Paulo Ramos',
    obs: '2 quartos · Apartamento reformado de 61,7 m², 2 quartos, 2 banheiros, sem elevador nem vaga, com quarto extra no subsolo, excelente localização na Asa Sul, preço atrativo.'
  },
  {
    ...blank(),
    id: 2,
    nome: 'SQN 312 Bloco F',
    area: 75,
    anun: 749000,
    oferta: 750000,
    venda: 900000,
    dias: 119,
    refFixo: 50000,
    link: 'https://www.dfimoveis.com.br/imovel/apartamento-2-quartos-venda-asa-norte-brasilia-df-sqn-312-bloco-f-1366817',
    obs: '2 quartos · Apartamento de 75 m², 2 quartos, 1 lavabo, 1° andar, vista livre nascente, sem vaga privativa, fachada e pilotis reformados, ótima localização na SQN 312, preço atrativo.'
  }
]
let db
try {
  db = JSON.parse(localStorage.getItem(KEY))
} catch (e) {}
if (!db || !db.items) db = { s: { ...GLOBAL }, items: seed() }
db.s = { ...GLOBAL, ...db.s }
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch (e) {}
}
const find = el => db.items.find(p => p.id == el.closest('.card').dataset.id)

/* ---------- cálculo: reproduz as fórmulas do sistema original ---------- */
function calc(p, s, off) {
  const v = p.venda,
    n = p.meses,
    cor = (v * s.corr) / 100,
    desp = p.desp * n,
    ref = p.refFixo > 0 ? p.refFixo : (off * p.refPct) / 100,
    itbi = (off * s.itbi) / 100
  const esc = (off * s.escr) / 100,
    dA = off + itbi + esc + s.reg + ref + desp + p.extras
  const bA = v - cor - (off + itbi + esc + s.reg + ref + p.extras),
    iA = (Math.max(0, bA) * s.ir) / 100,
    lA = v - cor - dA - iA
  const fin = off * (1 - s.ent / 100),
    i = s.taxa / 1200,
    g = Math.pow(1 + i, n)
  const pmt = i ? (fin * i) / (1 - Math.pow(1 + i, -s.nfin)) : fin / s.nfin
  const saldo = i ? fin * g - (pmt * (g - 1)) / i : fin - pmt * n,
    par = pmt * n,
    jur = par - (fin - saldo),
    ent = (off * s.ent) / 100
  const dB =
    ent + itbi + s.regf + s.canc + ref + desp + p.extras + p.tarifas + par
  const bB =
      v -
      cor -
      (off + itbi + s.regf + s.canc + ref + p.extras + p.tarifas) -
      jur,
    iB = (Math.max(0, bB) * s.ir) / 100,
    lB = v - saldo - cor - dB - iB
  return {
    A: {
      d: dA,
      l: lA,
      r: dA ? lA / dA : 0,
      rows: [
        ['Aquisição'],
        ['Valor de compra', off],
        ['ITBI (' + s.itbi + '%)', itbi],
        ['Escritura (' + s.escr + '%)', esc],
        ['Registro', s.reg],
        ['Operação'],
        ['Reforma', ref],
        ['Despesas (' + n + ' meses)', desp],
        ['Custos extras', p.extras],
        ['Desembolso total', dA, 1],
        ['Saída'],
        ['Valor de venda', v],
        ['Corretagem (' + s.corr + '%)', cor],
        ['Ganho de capital (base IR)', bA],
        ['Imposto (' + s.ir + '%)', iA],
        ['Lucro líquido', lA, 1]
      ]
    },
    B: {
      d: dB,
      l: lB,
      r: dB ? lB / dB : 0,
      rows: [
        ['Aquisição'],
        ['Valor de compra', off],
        ['Entrada (' + s.ent + '%)', ent],
        ['Saldo financiado', fin],
        ['ITBI (' + s.itbi + '%)', itbi],
        ['Registro + cancel. alienação', s.regf + s.canc],
        ['Tarifas do banco', p.tarifas],
        ['Financiamento (Price)'],
        ['Parcela mensal', pmt],
        ['Parcelas pagas (' + n + ' meses)', par],
        ['Saldo devedor ao vender', saldo],
        ['Juros pagos', jur],
        ['Operação'],
        ['Reforma', ref],
        ['Despesas (' + n + ' meses)', desp],
        ['Custos extras', p.extras],
        ['Desembolso total (caixa)', dB, 1],
        ['Saída'],
        ['Valor de venda', v],
        ['Quita saldo devedor', saldo],
        ['Corretagem (' + s.corr + '%)', cor],
        ['Ganho de capital (base IR)', bB],
        ['Imposto (' + s.ir + '%)', iB],
        ['Lucro líquido', lB, 1]
      ]
    }
  }
}
function maxOff(p, k) {
  // maior oferta que ainda atinge a meta (bisseção)
  const t = db.s.meta / 100
  let lo = 0,
    hi = Math.max(p.venda * 2, 1)
  if (calc(p, db.s, 1)[k].r < t) return null
  for (let j = 0; j < 70; j++) {
    const m = (lo + hi) / 2
    calc(p, db.s, m)[k].r > t ? (lo = m) : (hi = m)
  }
  return lo
}
const rows = r =>
  r
    .map(x =>
      x.length === 1
        ? `<div class="sec">${x[0]}</div>`
        : `<div class="r${x[2] ? ' s' : ''}"><span>${x[0]}</span><span>${R(x[1])}</span></div>`
    )
    .join('')

/* ---------- renderização ---------- */
function cardHTML(p) {
  const wa = p.whats
    ? `<a href="https://wa.me/${p.whats.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp →</a> · `
    : ''
  const lk = p.link
    ? `<a href="${E(p.link)}" target="_blank" rel="noopener">🔗 Ver anúncio →</a>`
    : ''
  const nf = (l, f, u = '') =>
    `<label class="lbl">${l}<input class="num" type="number" step="any" data-f="${f}" value="${p[f]}"></label>`
  return `<article class="card${p.adq ? ' adq' : ''}" data-id="${p.id}">
 <div class="hd"><div>
  <div class="tt"><h2>${E(p.nome)} · ${Math.round(p.area)} m²</h2><span class="pill">${E(p.tipo)}</span><span class="pill" data-b="st"></span>${p.adq ? '<span class="pill adq">Adquirido</span>' : ''}${p.dias ? `<span class="pill dias">⏱ há ${p.dias} dias</span>` : ''}</div>
  <div class="sb">${E(p.cidade)} · ${E(p.mes)}${p.corretor ? ' · ' + E(p.corretor) : ''} · ${wa}${lk}</div>
  ${p.dias >= 90 ? '<div class="neg">⚡ boa oportunidade de negociação</div>' : ''}
 </div>
 <div class="acts"><button class="btn" data-a="edit">✎ Editar</button><button class="btn" data-a="pdf">PDF</button><button class="btn" data-a="prop">Proposta</button><button class="btn dark" data-a="adq">${p.adq ? 'Desfazer aquisição' : 'Imóvel Adquirido'}</button><button class="btn link" data-a="del">Excluir</button></div></div>
 <div class="row">
  <div><span class="lbl">Anunciado</span><div class="big">${R(p.anun)}</div><div class="sm">${R(p.anun / p.area)}/m²</div></div>
  <div><span class="lbl">Sua oferta <small>(editável)</small></span><input class="in" type="number" step="any" data-f="oferta" value="${p.oferta}" aria-label="Sua oferta">
   <div class="sm"><span class="tag" data-b="dsg"></span><button class="ul" data-a="usaAnun">↻ usar o anunciado</button></div><div class="sm" data-b="mOff"></div></div>
  <div><span class="lbl">Venda projetada <small>(editável)</small></span><input class="in" type="number" step="any" data-f="venda" value="${p.venda}" aria-label="Venda projetada">
   <div class="sm"><span style="color:var(--gold)">valor manual</span> <button class="ul" data-a="usaMedia">↻ usar média dos bons</button></div><div class="sm" data-b="mVen"></div></div>
  <div><span class="lbl">Meses obra+venda</span><input class="in plain" type="number" step="1" data-f="meses" value="${p.meses}" aria-label="Meses"></div>
 </div>
 <div class="obs"><span class="lbl">Observações <small style="color:var(--mu)">(clique para editar)</small></span><p data-a="obs">${E(p.obs) || '—'}</p></div>
 <div class="sc">${[
   ['A', 'À vista (capital próprio)'],
   ['B', 'Financiado (' + db.s.ent + '% entrada)']
 ]
   .map(
     ([k, t]) => `<div class="box"><h3>${t}</h3>
  <div class="kv o"><span>Sua oferta</span><b data-b="of${k}"></b></div>
  <div class="kv"><span>Desembolso total</span><b data-b="d${k}"></b></div>
  <div class="kv g" data-b="lc${k}"><span>Lucro líquido</span><b data-b="l${k}"></b></div>
  <div class="kv y"><span>Rentabilidade</span><b data-b="r${k}"></b></div>
  <div class="mx"><span>Oferta máx para ${db.s.meta}%</span><b data-b="m${k}"></b></div>
  <div class="sm" data-b="cap${k}"></div></div>`
   )
   .join('')}</div>
 <button class="dt" data-a="det">+ Detalhar e editar custos</button>
 <div class="det"><div class="cf">${nf('Reforma (% da oferta)', 'refPct')}${nf('Reforma valor fixo R$ (opcional)', 'refFixo')}${nf('Despesas por mês R$', 'desp')}${nf('Custos extras R$', 'extras')}${nf('Tarifas do banco R$ (financ.)', 'tarifas')}</div><div class="tabs"><div><h4>À vista</h4><div data-b="tA"></div></div><div><h4>Financiado</h4><div data-b="tB"></div></div></div></div>
 </article>`
}
function upd(el, p) {
  // atualiza só os números, sem recriar os campos (mantém o foco)
  const s = db.s,
    c = calc(p, s, p.oferta),
    set = (k, v) => {
      const n = $(`[data-b="${k}"]`, el)
      if (n) n.textContent = v
    }
  const best = Math.max(c.A.r, c.B.r),
    ok = best >= s.meta / 100,
    d = p.anun ? p.oferta / p.anun - 1 : 0
  const st = $('[data-b="st"]', el)
  st.textContent = ok ? 'dentro da meta' : 'abaixo da meta'
  st.className = 'pill' + (ok ? ' ok' : '')
  const dg = $('[data-b="dsg"]', el)
  dg.textContent =
    (d <= 0 ? '−' : '+') +
    Math.abs(d * 100)
      .toFixed(1)
      .replace('.', ',') +
    '% sobre anunciado'
  dg.className = 'tag' + (d > 0 ? ' up' : '')
  set('mOff', R(p.oferta / p.area) + '/m² na oferta')
  set('mVen', R(p.venda / p.area) + '/m² projetado')
  ;['A', 'B'].forEach(k => {
    const x = c[k],
      m = maxOff(p, k)
    set('of' + k, R(p.oferta))
    set('d' + k, R(x.d))
    set('l' + k, R(x.l))
    set('r' + k, P(x.r))
    $(`[data-b="lc${k}"]`, el).className = 'kv ' + (x.l < 0 ? 'n' : 'g')
    set('m' + k, m === null ? 'inviável' : R(m))
    set(
      'cap' + k,
      s.capital >= x.d
        ? 'Capital cobre o desembolso'
        : 'Faltam ' + R(x.d - s.capital) + ' de capital'
    )
  })
  $('[data-b="tA"]', el).innerHTML = rows(c.A.rows)
  $('[data-b="tB"]', el).innerHTML = rows(c.B.rows)
}
function render() {
  $('#list').innerHTML =
    db.items.map(cardHTML).join('') ||
    '<p class="mu">Nenhum imóvel. Clique em "+ Novo imóvel".</p>'
  db.items.forEach(p => upd($(`.card[data-id="${p.id}"]`), p))
}
const updAll = () =>
  db.items.forEach(p => upd($(`.card[data-id="${p.id}"]`), p))

/* ---------- eventos ---------- */
document.addEventListener('input', e => {
  const f = e.target.dataset.f
  if (f) {
    const p = find(e.target)
    p[f] = parseFloat(e.target.value) || 0
    save()
    upd(e.target.closest('.card'), p)
  }
  const g = e.target.dataset.g
  if (g) {
    db.s[g] = parseFloat(e.target.value) || 0
    save()
    updAll()
    if (g === 'ent' || g === 'meta') render()
  }
})
function dialog(html) {
  const d = $('#dlg')
  d.innerHTML = html
  d.showModal()
  return d
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a]')
  if (!a) return
  const el = a.closest('.card'),
    p = el && find(a),
    act = a.dataset.a
  if (act === 'det') el.classList.toggle('open')
  if (act === 'usaAnun') {
    p.oferta = p.anun
    save()
    $('[data-f="oferta"]', el).value = p.oferta
    upd(el, p)
  }
  if (act === 'usaMedia') {
    // média R$/m² dos imóveis que batem a meta (ou de todos os outros)
    const o = db.items.filter(x => x !== p),
      bons = o.filter(x => {
        const c = calc(x, db.s, x.oferta)
        return Math.max(c.A.r, c.B.r) >= db.s.meta / 100
      }),
      b = bons.length ? bons : o
    if (!b.length) return
    p.venda = Math.round(
      (b.reduce((t, x) => t + x.venda / x.area, 0) / b.length) * p.area
    )
    save()
    $('[data-f="venda"]', el).value = p.venda
    upd(el, p)
  }
  if (act === 'obs') {
    const t = document.createElement('textarea')
    t.value = p.obs
    a.replaceWith(t)
    t.focus()
    t.onblur = () => {
      p.obs = t.value
      save()
      render()
    }
  }
  if (act === 'adq') {
    p.adq = !p.adq
    save()
    render()
  }
  if (act === 'del' && confirm('Excluir ' + p.nome + '?')) {
    db.items = db.items.filter(x => x !== p)
    save()
    render()
  }
  if (act === 'pdf') {
    el.classList.add('print-me')
    window.print()
    setTimeout(() => el.classList.remove('print-me'), 500)
  }
  if (act === 'edit') {
    const t = [
      ['nome', 'Nome / endereço'],
      ['tipo', 'Tipo'],
      ['cidade', 'Cidade'],
      ['mes', 'Mês'],
      ['corretor', 'Corretor / imobiliária'],
      ['whats', 'WhatsApp (com DDD)'],
      ['link', 'Link do anúncio', 'w'],
      ['area', 'Área útil m²'],
      ['anun', 'Valor anunciado R$'],
      ['dias', 'Dias no portal']
    ]
    const d = dialog(
      `<h3>Editar imóvel</h3><form method="dialog">${t.map(([k, l, w]) => `<label class="lbl ${w || ''}">${l}<input class="num" name="${k}" value="${E(p[k])}"></label>`).join('')}<div class="fa"><button class="btn" value="x">Cancelar</button><button class="btn dark" value="ok">Salvar</button></div></form>`
    )
    d.querySelector('form').onsubmit = ev => {
      if (ev.submitter.value !== 'ok') return
      new FormData(ev.target).forEach(
        (v, k) =>
          (p[k] = ['area', 'anun', 'dias'].includes(k) ? parseFloat(v) || 0 : v)
      )
      save()
      render()
    }
  }
  if (act === 'prop') {
    const txt = `Olá${p.corretor ? ', ' + p.corretor : ''}! Tenho interesse no imóvel ${p.nome} (${Math.round(p.area)} m²), anunciado por ${R(p.anun)}. Gostaria de apresentar uma proposta de ${R(p.oferta)}. Podemos conversar?`
    const d = dialog(
      `<h3>Proposta</h3><textarea id="pt">${E(txt)}</textarea><div class="fa"><button class="btn" id="cp">Copiar</button>${p.whats ? `<a class="btn dark" id="wz" target="_blank" rel="noopener">Abrir no WhatsApp</a>` : ''}<button class="btn" id="cl">Fechar</button></div>`
    )
    $('#cl').onclick = () => d.close()
    $('#cp').onclick = () => navigator.clipboard?.writeText($('#pt').value)
    const w = $('#wz')
    if (w)
      w.onclick = () => {
        w.href =
          'https://wa.me/' +
          p.whats.replace(/\D/g, '') +
          '?text=' +
          encodeURIComponent($('#pt').value)
      }
  }
})
$('#novo').onclick = () => {
  db.items.unshift(blank())
  save()
  render()
}
$('#gp').onclick = () => {
  const b = $('#params')
  b.hidden = !b.hidden
  if (!b.hidden)
    b.innerHTML = Object.keys(GL)
      .map(
        k =>
          `<label>${GL[k]}<input class="num" type="number" step="any" data-g="${k}" value="${db.s[k]}"></label>`
      )
      .join('')
}
render()
