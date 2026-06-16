/* ===================================================================
   calculadora_pm.js — lógica da Calculadora de Salário da PM
   Vinculado pelo HTML via <script src="calculadora_pm.js"></script>
   Contém: (1) guarda de sessão (gate de login)
           (2) helper de triênios pela data de praça
           (3) cálculo principal (Remuneração Básica/Bruta e descontos)
   =================================================================== */

// ===== (1) Guarda de sessão (gate de login) — via URL =====
// A permissão vem na URL (?acesso=ok), então funciona no duplo clique (file://),
// sem depender de sessionStorage.
// ATENÇÃO: NÃO é segurança real — quem digitar 'calculadora_pmerj.html?acesso=ok'
// entra direto. Trava apenas o acesso casual.
// if (new URLSearchParams(window.location.search).get('acesso') !== 'ok') {
//   window.location.href = 'login.html';
// }

// // // Botão "Sair": volta ao login (injetado via JS).
// // document.addEventListener('DOMContentLoaded', function () {
// //   const sair = document.createElement('button');
// //   sair.type = 'button';
// //   sair.textContent = 'Sair';
// //   sair.className = 'cen-btn';
// //   sair.style.cssText = 'position:fixed; top:16px; right:16px; width:auto; ' +
// //     'padding:8px 16px; z-index:1000; background:#fff;';
// //   sair.addEventListener('click', function () {
// //     window.location.href = 'login.html'; // sai: volta ao login (sem o token)
// //   });
// //   document.body.appendChild(sair);
// // });

// ===== Relatório em PDF (biblioteca jsPDF, carregada sob demanda) =====

// Carrega a jsPDF de um CDN só quando o usuário pede o relatório.
// Precisa de internet na primeira vez (depois o navegador guarda em cache).
function carregarJsPDF(callback) {
  if (window.jspdf && window.jspdf.jsPDF) { callback(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = callback;
  s.onerror = function () {
    alert('Não foi possível carregar a biblioteca de PDF.\nVerifique a conexão com a internet e tente de novo.');
  };
  document.head.appendChild(s);
}

// Lê o texto de um elemento pelo id (troca espaço fixo por espaço normal).
function txtRel(id) {
  const el = document.getElementById(id);
  return el ? el.textContent.replace(/\u00A0/g, ' ').trim() : '—';
}

// Lê o texto da opção selecionada de um <select>.
function selRel(id) {
  const el = document.getElementById(id);
  if (!el || !el.selectedOptions || !el.selectedOptions[0]) return '—';
  return el.selectedOptions[0].textContent.trim();
}

// Monta e baixa o PDF com os valores atuais da simulação.
function gerarRelatorioPDF() {
  carregarJsPDF(function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const M = 48;       // margem esquerda
    const DIR = 547;    // margem direita (A4 = 595pt)
    let y = 56;

    // ---- cabeçalho ----
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('Polícia Militar do Estado do RJ', M, y); y += 20;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text('Simulação de Remuneração — relatório', M, y); y += 16;
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text('Gerado em ' + new Date().toLocaleString('pt-BR'), M, y);
    doc.setTextColor(0); y += 22;
    doc.setDrawColor(200); doc.line(M, y, DIR, y); y += 24;

    // helper de linha "rótulo .......... valor"
    function linha(rotulo, valor, opts) {
      opts = opts || {};
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(opts.big ? 12 : 10);
      doc.text(rotulo, M, y);
      doc.text(valor, DIR, y, { align: 'right' });
      y += opts.big ? 20 : 16;
    }
    function titulo(t) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(t, M, y); y += 18;
    }

    // ---- parâmetros ----
    titulo('Parâmetros');
    const depEl = document.getElementById('dependentes');
    linha('Posto / Graduação', selRel('posto'));
    linha('Habilitação', selRel('habilitacao'));
    linha('Triênio', selRel('trienio'));
    linha('Dependentes', depEl ? (depEl.value || '0') : '0');
    y += 8;

    // ---- composição ----
    titulo('Composição da remuneração');
    linha('Soldo', txtRel('t-soldo'));
    linha('GRET', txtRel('t-gret'));
    linha('GHP (Habilitação)', txtRel('t-ghp'));
    linha('GRAM (Risco)', txtRel('t-gram'));
    linha('Triênios', txtRel('t-trienio'));
    linha('Remuneração Básica', txtRel('t-rem-basica'), { bold: true });
    y += 6;
    linha('Outras Vantagens', txtRel('t-vant'));
    linha('Verbas Indenizatórias', txtRel('t-vind'));
    linha('Remuneração Bruta', txtRel('t-rem-bruta'), { bold: true });
    y += 8; doc.setDrawColor(220); doc.line(M, y, DIR, y); y += 18;

    // ---- descontos ----
    titulo('Descontos');
    linha('Contribuição Militar', txtRel('t-contrib'));
    linha('Descontos Discricionários', txtRel('t-desc-disc'));
    linha('Imposto de Renda (IRRF)', txtRel('t-irrf'));
    linha('Pensões', txtRel('t-pensao'));
    y += 8; doc.setDrawColor(120); doc.line(M, y, DIR, y); y += 22;

    // ---- líquido ----
    linha('Remuneração Líquida', txtRel('t-liquido'), { bold: true, big: true });

    // ---- rodapé ----
    y += 28;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120);
    doc.text('Estimativa para conferência. Não substitui o contracheque oficial.', M, y);
    doc.setTextColor(0);

    doc.save('relatorio-simulacao-pm.pdf');
  });
}

