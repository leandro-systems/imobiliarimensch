(function(){
  "use strict";

  /* ===================== DATA LAYER ===================== */
  var STORAGE_KEY = "mensch_properties_v1";
  var SESSION_KEY = "mensch_admin_session";
  var ADMIN_USER = "admin";
  var ADMIN_PASS = "mensch1978";

  var placeholderSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><circle cx="12" cy="13" r="3"/></svg>';

  // ===== FIREBASE — BANCO DE DADOS EM TEMPO REAL (mesmo projeto do ImóvelPrime, caminho separado) =====
  var FB_URL = 'https://imovelprime-b1a4e-default-rtdb.firebaseio.com';
  var FB_PATH = 'imoveis_mensch';
  var properties = []; // cache local dos imóveis carregados do Firebase

  function seedData(){
    return [
      {id:"p1", titulo:"Casa 3 dormitórios no Centro", descricao:"Ampla casa térrea com acabamento de qualidade, próxima ao comércio central, quintal com churrasqueira e garagem para dois carros.", tipo:"Casa", finalidade:"Venda", preco:320000, cidade:"Centro, Independência - RS", quartos:3, vagas:2, area:180, status:"Ativo", destaque:true, fotos:[], curtidas:8, visualizacoes:34},
      {id:"p2", titulo:"Terreno plano em condomínio fechado", descricao:"Terreno de esquina, todo murado no entorno, pronto para construir, em condomínio com segurança 24h.", tipo:"Terreno", finalidade:"Venda", preco:95000, cidade:"Bairro Progresso, Independência - RS", quartos:0, vagas:0, area:360, status:"Ativo", destaque:false, fotos:[], curtidas:3, visualizacoes:19},
      {id:"p3", titulo:"Sítio com área de lavoura e mata nativa", descricao:"Propriedade rural com 8 hectares, casa sede reformada, açude e boa infraestrutura para produção.", tipo:"Sítio/Área Rural", finalidade:"Venda", preco:680000, cidade:"Interior, Independência - RS", quartos:2, vagas:3, area:80000, status:"Ativo", destaque:true, fotos:[], curtidas:12, visualizacoes:47},
      {id:"p4", titulo:"Apartamento para locação, mobiliado", descricao:"Apartamento compacto e bem localizado, ideal para estudantes ou profissionais, próximo ao centro.", tipo:"Casa", finalidade:"Locação", preco:1200, cidade:"Centro, Independência - RS", quartos:1, vagas:1, area:52, status:"Ativo", destaque:false, fotos:[], curtidas:5, visualizacoes:22},
      {id:"p5", titulo:"Sala comercial em avenida movimentada", descricao:"Excelente ponto comercial com grande fluxo de pessoas, ideal para loja ou escritório.", tipo:"Comercial", finalidade:"Locação", preco:2500, cidade:"Av. Central, Independência - RS", quartos:0, vagas:1, area:65, status:"Ativo", destaque:false, fotos:[], curtidas:2, visualizacoes:14},
      {id:"p6", titulo:"Casa de alvenaria com pomar", descricao:"Casa aconchegante com amplo terreno, pomar de frutas e espaço para horta, em rua tranquila.", tipo:"Casa", finalidade:"Venda", preco:245000, cidade:"Bairro São José, Independência - RS", quartos:2, vagas:1, area:140, status:"Vendido", destaque:false, fotos:[], curtidas:6, visualizacoes:28}
    ];
  }

  // Busca os imóveis no Firebase; se offline, cai para o backup salvo no localStorage
  async function loadData(){
    try{
      var resp = await fetch(FB_URL + '/' + FB_PATH + '.json');
      var data = await resp.json();
      if(data){
        properties = Object.values(data);
      }else{
        properties = [];
      }
    }catch(e){
      try{
        var raw = localStorage.getItem(STORAGE_KEY);
        properties = raw ? JSON.parse(raw) : [];
      }catch(e2){ properties = []; }
    }
    // Primeira vez (banco vazio): popula com os imóveis de exemplo
    if(properties.length === 0){
      properties = seedData();
      await saveData();
    }
  }

  // Salva a lista inteira de imóveis no Firebase (mesmo padrão do ImóvelPrime), com backup local
  async function saveData(){
    try{
      var obj = {};
      properties.forEach(function(p){ obj[p.id] = p; });
      await fetch(FB_URL + '/' + FB_PATH + '.json', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(obj)
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    }catch(e){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    }
  }

  // Remove um imóvel específico direto no Firebase
  async function deleteFromDB(id){
    try{
      await fetch(FB_URL + '/' + FB_PATH + '/' + id + '.json', {method: 'DELETE'});
    }catch(e){}
  }

  // Mantém compatibilidade com o resto do código: lê sempre do cache já carregado
  function getProperties(){
    return properties;
  }
  function saveProperties(list){
    properties = list;
    saveData(); // salva no Firebase em segundo plano
  }
  function fmtBRL(v){
    return v.toLocaleString('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0});
  }

  /* ===================== LEGAL SERVICES GRID ===================== */
  var legalServices = [
    {title:"Usucapião (Urbano e Rural)", text:"Regularizamos a posse do seu imóvel junto ao cartório, garantindo a propriedade legal após anos de posse mansa e pacífica."},
    {title:"Averbação na Matrícula", text:"Atualizamos a matrícula do imóvel após construções, reformas ou alterações estruturais, evitando problemas futuros."},
    {title:"Regularização em Inventários", text:"Assessoria completa para transferência de imóveis em processos de inventário, com segurança para todos os herdeiros."},
    {title:"Desmembramento e Unificação de Lotes", text:"Dividimos ou unificamos lotes conforme sua necessidade, cuidando de toda a documentação junto aos órgãos competentes."},
    {title:"Escritas, Contratos e Regularização Fundiária", text:"Elaboramos e revisamos escrituras e contratos, e conduzimos processos de regularização fundiária com total transparência."},
    {title:"Extinção de Condomínio", text:"Conduzimos o processo de divisão de imóveis em condomínio entre os proprietários, judicial ou amigavelmente, com segurança jurídica."},
    {title:"Retificação de Área e Registro", text:"Corrigimos divergências de medidas, confrontações ou descrições na matrícula do imóvel junto ao cartório de registro."},
    {title:"Adjudicação Compulsória", text:"Buscamos o reconhecimento judicial e extrajudicial da propriedade para quem já pagou pelo imóvel mas não conseguiu a escritura definitiva."}
  ];
  function renderLegalGrid(){
    var grid = document.getElementById('legal-grid');
    grid.innerHTML = legalServices.map(function(s){
      return '<div class="legal-card">'+
        '<div class="seal seal-sm"><div class="ring-outer"></div><div class="ring-dashed"></div><div class="seal-core"><span class="since">Selo</span><span class="year" style="font-size:.62rem;">Legal</span></div></div>'+
        '<h4>'+s.title+'</h4>'+
        '<p>'+s.text+'</p>'+
        '<a class="btn btn-navy btn-sm" href="https://wa.me/5555991665593?text='+encodeURIComponent('Olá! Gostaria de solicitar uma consulta técnica sobre: '+s.title)+'" target="_blank" rel="noopener">Solicitar Consulta Técnica</a>'+
      '</div>';
    }).join('');
  }

  /* ===================== PROPERTY RENDERING (PUBLIC) ===================== */
  function specsRow(p){
    var out = '<div class="property-specs">';
    if(p.tipo !== "Terreno"){
      out += '<span>🛏 '+(p.quartos||0)+' qts</span><span>🚗 '+(p.vagas||0)+' vagas</span>';
    }
    out += '<span>📐 '+ (p.area||0).toLocaleString('pt-BR') +' m²</span></div>';
    return out;
  }
  function photoBlock(p, heightClass){
    if(p.fotos && p.fotos.length){
      return '<img src="'+p.fotos[0]+'" alt="'+p.titulo+'">';
    }
    return placeholderSVG;
  }
  function tagsBlock(p){
    var t = '<div class="tag-row">';
    t += '<span class="tag '+(p.finalidade==="Locação"?"tag-locacao":"tag-venda")+'">'+p.finalidade+'</span>';
    if(p.destaque) t += '<span class="tag tag-destaque">Destaque</span>';
    t += '</div>';
    return t;
  }
  function priceDisplay(p){
    return p.finalidade === "Locação" ? fmtBRL(p.preco)+' / mês' : fmtBRL(p.preco);
  }

  function renderPropertyGrid(){
    var all = getProperties().filter(function(p){ return p.status !== "Vendido" && p.status !== "Alugado" || true; });
    var list = getProperties().filter(function(p){ return true; });

    var search = document.getElementById('f-search').value.trim().toLowerCase();
    var tipo = document.getElementById('f-tipo').value;
    var finalidade = document.getElementById('f-finalidade').value;
    var precoRange = document.getElementById('f-preco').value;

    var filtered = list.filter(function(p){
      if(p.status === "Vendido" || p.status === "Alugado") return false;
      if(search && !((p.titulo+' '+p.cidade).toLowerCase().indexOf(search) > -1)) return false;
      if(tipo && p.tipo !== tipo) return false;
      if(finalidade && p.finalidade !== finalidade) return false;
      if(precoRange){
        var parts = precoRange.split('-');
        var min = parseFloat(parts[0]), max = parseFloat(parts[1]);
        if(p.preco < min || p.preco > max) return false;
      }
      return true;
    });

    var grid = document.getElementById('property-grid');
    document.getElementById('results-count').textContent = filtered.length + (filtered.length===1 ? ' imóvel encontrado' : ' imóveis encontrados');

    if(!filtered.length){
      grid.innerHTML = '<div class="empty-state"><h4>Nenhum imóvel encontrado</h4><p>Tente ajustar os filtros ou fale diretamente com nossa equipe.</p></div>';
      return;
    }

    grid.innerHTML = filtered.map(function(p){
      var waMsg = encodeURIComponent('Olá! Tenho interesse no imóvel: '+p.titulo+' ('+p.cidade+').');
      var liked = isLiked(p.id);
      return '<div class="property-card">'+
        '<div class="property-photo">'+tagsBlock(p)+photoBlock(p)+'</div>'+
        '<div class="property-body">'+
          '<h4>'+p.titulo+'</h4>'+
          '<div class="property-loc">📍 '+p.cidade+'</div>'+
          '<div class="property-price">'+priceDisplay(p)+'</div>'+
          specsRow(p)+
          '<div class="property-engagement">'+
            '<button class="like-btn'+(liked?' liked':'')+'" onclick="event.stopPropagation();MenschApp.toggleLike(\''+p.id+'\', this)" aria-label="Curtir imóvel">'+
              '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.9C19.5 16.4 12 21 12 21z"/></svg>'+
              '<span class="like-count">'+(p.curtidas||0)+'</span>'+
            '</button>'+
            '<span class="views-count">'+
              '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'+
              (p.visualizacoes||0)+' visualizações'+
            '</span>'+
          '</div>'+
          '<div class="property-actions">'+
            '<button class="btn btn-outline" style="color:var(--navy-950);border-color:var(--gray-300);" onclick="MenschApp.openModal(\''+p.id+'\')">Ver Detalhes</button>'+
            '<a class="btn btn-whatsapp" href="https://wa.me/5555991665593?text='+waMsg+'" target="_blank" rel="noopener">Tenho Interesse</a>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  /* ===================== CURTIDAS (LIKES) ===================== */
  var LIKES_KEY = 'mensch_likes';
  function getLikesMap(){
    try{ return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}'); }catch(e){ return {}; }
  }
  function isLiked(id){
    return !!getLikesMap()[id];
  }
  function toggleLike(id, btn){
    var p = getProperties().find(function(x){ return x.id === id; });
    if(!p) return;
    var likes = getLikesMap();
    if(likes[id]){
      delete likes[id];
      p.curtidas = Math.max(0, (p.curtidas||1) - 1);
      if(btn) btn.classList.remove('liked');
    }else{
      likes[id] = true;
      p.curtidas = (p.curtidas||0) + 1;
      if(btn){
        btn.classList.add('liked');
        btn.style.transform = 'scale(1.25)';
        setTimeout(function(){ btn.style.transform = ''; }, 180);
      }
    }
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
    if(btn){
      var countEl = btn.querySelector('.like-count');
      if(countEl) countEl.textContent = p.curtidas || 0;
    }
    saveData();
  }

  function openModal(id){
    var p = getProperties().find(function(x){ return x.id === id; });
    if(!p) return;
    p.visualizacoes = (p.visualizacoes||0) + 1;
    saveData();
    var liked = isLiked(p.id);
    var waMsg = encodeURIComponent('Olá! Tenho interesse no imóvel: '+p.titulo+' ('+p.cidade+').');
    document.getElementById('modal-box').innerHTML =
      '<div class="modal-photo">'+photoBlock(p)+
        '<button class="modal-close" onclick="MenschApp.closeModal()">✕</button>'+
      '</div>'+
      '<div class="modal-content">'+
        '<span class="eyebrow" style="margin-bottom:6px;">'+p.tipo+' · '+p.finalidade+'</span>'+
        '<h3>'+p.titulo+'</h3>'+
        '<div class="property-loc">📍 '+p.cidade+'</div>'+
        '<div class="property-price">'+priceDisplay(p)+'</div>'+
        specsRow(p)+
        '<div class="property-engagement">'+
          '<button class="like-btn'+(liked?' liked':'')+'" onclick="MenschApp.toggleLike(\''+p.id+'\', this)" aria-label="Curtir imóvel">'+
            '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.4C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.9C19.5 16.4 12 21 12 21z"/></svg>'+
            '<span class="like-count">'+(p.curtidas||0)+'</span>'+
          '</button>'+
          '<span class="views-count">'+
            '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'+
            (p.visualizacoes||0)+' visualizações'+
          '</span>'+
        '</div>'+
        '<p class="modal-desc">'+(p.descricao || 'Fale com nossa equipe para mais detalhes sobre este imóvel.')+'</p>'+
        '<a class="btn btn-whatsapp btn-block" href="https://wa.me/5555991665593?text='+waMsg+'" target="_blank" rel="noopener">Tenho Interesse (WhatsApp)</a>'+
      '</div>';
    document.getElementById('modal-overlay').classList.add('open');
  }
  function closeModal(){
    document.getElementById('modal-overlay').classList.remove('open');
  }
  document.getElementById('modal-overlay').addEventListener('click', function(e){
    if(e.target === this) closeModal();
  });

  /* ===================== FILTERS ===================== */
  ['f-search','f-tipo','f-finalidade','f-preco'].forEach(function(id){
    document.getElementById(id).addEventListener('input', renderPropertyGrid);
    document.getElementById(id).addEventListener('change', renderPropertyGrid);
  });
  document.getElementById('btn-clear-filters').addEventListener('click', function(){
    document.getElementById('f-search').value='';
    document.getElementById('f-tipo').value='';
    document.getElementById('f-finalidade').value='';
    document.getElementById('f-preco').value='';
    renderPropertyGrid();
  });

  /* ===================== ROUTING (public vs admin) ===================== */
  var publicView = document.getElementById('public-view');
  var adminView = document.getElementById('admin-view');
  var adminLoginWrap = document.getElementById('admin-login-wrap');
  var adminDashboard = document.getElementById('admin-dashboard');

  function isLoggedIn(){ return sessionStorage.getItem(SESSION_KEY) === "1"; }

  function showAdmin(){
    publicView.classList.add('hidden');
    adminView.classList.add('open');
    if(isLoggedIn()){
      adminLoginWrap.style.display = 'none';
      adminDashboard.style.display = 'block';
      renderAdminTable();
    }else{
      adminLoginWrap.style.display = 'flex';
      adminDashboard.style.display = 'none';
    }
  }
  function showPublic(){
    publicView.classList.remove('hidden');
    adminView.classList.remove('open');
  }
  function routeFromHash(){
    if(window.location.hash === '#admin'){
      showAdmin();
    }else{
      showPublic();
    }
  }
  window.addEventListener('hashchange', routeFromHash);
  document.getElementById('link-back-site').addEventListener('click', function(e){
    e.preventDefault();
    window.location.hash = 'home';
  });

  /* ===================== LOGIN ===================== */
  document.getElementById('login-form').addEventListener('submit', function(e){
    e.preventDefault();
    var u = document.getElementById('login-user').value.trim();
    var p = document.getElementById('login-pass').value;
    var err = document.getElementById('login-error');
    if(u === ADMIN_USER && p === ADMIN_PASS){
      sessionStorage.setItem(SESSION_KEY, "1");
      err.style.display = 'none';
      adminLoginWrap.style.display = 'none';
      adminDashboard.style.display = 'block';
      renderAdminTable();
    }else{
      err.style.display = 'block';
    }
  });
  document.getElementById('btn-logout').addEventListener('click', function(){
    sessionStorage.removeItem(SESSION_KEY);
    window.location.hash = 'home';
  });

  /* ===================== ADMIN TABS ===================== */
  var tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('tab-cadastro').style.display = tab.dataset.tab === 'cadastro' ? 'block' : 'none';
      document.getElementById('tab-listagem').style.display = tab.dataset.tab === 'listagem' ? 'block' : 'none';
      if(tab.dataset.tab === 'listagem') renderAdminTable();
    });
  });

  /* ===================== ADMIN: PHOTO UPLOAD (multi, max 10) ===================== */
  var MAX_PHOTOS = 10;
  var currentPhotos = [];
  var uploadZone = document.getElementById('upload-zone');
  var uploadInput = document.getElementById('p-fotos');
  var uploadPreview = document.getElementById('upload-preview');
  var photoCountLabel = document.getElementById('photo-count-label');
  uploadZone.addEventListener('click', function(){
    if(currentPhotos.length >= MAX_PHOTOS){
      alert('Você já atingiu o limite de ' + MAX_PHOTOS + ' fotos para este imóvel. Remova alguma foto para adicionar outra.');
      return;
    }
    uploadInput.click();
  });
  uploadInput.addEventListener('change', function(e){
    var files = Array.prototype.slice.call(e.target.files);
    if(!files.length) return;
    var slotsLeft = MAX_PHOTOS - currentPhotos.length;
    if(slotsLeft <= 0){
      alert('Limite de ' + MAX_PHOTOS + ' fotos atingido. Remova alguma foto para adicionar outra.');
      uploadInput.value = '';
      return;
    }
    if(files.length > slotsLeft){
      alert('Você selecionou ' + files.length + ' fotos, mas só ' + slotsLeft + ' vaga(s) restante(s) até o limite de ' + MAX_PHOTOS + '. Serão adicionadas as primeiras ' + slotsLeft + '.');
      files = files.slice(0, slotsLeft);
    }
    files.forEach(function(file){
      var reader = new FileReader();
      reader.onload = function(ev){
        currentPhotos.push(ev.target.result);
        renderUploadPreview();
      };
      reader.readAsDataURL(file);
    });
    uploadInput.value = '';
  });
  function renderUploadPreview(){
    uploadPreview.innerHTML = currentPhotos.map(function(src, i){
      return '<div style="position:relative;"><img src="'+src+'"><button type="button" onclick="MenschApp.removePhoto('+i+')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#B03A2E;color:#fff;font-size:.65rem;border:2px solid #fff;">✕</button></div>';
    }).join('');
    if(photoCountLabel) photoCountLabel.textContent = '(' + currentPhotos.length + '/' + MAX_PHOTOS + ')';
    if(uploadZone){
      if(currentPhotos.length >= MAX_PHOTOS){
        uploadZone.style.opacity = '.5';
        uploadZone.style.cursor = 'not-allowed';
      }else{
        uploadZone.style.opacity = '1';
        uploadZone.style.cursor = 'pointer';
      }
    }
  }
  function removePhoto(i){
    currentPhotos.splice(i,1);
    renderUploadPreview();
  }

  /* ===================== ADMIN: PROPERTY FORM (CRUD) ===================== */
  var propertyForm = document.getElementById('property-form');
  function resetForm(){
    propertyForm.reset();
    document.getElementById('p-id').value = '';
    currentPhotos = [];
    renderUploadPreview();
    document.getElementById('form-title').textContent = 'Cadastrar Novo Imóvel';
    document.getElementById('btn-save-property').textContent = 'Salvar Imóvel';
  }
  document.getElementById('btn-cancel-edit').addEventListener('click', resetForm);

  propertyForm.addEventListener('submit', function(e){
    e.preventDefault();
    var list = getProperties();
    var id = document.getElementById('p-id').value;
    var data = {
      id: id || ('p' + Date.now()),
      titulo: document.getElementById('p-titulo').value.trim(),
      descricao: document.getElementById('p-descricao').value.trim(),
      tipo: document.getElementById('p-tipo').value,
      finalidade: document.getElementById('p-finalidade').value,
      preco: parseFloat(document.getElementById('p-preco').value) || 0,
      cidade: document.getElementById('p-cidade').value.trim(),
      quartos: parseInt(document.getElementById('p-quartos').value) || 0,
      vagas: parseInt(document.getElementById('p-vagas').value) || 0,
      area: parseFloat(document.getElementById('p-area').value) || 0,
      status: document.getElementById('p-status').value,
      destaque: false,
      fotos: currentPhotos.slice()
    };
    if(id){
      var existing = list.find(function(p){ return p.id === id; });
      if(existing) data.destaque = existing.destaque;
      list = list.map(function(p){ return p.id === id ? data : p; });
    }else{
      list.push(data);
    }
    saveProperties(list);
    resetForm();
    renderAdminTable();
    renderPropertyGrid();
    tabs.forEach(function(t){ t.classList.remove('active'); });
    document.querySelector('.admin-tab[data-tab="listagem"]').classList.add('active');
    document.getElementById('tab-cadastro').style.display = 'none';
    document.getElementById('tab-listagem').style.display = 'block';
  });

  function editProperty(id){
    var p = getProperties().find(function(x){ return x.id === id; });
    if(!p) return;
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-titulo').value = p.titulo;
    document.getElementById('p-descricao').value = p.descricao || '';
    document.getElementById('p-tipo').value = p.tipo;
    document.getElementById('p-finalidade').value = p.finalidade;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-cidade').value = p.cidade;
    document.getElementById('p-quartos').value = p.quartos;
    document.getElementById('p-vagas').value = p.vagas;
    document.getElementById('p-area').value = p.area;
    document.getElementById('p-status').value = p.status;
    currentPhotos = (p.fotos || []).slice();
    renderUploadPreview();
    document.getElementById('form-title').textContent = 'Editar Imóvel';
    document.getElementById('btn-save-property').textContent = 'Atualizar Imóvel';
    tabs.forEach(function(t){ t.classList.remove('active'); });
    document.querySelector('.admin-tab[data-tab="cadastro"]').classList.add('active');
    document.getElementById('tab-listagem').style.display = 'none';
    document.getElementById('tab-cadastro').style.display = 'block';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function deleteProperty(id){
    if(!confirm('Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.')) return;
    var list = getProperties().filter(function(p){ return p.id !== id; });
    saveProperties(list);
    deleteFromDB(id);
    renderAdminTable();
    renderPropertyGrid();
  }

  function statusClass(s){
    if(s === 'Vendido') return 'status-vendido';
    if(s === 'Alugado') return 'status-alugado';
    return 'status-ativo';
  }

  function renderAdminTable(){
    var list = getProperties();
    var body = document.getElementById('admin-table-body');
    var empty = document.getElementById('admin-table-empty');
    if(!list.length){
      body.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    body.innerHTML = list.map(function(p){
      var thumb = (p.fotos && p.fotos.length) ? p.fotos[0] : '';
      return '<tr>'+
        '<td>'+(thumb ? '<img class="thumb" src="'+thumb+'">' : '<div class="thumb" style="display:flex;align-items:center;justify-content:center;color:#aaa;">—</div>')+'</td>'+
        '<td>'+p.titulo+'</td>'+
        '<td>'+p.tipo+'</td>'+
        '<td>'+p.cidade+'</td>'+
        '<td>'+fmtBRL(p.preco)+'</td>'+
        '<td><span class="status-badge '+statusClass(p.status)+'">'+p.status+'</span></td>'+
        '<td style="text-align:center;">❤️ '+(p.curtidas||0)+'</td>'+
        '<td style="text-align:center;">👁 '+(p.visualizacoes||0)+'</td>'+
        '<td><div class="row-actions">'+
          '<button class="icon-btn" title="Editar" onclick="MenschApp.editProperty(\''+p.id+'\')">✎</button>'+
          '<button class="icon-btn danger" title="Excluir" onclick="MenschApp.deleteProperty(\''+p.id+'\')">🗑</button>'+
        '</div></td>'+
      '</tr>';
    }).join('');
  }

  /* ===================== INIT ===================== */
  document.getElementById('year-now').textContent = new Date().getFullYear();
  renderLegalGrid();
  routeFromHash();

  (async function init(){
    var countEl = document.getElementById('results-count');
    if(countEl) countEl.textContent = 'Carregando imóveis...';
    await loadData();
    renderPropertyGrid();
    if(isLoggedIn()) renderAdminTable();
  })();

  window.MenschApp = {
    openModal: openModal,
    closeModal: closeModal,
    editProperty: editProperty,
    deleteProperty: deleteProperty,
    removePhoto: removePhoto,
    toggleLike: toggleLike
  };
})();
