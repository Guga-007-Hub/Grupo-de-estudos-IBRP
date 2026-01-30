// =================== Sistema de Notificações Toast ===================
const Toast = {
  container: null,
  
  init() {
    this.container = document.getElementById('toast-container');
  },
  
  show(message, type = 'info', title = '') {
    if (!this.container) this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    const titles = {
      success: title || 'Sucesso!',
      error: title || 'Erro!',
      warning: title || 'Atenção!',
      info: title || 'Informação'
    };
    
    toast.innerHTML = `
      ${icons[type]}
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Fechar">&times;</button>
      <div class="toast-progress"></div>
    `;
    
    this.container.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Botão de fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));
    
    // Auto-remover após 5 segundos
    setTimeout(() => this.remove(toast), 5000);
  },
  
  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  },
  
  success(message, title) {
    this.show(message, 'success', title);
  },
  
  error(message, title) {
    this.show(message, 'error', title);
  },
  
  warning(message, title) {
    this.show(message, 'warning', title);
  },
  
  info(message, title) {
    this.show(message, 'info', title);
  }
};

// Inicializar Toast
Toast.init();

// =================== Sistema de Modal ===================
const Modal = {
  overlay: null,
  resolveCallback: null,
  
  init() {
    this.overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    // Fechar ao clicar no overlay
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close(false);
    });
    
    // Botão X
    closeBtn.addEventListener('click', () => this.close(false));
    
    // Botão Cancelar
    cancelBtn.addEventListener('click', () => this.close(false));
    
    // Botão Confirmar
    confirmBtn.addEventListener('click', () => this.close(true));
    
    // ESC para fechar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close(false);
      }
    });
  },
  
  show(title, message, options = {}) {
    if (!this.overlay) this.init();
    
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-message').textContent = message;
      
      const confirmBtn = document.getElementById('modal-confirm');
      const cancelBtn = document.getElementById('modal-cancel');
      
      // Configurar texto dos botões
      confirmBtn.textContent = options.confirmText || 'Confirmar';
      cancelBtn.textContent = options.cancelText || 'Cancelar';
      
      // Configurar estilo do botão de confirmação
      confirmBtn.className = 'btn ' + (options.danger ? 'btn-danger' : 'btn-primary');
      
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  },
  
  close(result) {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    if (this.resolveCallback) {
      this.resolveCallback(result);
      this.resolveCallback = null;
    }
  },
  
  async confirm(title, message, options = {}) {
    return await this.show(title, message, options);
  }
};

// Inicializar Modal
Modal.init();

// =================== Storage ===================
const STORAGE_KEY = "grupo_estudo_v1";