// Botões "Gerar relatório (PDF)" e "Limpar" — injetados no card do contracheque.
document.addEventListener('DOMContentLoaded', function () {
  const liq = document.getElementById('t-liquido');
  const alvo = (liq && liq.closest('.card')) || document.body;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-top:16px; text-align:center;';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cen-btn';
  btn.textContent = 'Gerar relatório (PDF)';
  btn.addEventListener('click', gerarRelatorioPDF);
  wrap.appendChild(btn);

  // "Limpar": reinicia a simulação. Recarregar a página é o jeito mais simples
  // e seguro de zerar tudo (campos fixos + campos dinâmicos). O ?acesso=ok
  // permanece na URL, então o gate continua liberado.
  const btnLimpar = document.createElement('button');
  btnLimpar.type = 'button';
  btnLimpar.className = 'cen-btn';
  btnLimpar.textContent = 'Limpar';
  btnLimpar.style.marginLeft = '10px';
  btnLimpar.addEventListener('click', function () {
    window.location.reload();
  });
  wrap.appendChild(btnLimpar);

  alvo.appendChild(wrap);
});

// Move o card de reajustes para logo ACIMA do quadro "breakdown".
document.addEventListener('DOMContentLoaded', function () {
  const reaj = document.getElementById('reajuste');
  const reajCard = reaj ? reaj.closest('.card') : null;
  const bdTable = document.querySelector('table.breakdown');
  const bdCard = bdTable ? bdTable.closest('.card') : null;
  if (reajCard && bdCard && bdCard.parentNode) {
    reajCard.style.gridColumn = '1 / -1'; // ocupa a largura toda, se estiver num grid
    reajCard.style.marginBottom = '0';
    bdCard.parentNode.insertBefore(reajCard, bdCard);
  }
});

// ===== Helper: contagem de triênios pela data de praça =====
document.addEventListener('DOMContentLoaded', function () {
  const MS_DIA = 24 * 60 * 60 * 1000;
  const DIAS_TRIENIO = 1095; // 3 anos, sem considerar bissextos

  const inputData = document.getElementById('data-praca');
  const btn = document.getElementById('btn-trienios');
  const elCount = document.getElementById('trienios-count');
  const elPct = document.getElementById('trienios-pct');

  // Guarda de depuração: avisa no console se algum id não existir
  if (!inputData || !btn || !elCount || !elPct) {
    console.error('Helper de triênios: elemento não encontrado. Confira os id ' +
      'data-praca, btn-trienios, trienios-count, trienios-pct.', {
        inputData: !!inputData, btn: !!btn, elCount: !!elCount, elPct: !!elPct
      });
    return;
  }

  // PROVISÓRIO (a confirmar): 1º triênio = 10%, +5% por triênio, teto 60%
  function percentualSugerido(trienios) {
    if (trienios <= 0) return 0;
    return Math.min(60, 5 + 5 * trienios);
  }

  function calcularTrienios() {
    const valor = inputData.value;
    if (!valor) { elCount.textContent = '—'; elPct.textContent = '—'; return; }

    const dataPraca = new Date(valor + 'T00:00:00');
    const hoje = new Date();
    const dias = Math.floor((hoje - dataPraca) / MS_DIA);

    if (!Number.isFinite(dias) || dias < 0) {
      elCount.textContent = '0'; elPct.textContent = '0%'; return;
    }

    const trienios = Math.floor(dias / DIAS_TRIENIO);
    elCount.textContent = trienios + (trienios === 1 ? ' triênio' : ' triênios');
    elPct.textContent = percentualSugerido(trienios) + '%';
  }

  btn.addEventListener('click', calcularTrienios);
});


