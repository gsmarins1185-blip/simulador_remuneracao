
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
  const elDescDiscMax = document.getElementById('desc-disc-max');
  const elDescDiscAviso = document.getElementById('desc-disc-aviso');
  const chkReaj  = document.getElementById('reajuste');
  const chkReaj2 = document.getElementById('reajuste2');
  const elRemBasica = document.getElementById('r-rem-basica');
 
  if (!selPosto || !selHab || !selTri || !elRemBasica) {
    console.error('Cálculo: elemento não encontrado. Confira os id ' +
      'posto, habilitacao, trienio, r-rem-basica.');
    return;
  }
 
  const REAJUSTE1_PCT = 5.62; // 1º reajuste
  const REAJUSTE2_PCT = 5.62; // 2º reajuste, sobre o soldo já reajustado pelo 1º
  const CONTRIB_MIL_PCT = 10.5; // Contribuição Militar (previdência) sobre a Rem. Básica
  const DED_DEP = 189.59; // dedução por dependente no IR
  const MAX_DESCONTOS = 5; // limite de campos discricionários
  const MAX_VANT = 5; // limite de campos de outras vantagens
  const MAX_VIND = 5; // limite de campos de verbas indenizatórias
 
  // escreve em um elemento só se ele existir (robusto durante a construção)
  function set(id, texto) { const el = document.getElementById(id); if (el) el.textContent = texto; }
  // formata percentual no padrão pt-BR (192.5 -> "192,5")
  function pct(n) { return String(n).replace('.', ','); }
 
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
        '<input type="number" class="desc-disc-input" value="0" min="0" step="0.01" inputmode="decimal">' +
      '</div>' +
      '<button type="button" class="cen-btn desc-disc-rem" style="width:auto; padding:9px 12px;" title="Remover">×</button>';
    listaDesc.appendChild(item);
    atualizarBtnAdd();
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
 
    const gret    = soldo * gretPct / 100;
    const ghp     = soldo * ghpPct / 100;
    const gram    = 0.625 * (soldo + gret + ghp);
    const trienio = (triPct / 100) * (soldo + gret + ghp + gram);
 
    const remBasica = soldo + gret + ghp + gram + trienio;
 
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
 
    // Rendimento Tributável = Rem. Bruta − Verbas Indenizatórias − (189,59 × dependentes) − FUSPOM
    // (pensão entra aqui quando for criada)
    const rendTrib = Math.max(0, remBruta - totalVind - dep * DED_DEP - fuspom);
 
    // marcador (.big-num)
    elRemBasica.textContent = fmt.format(remBasica);
 
    // detalhamento (table.breakdown)
    set('t-soldo', fmt.format(soldo));
    set('t-gret-p', pct(gretPct));
    set('t-gret', '+ ' + fmt.format(gret));
    set('t-ghp-p', pct(ghpPct));
    set('t-ghp', '+ ' + fmt.format(ghp));
    set('t-gram', '+ ' + fmt.format(gram));
    set('t-tri-p', pct(triPct));
    set('t-trienio', '+ ' + fmt.format(trienio));
    set('t-rem-basica', fmt.format(remBasica));
    set('t-vant', '+ ' + fmt.format(totalVant));
    set('t-vind', '+ ' + fmt.format(totalVind));
    set('t-rem-bruta', fmt.format(remBruta));
    set('t-contrib', '− ' + fmt.format(contribMil));
    set('t-fuspom-p', pct(fusPct));
    set('t-fuspom', '− ' + fmt.format(fuspom));
    set('t-desc-disc', '− ' + fmt.format(descDisc));
    set('t-rend-trib', fmt.format(rendTrib));
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
 
  if (chkReaj) chkReaj.addEventListener('change', function () {
    // 2º reajuste só fica disponível com o 1º ligado
    if (chkReaj2) {
      chkReaj2.disabled = !chkReaj.checked;
      if (!chkReaj.checked) chkReaj2.checked = false;
    }
    calcular();
  });
  if (chkReaj2) chkReaj2.addEventListener('change', calcular);
 
  calcular(); // cálculo inicial com os valores padrão
});