function load() {
  const base = {
    books: [],
    currentBookId: null,
    events: []
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw);
    return {
      books: Array.isArray(parsed.books) ? parsed.books : [],
      currentBookId: parsed.currentBookId ?? null,
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return base;
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();

// =================== Helpers ===================
function id() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function bookById(bookId) {
  return state.books.find(b => b.id === bookId) || null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function attendanceStatsByBookSeparated(bookId) {
  const membrosMap = new Map();
  const visitantesMap = new Map();

  const events = state.events.filter(e => e.bookId === bookId);

  events.forEach(e => {
    const att = Array.isArray(e.attendance) ? e.attendance : [];

    att.forEach(p => {
      const cleanName = (p.name || "").trim();
      if (!cleanName) return;

      const key = cleanName.toLowerCase();
      const target = p.isVisitor ? visitantesMap : membrosMap;

      if (!target.has(key)) {
        target.set(key, { name: cleanName, count: 1 });
      } else {
        target.get(key).count += 1;
      }
    });
  });

  const membros = Array.from(membrosMap.values()).sort((a, b) => b.count - a.count);
  const visitantes = Array.from(visitantesMap.values()).sort((a, b) => b.count - a.count);

  return { membros, visitantes };
}

// =================== Selectors ===================
const formLivro = document.querySelector("#form-livro");
const livroNome = document.querySelector("#livro-nome");
const livroAtualSelect = document.querySelector("#livro-atual");
const livroAtualInfo = document.querySelector("#livro-atual-info");
const listaLivros = document.querySelector("#lista-livros");

const formEvento = document.querySelector("#form-evento");
const eventoData = document.querySelector("#evento-data");
const eventoCapitulos = document.querySelector("#evento-capitulos");
const eventoTemas = document.querySelector("#evento-temas");

const presencaNome = document.querySelector("#presenca-nome");
const presencaVisitante = document.querySelector("#presenca-visitante");
const btnAddPresenca = document.querySelector("#btn-add-presenca");
const listaPresencaTemp = document.querySelector("#lista-presenca-temp");

const listaEventos = document.querySelector("#lista-eventos");

const btnSalvarEvento = document.querySelector("#btn-salvar-evento");
const btnCancelarEdicao = document.querySelector("#btn-cancelar-edicao");

const btnExport = document.querySelector("#btn-export");
const btnImport = document.querySelector("#btn-import");
const fileImport = document.querySelector("#file-import");
const btnClear = document.querySelector("#btn-clear");

// =================== Estado de edição ===================
let attendanceTemp = [];
let editingEventId = null;

function startEdit(eventId) {
  const ev = state.events.find(e => e.id === eventId);
  if (!ev) {
    Toast.error("Evento não encontrado.");
    return;
  }

  editingEventId = ev.id;

  state.currentBookId = ev.bookId;
  save(state);

  eventoData.value = ev.date || "";
  eventoCapitulos.value = ev.chaptersText || "";
  eventoTemas.value = ev.themes || "";

  attendanceTemp = Array.isArray(ev.attendance) ? ev.attendance.map(p => ({ ...p })) : [];
  renderAttendanceTemp();

  btnSalvarEvento.textContent = "Atualizar evento";
  btnCancelarEdicao.style.display = "inline-flex";

  formEvento.scrollIntoView({ behavior: "smooth", block: "start" });
  Toast.info("Modo de edição ativado. Modifique os campos e clique em 'Atualizar evento'.");
}

function cancelEdit() {
  editingEventId = null;

  eventoData.value = "";
  eventoCapitulos.value = "";
  eventoTemas.value = "";

  attendanceTemp = [];
  renderAttendanceTemp();

  btnSalvarEvento.textContent = "Salvar evento";
  btnCancelarEdicao.style.display = "none";
  
  Toast.info("Edição cancelada.");
}

btnCancelarEdicao.addEventListener("click", () => {
  cancelEdit();
});

// =================== Render Livros ===================
function renderBooks() {
  listaLivros.innerHTML = "";

  if (state.books.length === 0) {
    listaLivros.innerHTML = `
      <li class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <p>Nenhum livro cadastrado ainda.<br>Adicione o primeiro livro acima.</p>
      </li>
    `;
  } else {
    state.books.forEach(b => {
      const li = document.createElement("li");
      li.className = "list-item";

      const { membros, visitantes } = attendanceStatsByBookSeparated(b.id);
      const isCurrentBook = state.currentBookId === b.id;

      li.innerHTML = `
        <div class="item-header">
          <div>
            <div class="item-title">${b.name}</div>
            ${isCurrentBook ? '<span class="badge badge-primary">✓ Livro Atual</span>' : ''}
          </div>
          <div class="item-actions">
            ${!isCurrentBook ? `<button class="btn btn-secondary btn-set-current" data-id="${b.id}">Definir como atual</button>` : ''}
            <button class="btn btn-danger btn-remove-book" data-id="${b.id}">Remover</button>
          </div>
        </div>
        <div class="item-content">
          <div class="item-row">
            <span class="item-label">👥 Membros:</span>
            <span>${membros.length ? membros.map(m => `${m.name} (${m.count})`).join(", ") : "Nenhum registro"}</span>
          </div>
          <div class="item-row">
            <span class="item-label">👤 Visitantes:</span>
            <span>${visitantes.length ? visitantes.map(v => `${v.name} (${v.count})`).join(", ") : "Nenhum registro"}</span>
          </div>
        </div>
      `;

      listaLivros.appendChild(li);
    });

    // Event listeners para botões
    document.querySelectorAll('.btn-set-current').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookId = btn.dataset.id;
        state.currentBookId = bookId;
        save(state);
        renderAll();
        const book = bookById(bookId);
        Toast.success(`"${book.name}" definido como livro atual.`);
      });
    });

    document.querySelectorAll('.btn-remove-book').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookId = btn.dataset.id;
        const book = bookById(bookId);
        
        const confirmed = await Modal.confirm(
          'Remover livro',
          `Tem certeza que deseja remover o livro "${book.name}"? Todos os eventos relacionados também serão removidos.`,
          { danger: true, confirmText: 'Remover' }
        );
        
        if (confirmed) {
          state.books = state.books.filter(x => x.id !== bookId);

          if (state.currentBookId === bookId) state.currentBookId = null;

          const removedEventIds = state.events.filter(e => e.bookId === bookId).map(e => e.id);
          state.events = state.events.filter(e => e.bookId !== bookId);

          if (editingEventId && removedEventIds.includes(editingEventId)) {
            cancelEdit();
          }

          save(state);
          renderAll();
          Toast.success(`Livro "${book.name}" removido com sucesso.`);
        }
      });
    });
  }

  // Select do livro atual
  livroAtualSelect.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "— Selecione um livro —";
  livroAtualSelect.appendChild(opt0);

  state.books.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (b.id === state.currentBookId) opt.selected = true;
    livroAtualSelect.appendChild(opt);
  });

  const atual = bookById(state.currentBookId);
  livroAtualInfo.textContent = atual ? `📖 ${atual.name}` : "Nenhum livro selecionado";
}