// ===== Linhas novas no breakdown: Dif-Posto/Grad, GEE e FUSPOM =====
document.addEventListener('DOMContentLoaded', function () {
  function makeRow(cls, labelHtml, valId, valCls) {
    const tr = document.createElement('tr');
    if (cls) { tr.className = cls; if (cls.indexOf('comp-row') >= 0) tr.style.display = 'none'; }
    const td1 = document.createElement('td');
    td1.className = 'lbl-cell';
    td1.innerHTML = labelHtml;
    const td2 = document.createElement('td');
    if (valCls) td2.className = valCls;
    td2.id = valId;
    td2.innerHTML = (valCls === 'neg' ? '\u2212 R$\u00A00,00' : '+ R$\u00A00,00');
    tr.appendChild(td1);
    tr.appendChild(td2);
    return tr;
  }
  function rowOf(id) { const el = document.getElementById(id); return el ? el.closest('tr') : null; }

  const soldoRow = rowOf('t-soldo');
  if (soldoRow && !document.getElementById('t-dif')) {
    soldoRow.parentNode.insertBefore(makeRow('comp-row', 'Dif-Posto/Grad', 't-dif', 'pos'), soldoRow.nextSibling);
  }
  const trienioRow = rowOf('t-trienio');
  if (trienioRow && !document.getElementById('t-gee')) {
    trienioRow.parentNode.insertBefore(makeRow('comp-row', 'GEE — Encargos Especiais (60%)', 't-gee', 'pos'), trienioRow.nextSibling);
  }
  const contribRow = rowOf('t-contrib');
  if (contribRow && !document.getElementById('t-fuspom')) {
    contribRow.parentNode.insertBefore(
      makeRow('', '(\u2212) FUSPOM (<span id="t-fuspom-p">0</span>%) <span class="badge-aux">fundo de saúde · sobre o soldo</span>', 't-fuspom', 'neg'),
      contribRow.nextSibling);
  }
});

// ===== Controle Dif-Posto/Grad: checkbox + seletor de posto substituto (acima do atual) =====
document.addEventListener('DOMContentLoaded', function () {
  const posto = document.getElementById('posto');
  if (!posto) return;
  const fieldPosto = posto.closest('.field') || posto.parentNode;

  const box = document.createElement('div');
  box.style.cssText = 'margin-top:10px;';
  box.innerHTML =
    '<label for="dif-chk" style="display:flex;align-items:center;gap:10px;font-weight:700;cursor:pointer;margin:0;">' +
      '<input type="checkbox" id="dif-chk"> Diferença de Posto ou Graduação (Dif-Posto/Grad.)' +
    '</label>' +
    '<div id="dif-wrap" style="display:none;margin-top:8px;">' +
      '<label for="dif-posto" style="font-weight:600;display:block;margin-bottom:4px;">Posto/Graduação substituto (acima do atual)</label>' +
      '<select id="dif-posto"></select>' +
      '<div class="hint" style="margin-top:6px;">A diferença de soldo entra na base de todas as gratificações e na Remuneração Básica.</div>' +
    '</div>';
  fieldPosto.parentNode.insertBefore(box, fieldPosto.nextSibling);

  const chk = document.getElementById('dif-chk');
  const wrap = document.getElementById('dif-wrap');
  const selDif = document.getElementById('dif-posto');

  function popularSubstitutos() {
    const idx = posto.selectedIndex;
    const anterior = selDif.value;
    selDif.innerHTML = '';
    for (let i = 0; i < idx; i++) {                 // índices menores = postos acima
      const o = posto.options[i];
      const op = document.createElement('option');
      op.value = o.value;
      op.textContent = o.textContent.trim();
      selDif.appendChild(op);
    }
    const semAcima = selDif.options.length === 0;   // ex.: Cel PM (nada acima)
    chk.disabled = semAcima;
    if (semAcima) { chk.checked = false; wrap.style.display = 'none'; }
    if (anterior) {
      for (let i = 0; i < selDif.options.length; i++) {
        if (selDif.options[i].value === anterior) { selDif.selectedIndex = i; break; }
      }
    }
  }
  function recalcular() { posto.dispatchEvent(new Event('change')); }

  chk.addEventListener('change', function () {
    wrap.style.display = chk.checked ? 'block' : 'none';
    recalcular();
  });
  selDif.addEventListener('change', recalcular);
  posto.addEventListener('change', popularSubstitutos);

  popularSubstitutos();
});

// ===== GEE (Encargos Especiais) — só para Coronel, no card de reajuste =====
document.addEventListener('DOMContentLoaded', function () {
  const posto = document.getElementById('posto');
  const reaj = document.getElementById('reajuste');
  const reajCard = reaj ? reaj.closest('.card') : null;
  if (!posto || !reajCard) return;

  const box = document.createElement('div');
  box.id = 'gee-wrap';
  box.style.cssText = 'display:none;margin-top:12px;padding-top:12px;border-top:1px solid #e7eef6;';
  box.innerHTML =
    '<label for="gee-chk" style="display:flex;align-items:center;gap:10px;font-weight:700;cursor:pointer;margin:0;">' +
      '<input type="checkbox" id="gee-chk"> Gratificação de Encargos Especiais — GEE (E-12/790/1994)' +
    '</label>' +
    '<div class="hint" style="margin-top:6px;">Exclusiva de Coronel. Vale 60% de (Soldo + Dif-Posto/Grad + GRET + GHP + GRAM) e integra a Remuneração Básica.</div>';
  reajCard.appendChild(box);

  const chk = document.getElementById('gee-chk');
  function atualizar() {
    const ehCel = posto.options[posto.selectedIndex].textContent.trim() === 'Cel PM';
    box.style.display = ehCel ? 'block' : 'none';
    if (!ehCel && chk.checked) chk.checked = false;
  }
  chk.addEventListener('change', function () { posto.dispatchEvent(new Event('change')); });
  posto.addEventListener('change', atualizar);
  atualizar();
});