// =================== Render Presença Temporária ===================
function renderAttendanceTemp() {
  listaPresencaTemp.innerHTML = "";

  if (attendanceTemp.length === 0) {
    listaPresencaTemp.innerHTML = `
      <li class="empty-state" style="padding: 1rem;">
        <p style="font-size: 0.875rem; margin: 0;">Nenhuma pessoa adicionada ainda.</p>
      </li>
    `;
    return;
  }

  attendanceTemp.forEach((p, index) => {
    const li = document.createElement("li");
    li.className = "list-item";
    
    li.innerHTML = `
      <div class="item-header">
        <div class="item-title" style="font-size: 1rem;">
          ${p.isVisitor ? '👤' : '👥'} ${p.name}
          ${p.isVisitor ? '<span class="badge badge-warning">Visitante</span>' : '<span class="badge badge-primary">Membro</span>'}
        </div>
        <button class="btn btn-danger btn-remove-attendance" data-index="${index}">Remover</button>
      </div>
    `;

    listaPresencaTemp.appendChild(li);
  });

  // Event listeners para remover
  document.querySelectorAll('.btn-remove-attendance').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const person = attendanceTemp[index];
      attendanceTemp.splice(index, 1);
      renderAttendanceTemp();
      Toast.info(`${person.name} removido(a) da lista.`);
    });
  });
}