// ===== Cálculo principal (em construção) =====
// Etapa atual: Remuneração Básica = Soldo + GRET + GHP + GRAM + Triênio
document.addEventListener('DOMContentLoaded', function () {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const selPosto = document.getElementById('posto');
  const selHab   = document.getElementById('habilitacao');
  const selTri   = document.getElementById('trienio');
  const selFus   = document.getElementById('fuspom');
  const listaVant = document.getElementById('vant-lista');
  const btnAddVant = document.getElementById('btn-add-vant');
  const listaVind = document.getElementById('vind-lista');
  const btnAddVind = document.getElementById('btn-add-vind');
  const selDep   = document.getElementById('dependentes');
  const listaDesc = document.getElementById('desc-disc-lista');
  const btnAddDesc = document.getElementById('btn-add-desc');
  const listaPensao = document.getElementById('pensao-lista');
  const btnAddPensao = document.getElementById('btn-add-pensao');
  const elDescDiscMax = document.getElementById('desc-disc-max');
  const elDescDiscAviso = document.getElementById('desc-disc-aviso');
  const chkReaj  = document.getElementById('reajuste');
  const chkReaj2 = document.getElementById('reajuste2');
  const chkIsencaoGram = document.getElementById('isencao-gram');

  if (!selPosto || !selHab || !selTri) {
    console.error('Cálculo: elemento não encontrado. Confira os id posto, habilitacao, trienio.');
    return;
  }

  const REAJUSTE1_PCT = 5.62; // 1º reajuste
  const REAJUSTE2_PCT = 5.62; // 2º reajuste, sobre o soldo já reajustado pelo 1º
  const CONTRIB_MIL_PCT = 10.5; // Contribuição Militar (previdência) sobre a Rem. Básica
  const DED_DEP = 189.59; // dedução por dependente no IR
  const MAX_DESCONTOS = 5; // limite de campos discricionários
  const MAX_VANT = 5; // limite de campos de outras vantagens
  const MAX_VIND = 5; // limite de campos de verbas indenizatórias
  const MAX_PENSAO = 5; // limite de campos de pensão

  // escreve em um elemento só se ele existir (robusto durante a construção)
  function set(id, texto) { const el = document.getElementById(id); if (el) el.textContent = texto; }
  // formata percentual no padrão pt-BR (192.5 -> "192,5")
  function pct(n) { return String(n).replace('.', ','); }

  // ---- IRPF 2026 ----
  const DESC_SIMPL = 607.20; // desconto simplificado mensal (substitui Contrib. Militar + dependentes, se maior)
  const faixas = [
    { ate: 2428.80,  aliq: 0,     ded: 0 },
    { ate: 2826.65,  aliq: 0.075, ded: 182.16 },
    { ate: 3751.05,  aliq: 0.15,  ded: 394.16 },
    { ate: 4664.68,  aliq: 0.225, ded: 675.49 },
    { ate: Infinity, aliq: 0.275, ded: 908.73 }
  ];
  function irTabela(base) {
    for (const f of faixas) if (base <= f.ate) return Math.max(0, base * f.aliq - f.ded);
    return 0;
  }
  // redutor 2026: incide sobre o RENDIMENTO TRIBUTÁVEL
  function redutorIR(rendTrib, ir) {
    if (rendTrib <= 5000) return ir;     // reduz tudo -> imposto zero
    if (rendTrib >= 7350) return 0;      // sem redução
    return Math.max(0, Math.min(ir, 978.62 - 0.133145 * rendTrib));
  }

  // habilita/desabilita o botão "Adicionar" conforme o limite de campos
  function atualizarBtnAdd() {
    if (!listaDesc || !btnAddDesc) return;
    const cheio = listaDesc.children.length >= MAX_DESCONTOS;
    btnAddDesc.disabled = cheio;
    btnAddDesc.style.opacity = cheio ? '0.5' : '1';
    btnAddDesc.textContent = cheio ? 'Limite de 5 descontos atingido' : '+ Adicionar desconto';
  }

  // cria um novo campo de desconto discricionário (se não estourar o limite)
  function criarCampoDesc() {
    if (!listaDesc || listaDesc.children.length >= MAX_DESCONTOS) return;
    const item = document.createElement('div');
    item.className = 'field desc-disc-item';
    item.style.cssText = 'display:flex; gap:8px; align-items:center;';
    item.innerHTML =
      '<div class="money-row" style="flex:1;">' +
        '<span class="money-prefix">R$</span>' +
        '<input type="number" class="desc-disc-input" value="0" min="0" step="0.01" inputmode="decimal" style="color: var(--vermelho);">' +
      '</div>' +
      '<button type="button" class="cen-btn desc-disc-rem" style="width:auto; padding:9px 12px;" title="Remover">×</button>';
    listaDesc.appendChild(item);
    atualizarBtnAdd();
  }

  // habilita/desabilita o botão de adicionar pensão conforme o limite
  function atualizarBtnAddPensao() {
    if (!listaPensao || !btnAddPensao) return;
    const cheio = listaPensao.children.length >= MAX_PENSAO;
    btnAddPensao.disabled = cheio;
    btnAddPensao.style.opacity = cheio ? '0.5' : '1';
    btnAddPensao.textContent = cheio ? 'Limite de 5 pensões atingido' : '+ Adicionar pensão';
  }

  // cria um novo campo de pensão (valor em vermelho), se não estourar o limite
  function criarCampoPensao() {
    if (!listaPensao || listaPensao.children.length >= MAX_PENSAO) return;
    const item = document.createElement('div');
    item.className = 'field pensao-item';
    item.style.cssText = 'display:flex; gap:8px; align-items:center;';
    item.innerHTML =
      '<div class="money-row" style="flex:1;">' +
        '<span class="money-prefix">R$</span>' +
        '<input type="number" class="pensao-input" value="0" min="0" step="0.01" inputmode="decimal" style="color: var(--vermelho);">' +
      '</div>' +
      '<button type="button" class="cen-btn pensao-rem" style="width:auto; padding:9px 12px;" title="Remover">×</button>';
    listaPensao.appendChild(item);
    atualizarBtnAddPensao();
  }

  // habilita/desabilita o botão de adicionar vantagem conforme o limite
  function atualizarBtnAddVant() {
    if (!listaVant || !btnAddVant) return;
    const cheio = listaVant.children.length >= MAX_VANT;
    btnAddVant.disabled = cheio;
    btnAddVant.style.opacity = cheio ? '0.5' : '1';
    btnAddVant.textContent = cheio ? 'Limite de 5 vantagens atingido' : '+ Adicionar vantagem';
  }

  // cria um novo campo de vantagem (nome + valor), se não estourar o limite
  function criarCampoVant() {
    if (!listaVant || listaVant.children.length >= MAX_VANT) return;
    const item = document.createElement('div');
    item.className = 'field vant-item';
    item.style.cssText = 'display:flex; gap:8px; align-items:center;';
    item.innerHTML =
      '<input type="text" class="vant-nome" placeholder="Nome do vencimento" ' +
        'style="flex:1; padding:10px 12px; border:1.5px solid var(--borda); border-radius:10px; ' +
        'font-size:14px; font-family:inherit; color:var(--texto); background:#fff;">' +
      '<div class="money-row" style="flex:0 0 130px;">' +
        '<span class="money-prefix">R$</span>' +
        '<input type="number" class="vant-valor" value="0" min="0" step="0.01" inputmode="decimal">' +
      '</div>' +
      '<button type="button" class="cen-btn vant-rem" style="width:auto; padding:9px 12px;" title="Remover">×</button>';
    listaVant.appendChild(item);
    atualizarBtnAddVant();
  }

  // habilita/desabilita o botão de adicionar verba indenizatória conforme o limite
  function atualizarBtnAddVind() {
    if (!listaVind || !btnAddVind) return;
    const cheio = listaVind.children.length >= MAX_VIND;
    btnAddVind.disabled = cheio;
    btnAddVind.style.opacity = cheio ? '0.5' : '1';
    btnAddVind.textContent = cheio ? 'Limite de 5 verbas atingido' : '+ Adicionar verba';
  }

  // cria um novo campo de verba indenizatória (nome + valor), se não estourar o limite
  function criarCampoVind() {
    if (!listaVind || listaVind.children.length >= MAX_VIND) return;
    const item = document.createElement('div');
    item.className = 'field vind-item';
    item.style.cssText = 'display:flex; gap:8px; align-items:center;';
    item.innerHTML =
      '<input type="text" class="vind-nome" placeholder="Ex.: Aux. Transporte" ' +
        'style="flex:1; padding:10px 12px; border:1.5px solid var(--borda); border-radius:10px; ' +
        'font-size:14px; font-family:inherit; color:var(--texto); background:#fff;">' +
      '<div class="money-row" style="flex:0 0 130px;">' +
        '<span class="money-prefix">R$</span>' +
        '<input type="number" class="vind-valor" value="0" min="0" step="0.01" inputmode="decimal">' +
      '</div>' +
      '<button type="button" class="cen-btn vind-rem" style="width:auto; padding:9px 12px;" title="Remover">×</button>';
    listaVind.appendChild(item);
    atualizarBtnAddVind();
  }

  function calcular() {
    const opt = selPosto.options[selPosto.selectedIndex];
    let fator = 1;                                          // reajustes compostos
    if (chkReaj  && chkReaj.checked)  fator *= 1 + REAJUSTE1_PCT / 100;
    if (chkReaj2 && chkReaj2.checked) fator *= 1 + REAJUSTE2_PCT / 100;
    const soldo   = (parseFloat(opt.value) || 0) * fator;  // value do #posto (× reajustes)
    const gretPct = parseFloat(opt.dataset.gret) || 0;     // data-gret do #posto
    const ghpPct  = parseFloat(selHab.value) || 0;         // value do #habilitacao
    const triPct  = parseFloat(selTri.value) || 0;         // value do #trienio
    const fusPct  = selFus ? (parseFloat(selFus.value) || 0) : 0; // value do #fuspom

    // Dif-Posto/Grad: diferença para o soldo de um posto ACIMA (escolhido pelo usuário).
    // Quando ativa, entra na base de TODAS as gratificações que incidem sobre o soldo.
    const difChk = document.getElementById('dif-chk');
    const selDif = document.getElementById('dif-posto');
    let dif = 0;
    if (difChk && difChk.checked && selDif && selDif.value) {
      dif = ((parseFloat(selDif.value) || 0) - (parseFloat(opt.value) || 0)) * fator;
      if (dif < 0) dif = 0; // proteção: substituto nunca abaixo do posto atual
    }
    const base = soldo + dif; // base das gratificações = soldo + Dif-Posto/Grad

    const gret    = base * gretPct / 100;
    const ghp     = base * ghpPct / 100;
    const gram    = 0.625 * (base + gret + ghp);
    const trienio = (triPct / 100) * (base + gret + ghp + gram);

    // GEE — Gratificação de Encargos Especiais (exclusiva de Coronel): 60% de
    // (Soldo + Dif + GRET + GHP + GRAM). Integra a Remuneração Básica.
    const geeChk = document.getElementById('gee-chk');
    const ehCel  = opt.textContent.trim() === 'Cel PM';
    const gee    = (ehCel && geeChk && geeChk.checked) ? 0.60 * (base + gret + ghp + gram) : 0;

    const remBasica = base + gret + ghp + gram + trienio + gee;

    // outras vantagens remuneratórias (TRIBUTÁVEIS, somadas -> Rem. Bruta); agrupadas
    let totalVant = 0;
    if (listaVant) {
      listaVant.querySelectorAll('.vant-valor').forEach(function (inp) {
        totalVant += parseFloat(String(inp.value).replace(',', '.')) || 0;
      });
    }

    // verbas indenizatórias (NÃO tributáveis): entram na Rem. Bruta, saem do Rend. Tributável
    let totalVind = 0;
    if (listaVind) {
      listaVind.querySelectorAll('.vind-valor').forEach(function (inp) {
        totalVind += parseFloat(String(inp.value).replace(',', '.')) || 0;
      });
    }

    const remBruta = remBasica + totalVant + totalVind;

    // dependentes (IR)
    const dep = selDep ? (parseInt(selDep.value, 10) || 0) : 0;

    // descontos
    const contribMil = remBasica * CONTRIB_MIL_PCT / 100;  // Contribuição Militar (previdência)
    const fuspom     = soldo * fusPct / 100;               // FUSPOM (somente sobre o soldo)

    // descontos discricionários: soma dos campos, limitada a 40% da Rem. Básica
    const capDisc = 0.40 * remBasica;
    let somaDisc = 0;
    if (listaDesc) {
      listaDesc.querySelectorAll('.desc-disc-input').forEach(function (inp) {
        somaDisc += parseFloat(String(inp.value).replace(',', '.')) || 0;
      });
    }
    const descDisc = Math.min(Math.max(somaDisc, 0), capDisc);
    if (elDescDiscMax)   elDescDiscMax.textContent = fmt.format(capDisc);
    if (elDescDiscAviso) elDescDiscAviso.style.display = (somaDisc > capDisc) ? 'block' : 'none';

    // pensões (desconto): soma dos campos. Reduz o líquido E abate da base do IR.
    let pensao = 0;
    if (listaPensao) {
      listaPensao.querySelectorAll('.pensao-input').forEach(function (inp) {
        pensao += parseFloat(String(inp.value).replace(',', '.')) || 0;
      });
    }

    // Rendimento Tributável (só para o redutor) = Rem. Bruta − Verbas Indenizatórias − (189,59 × dep) − FUSPOM
    const rendTrib = Math.max(0, remBruta - totalVind - dep * DED_DEP - fuspom);

    // IRPF (simulação)
    // Base de Cálculo = Rem. Bruta − Verbas Indenizatórias − [Contrib. Militar + dependentes OU 607,20 (o maior)] − FUSPOM − Pensão(0)
    const dedDep   = dep * DED_DEP;
    const parLegal = contribMil + dedDep;                       // Contrib. Militar + dependentes
    const parUsado = (parLegal < DESC_SIMPL) ? DESC_SIMPL : parLegal; // desconto simplificado se for maior
    // isenção da GRAM no IR: se marcada, abate a GRAM da base de cálculo (não mexe no Rend. Tributável)
    const abateGram = (chkIsencaoGram && chkIsencaoGram.checked) ? gram : 0;
    const baseIR   = Math.max(0, remBruta - totalVind - parUsado - fuspom - pensao - abateGram);
    const irBruto  = irTabela(baseIR);
    const reducao  = redutorIR(rendTrib, irBruto);
    const irrf     = Math.max(0, irBruto - reducao);

    // Remuneração Líquida = Rem. Bruta − todos os descontos
    const totalDescontos = contribMil + fuspom + descDisc + irrf + pensao;
    const liquido = remBruta - totalDescontos;

    // marcadores (.big-num)
    set('r-rem-bruta', fmt.format(remBruta));
    set('r-desc', fmt.format(totalDescontos));
    set('r-liquido', fmt.format(liquido));

    // detalhamento (table.breakdown)
    set('t-soldo', fmt.format(soldo));
    set('t-dif', '+ ' + fmt.format(dif));
    set('t-gret-p', pct(gretPct));
    set('t-gret', '+ ' + fmt.format(gret));
    set('t-ghp-p', pct(ghpPct));
    set('t-ghp', '+ ' + fmt.format(ghp));
    set('t-gram', '+ ' + fmt.format(gram));
    set('t-tri-p', pct(triPct));
    set('t-trienio', '+ ' + fmt.format(trienio));
    set('t-gee', '+ ' + fmt.format(gee));
    set('t-rem-basica', fmt.format(remBasica));
    set('t-vant', '+ ' + fmt.format(totalVant));
    set('t-vind', '+ ' + fmt.format(totalVind));
    set('t-rem-bruta', fmt.format(remBruta));
    set('t-contrib', '− ' + fmt.format(contribMil));
    set('t-fuspom-p', pct(fusPct));
    set('t-fuspom', '− ' + fmt.format(fuspom));
    set('t-desc-disc', '− ' + fmt.format(descDisc));
    set('t-irrf', '− ' + fmt.format(irrf));
    set('t-pensao', '− ' + fmt.format(pensao));
    set('t-liquido', fmt.format(liquido));
  }

  selPosto.addEventListener('change', calcular);
  selHab.addEventListener('change', calcular);
  selTri.addEventListener('change', calcular);
  if (selFus) selFus.addEventListener('change', calcular);
  if (selDep) selDep.addEventListener('input', calcular);

  // verbas indenizatórias: adicionar / digitar valor / remover
  if (btnAddVind) btnAddVind.addEventListener('click', function () { criarCampoVind(); calcular(); });
  if (listaVind) {
    listaVind.addEventListener('input', function (e) {
      if (e.target && e.target.classList.contains('vind-valor')) calcular();
    });
    listaVind.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('vind-rem')) {
        const item = e.target.closest('.vind-item');
        if (item) item.remove();
        atualizarBtnAddVind();
        calcular();
      }
    });
  }
  atualizarBtnAddVind();

  // outras vantagens: adicionar / digitar valor / remover
  if (btnAddVant) btnAddVant.addEventListener('click', function () { criarCampoVant(); calcular(); });
  if (listaVant) {
    listaVant.addEventListener('input', function (e) {
      if (e.target && e.target.classList.contains('vant-valor')) calcular();
    });
    listaVant.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('vant-rem')) {
        const item = e.target.closest('.vant-item');
        if (item) item.remove();
        atualizarBtnAddVant();
        calcular();
      }
    });
  }
  atualizarBtnAddVant();

  // descontos discricionários: adicionar / digitar / remover
  if (btnAddDesc) btnAddDesc.addEventListener('click', function () { criarCampoDesc(); calcular(); });
  if (listaDesc) {
    listaDesc.addEventListener('input', function (e) {
      if (e.target && e.target.classList.contains('desc-disc-input')) calcular();
    });
    listaDesc.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('desc-disc-rem')) {
        const item = e.target.closest('.desc-disc-item');
        if (item) item.remove();
        atualizarBtnAdd();
        calcular();
      }
    });
  }
  atualizarBtnAdd();

  // pensões: adicionar / digitar / remover
  if (btnAddPensao) btnAddPensao.addEventListener('click', function () { criarCampoPensao(); calcular(); });
  if (listaPensao) {
    listaPensao.addEventListener('input', function (e) {
      if (e.target && e.target.classList.contains('pensao-input')) calcular();
    });
    listaPensao.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('pensao-rem')) {
        const item = e.target.closest('.pensao-item');
        if (item) item.remove();
        atualizarBtnAddPensao();
        calcular();
      }
    });
  }
  atualizarBtnAddPensao();

  if (chkReaj) chkReaj.addEventListener('change', function () {
    // 2º reajuste só fica disponível com o 1º ligado
    if (chkReaj2) {
      chkReaj2.disabled = !chkReaj.checked;
      if (!chkReaj.checked) chkReaj2.checked = false;
    }
    calcular();
  });
  if (chkReaj2) chkReaj2.addEventListener('change', calcular);
  if (chkIsencaoGram) chkIsencaoGram.addEventListener('change', calcular);

  // toggle: mostrar/esconder a composição da Remuneração Básica (efeito tipo <details>)
  const compToggle = document.getElementById('comp-toggle');
  const compArrow = document.getElementById('comp-arrow');
  if (compToggle) {
    compToggle.addEventListener('click', function () {
      const rows = document.querySelectorAll('.comp-row');
      const escondido = rows.length > 0 && rows[0].style.display === 'none';
      rows.forEach(function (r) { r.style.display = escondido ? '' : 'none'; });
      if (compArrow) compArrow.textContent = escondido ? '▾' : '▸';
    });
  }

  calcular(); // cálculo inicial com os valores padrão
});