// =================== Render Eventos ===================
function renderEvents() {
  listaEventos.innerHTML = "";

  if (state.events.length === 0) {
    listaEventos.innerHTML = `
      <li class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Nenhum evento registrado ainda.<br>Crie seu primeiro evento acima.</p>
      </li>
    `;
    return;
  }

  // Ordenar eventos por data (mais recente primeiro)
  const sortedEvents = [...state.events].sort((a, b) => b.date.localeCompare(a.date));

  sortedEvents.forEach(e => {
    const book = bookById(e.bookId);
    const bookName = book ? book.name : "Livro desconhecido";
    const qtd = Array.isArray(e.attendance) ? e.attendance.length : 0;

    const li = document.createElement("li");
    li.className = "list-item";

    li.innerHTML = `
      <div class="item-header">
        <div>
          <div class="item-title">${formatDate(e.date)}</div>
          <span class="badge badge-info">${bookName}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary btn-edit-event" data-id="${e.id}">Editar</button>
          <button class="btn btn-danger btn-remove-event" data-id="${e.id}">Remover</button>
        </div>
      </div>
      <div class="item-content">
        <div class="item-row">
          <span class="item-label">📖 Capítulos:</span>
          <span>${e.chaptersText || "-"}</span>
        </div>
        <div class="item-row">
          <span class="item-label">💡 Temas:</span>
          <span>${e.themes || "-"}</span>
        </div>
        <div class="item-row">
          <span class="item-label">✅ Presença (${qtd}):</span>
          <span>${qtd ? e.attendance.map(p => `${p.isVisitor ? '👤' : '👥'} ${p.name}`).join(", ") : "-"}</span>
        </div>
      </div>
    `;

    listaEventos.appendChild(li);
  });

  // Event listeners
  document.querySelectorAll('.btn-edit-event').forEach(btn => {
    btn.addEventListener('click', () => {
      startEdit(btn.dataset.id);
    });
  });

  document.querySelectorAll('.btn-remove-event').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.id;
      const event = state.events.find(e => e.id === eventId);
      
      const confirmed = await Modal.confirm(
        'Remover evento',
        `Tem certeza que deseja remover o evento de ${formatDate(event.date)}?`,
        { danger: true, confirmText: 'Remover' }
      );
      
      if (confirmed) {
        state.events = state.events.filter(e => e.id !== eventId);

        if (editingEventId === eventId) {
          cancelEdit();
        }

        save(state);
        renderEvents();
        Toast.success("Evento removido com sucesso.");
      }
    });
  });
}

// =================== Event Listeners ===================

// 1) Adicionar livro
formLivro.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const name = livroNome.value.trim();
  
  if (!name) {
    Toast.warning("Digite o nome do livro.");
    livroNome.focus();
    return;
  }

  const exists = state.books.some(b => b.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    Toast.warning("Este livro já foi cadastrado.");
    return;
  }

  const book = { id: id(), name };
  state.books.push(book);

  if (!state.currentBookId) state.currentBookId = book.id;

  save(state);
  livroNome.value = "";
  livroNome.focus();
  renderAll();
  Toast.success(`Livro "${name}" adicionado com sucesso!`);
});

// 2) Selecionar livro atual
livroAtualSelect.addEventListener("change", () => {
  const val = livroAtualSelect.value || null;
  state.currentBookId = val;
  save(state);
  renderAll();
  
  if (val) {
    const book = bookById(val);
    Toast.success(`Livro atual alterado para "${book.name}".`);
  }
});

// 3) Adicionar pessoa na presença
btnAddPresenca.addEventListener("click", () => {
  const name = presencaNome.value.trim();
  
  if (!name) {
    Toast.warning("Digite um nome para adicionar à presença.");
    presencaNome.focus();
    return;
  }

  attendanceTemp.push({
    id: id(),
    name,
    isVisitor: presencaVisitante.checked
  });

  presencaNome.value = "";
  presencaVisitante.checked = false;
  presencaNome.focus();
  renderAttendanceTemp();
  Toast.success(`${name} adicionado(a) à lista!`);
});

// 4) Salvar/Atualizar evento
formEvento.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  if (!state.currentBookId) {
    Toast.error("Selecione um livro atual antes de criar o evento.");
    return;
  }

  const date = eventoData.value;
  const chaptersText = eventoCapitulos.value.trim();
  const themes = eventoTemas.value.trim();

  if (!date) {
    Toast.warning("Escolha uma data para o evento.");
    eventoData.focus();
    return;
  }
  
  if (!chaptersText) {
    Toast.warning("Preencha os capítulos estudados.");
    eventoCapitulos.focus();
    return;
  }
  
  if (attendanceTemp.length === 0) {
    Toast.warning("Adicione pelo menos uma pessoa na presença.");
    return;
  }

  if (editingEventId) {
    // Atualizar evento existente
    const idx = state.events.findIndex(e => e.id === editingEventId);
    if (idx < 0) {
      Toast.error("Evento em edição não foi encontrado.");
      return;
    }

    state.events[idx] = {
      ...state.events[idx],
      bookId: state.currentBookId,
      date,
      chaptersText,
      themes,
      attendance: [...attendanceTemp]
    };

    save(state);
    cancelEdit();
    renderAll();
    Toast.success("Evento atualizado com sucesso!");
    return;
  }

  // Criar novo evento
  const event = {
    id: id(),
    bookId: state.currentBookId,
    date,
    chaptersText,
    themes,
    attendance: [...attendanceTemp]
  };

  state.events.push(event);
  save(state);

  eventoData.value = "";
  eventoCapitulos.value = "";
  eventoTemas.value = "";
  attendanceTemp = [];
  
  renderAttendanceTemp();
  renderEvents();
  renderBooks();
  
  Toast.success("Evento criado com sucesso!");
});

// =================== Backup/Import ===================

function isValidBackup(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.books)) return false;
  if (!Array.isArray(obj.events)) return false;

  for (const b of obj.books) {
    if (!b || typeof b !== "object") return false;
    if (typeof b.id !== "string") return false;
    if (typeof b.name !== "string") return false;
  }

  for (const e of obj.events) {
    if (!e || typeof e !== "object") return false;
    if (typeof e.id !== "string") return false;
    if (typeof e.bookId !== "string") return false;
    if (typeof e.date !== "string") return false;
    if (typeof e.chaptersText !== "string") return false;
    if (typeof e.themes !== "string") return false;

    if (!Array.isArray(e.attendance)) return false;
    for (const p of e.attendance) {
      if (!p || typeof p !== "object") return false;
      if (typeof p.id !== "string") return false;
      if (typeof p.name !== "string") return false;
      if (typeof p.isVisitor !== "boolean") return false;
    }
  }

  if (!(obj.currentBookId === null || typeof obj.currentBookId === "string")) return false;

  return true;
}

function exportBackup() {
  const data = load();
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const stamp =
    now.getFullYear() +
    "-" + String(now.getMonth() + 1).padStart(2, "0") +
    "-" + String(now.getDate()).padStart(2, "0") +
    "_" + String(now.getHours()).padStart(2, "0") +
    "-" + String(now.getMinutes()).padStart(2, "0");

  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-grupo-estudo_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  Toast.success("Backup baixado com sucesso!");
}

async function importBackupFromFile(file) {
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const text = String(reader.result || "");
      const obj = JSON.parse(text);

      if (!isValidBackup(obj)) {
        Toast.error("Arquivo inválido. Certifique-se de que é um backup válido.");
        return;
      }

      const confirmed = await Modal.confirm(
        'Importar backup',
        'Importar um backup vai SUBSTITUIR todos os dados atuais. Esta ação não pode ser desfeita. Deseja continuar?',
        { danger: true, confirmText: 'Importar' }
      );
      
      if (!confirmed) return;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));

      if (editingEventId) cancelEdit();

      state = load();
      renderAll();

      Toast.success("Backup importado com sucesso!");
    } catch (err) {
      Toast.error("Erro ao importar: arquivo JSON inválido.");
    }
  };

  reader.readAsText(file);
}

async function clearAllData() {
  const confirmed = await Modal.confirm(
    'Limpar todos os dados',
    'Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.',
    { danger: true, confirmText: 'Limpar tudo' }
  );
  
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);

  if (editingEventId) cancelEdit();

  state = load();
  renderAll();
  
  Toast.success("Todos os dados foram removidos.");
}

btnExport.addEventListener("click", () => {
  exportBackup();
});

btnImport.addEventListener("click", () => {
  fileImport.value = "";
  fileImport.click();
});

fileImport.addEventListener("change", () => {
  const file = fileImport.files && fileImport.files[0];
  if (!file) return;
  importBackupFromFile(file);
});

btnClear.addEventListener("click", () => {
  clearAllData();
});

// =================== Render Geral ===================
function renderAll() {
  renderBooks();
  renderAttendanceTemp();
  renderEvents();

  btnSalvarEvento.textContent = editingEventId ? "Atualizar evento" : "Salvar evento";
  btnCancelarEdicao.style.display = editingEventId ? "inline-flex" : "none";
}

// =================== Inicialização ===================
renderAll();

// Define data de hoje como padrão
const today = new Date().toISOString().split('T')[0];
eventoData.value = today;

// Mensagem de boas-vindas
setTimeout(() => {
  Toast.info("Bem-vindo ao Grupo de Estudo! Configure seu primeiro livro para começar.");
}, 500);
