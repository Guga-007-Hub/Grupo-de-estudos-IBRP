// =================== Storage ===================
const STORAGE_KEY = "grupo_estudo_v1";

function load() {
  const base = {
    books: [],           // {id, name}
    currentBookId: null, // string
    events: []           // {id, bookId, date, chaptersText, themes, attendance: [{id,name,isVisitor}]}
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
  return Date.now().toString();
}

function bookById(bookId) {
  return state.books.find(b => b.id === bookId) || null;
}

// ✅ Separado: membros e visitantes (por livro)
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

// ✅ Botões do modo edição (do HTML novo)
const btnSalvarEvento = document.querySelector("#btn-salvar-evento");
const btnCancelarEdicao = document.querySelector("#btn-cancelar-edicao");

// ===== Backup/Import =====
const btnExport = document.querySelector("#btn-export");
const btnImport = document.querySelector("#btn-import");
const fileImport = document.querySelector("#file-import");
const btnClear = document.querySelector("#btn-clear");


// =================== Estado de edição ===================
let attendanceTemp = [];       // presença temporária do formulário
let editingEventId = null;     // quando não for null, estamos editando

function startEdit(eventId) {
  const ev = state.events.find(e => e.id === eventId);
  if (!ev) return alert("Evento não encontrado.");

  editingEventId = ev.id;

  // muda livro atual pra ser o do evento (pra não confundir)
  state.currentBookId = ev.bookId;
  save(state);

  // preenche form
  eventoData.value = ev.date || "";
  eventoCapitulos.value = ev.chaptersText || "";
  eventoTemas.value = ev.themes || "";

  // carrega presença do evento pra lista temporária
  attendanceTemp = Array.isArray(ev.attendance) ? ev.attendance.map(p => ({ ...p })) : [];
  renderAttendanceTemp();

  // UI de edição
  btnSalvarEvento.textContent = "Atualizar evento";
  btnCancelarEdicao.style.display = "inline-block";

  // rola até o formulário (opcional, ajuda UX)
  formEvento.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEdit() {
  editingEventId = null;

  // limpa o form de evento
  eventoData.value = "";
  eventoCapitulos.value = "";
  eventoTemas.value = "";

  attendanceTemp = [];
  renderAttendanceTemp();

  btnSalvarEvento.textContent = "Salvar evento";
  btnCancelarEdicao.style.display = "none";
}

// Botão cancelar
btnCancelarEdicao.addEventListener("click", () => {
  cancelEdit();
});

// =================== Render Livros ===================
function renderBooks() {
  listaLivros.innerHTML = "";

  if (state.books.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.textContent = "Nenhum livro cadastrado ainda.";
    listaLivros.appendChild(li);
  } else {
    state.books.forEach(b => {
      const li = document.createElement("li");
      li.className = "item";

      const topo = document.createElement("div");
      topo.className = "item-topo";

      const nome = document.createElement("strong");
      nome.textContent = b.name;

      const actions = document.createElement("div");

      const btnAtual = document.createElement("button");
      btnAtual.type = "button";
      btnAtual.className = "btn-sec";
      btnAtual.textContent = "Definir como atual";
      btnAtual.onclick = () => {
        state.currentBookId = b.id;
        save(state);
        renderAll();
      };

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn-del";
      btnDel.textContent = "Remover";
      btnDel.onclick = () => {
        state.books = state.books.filter(x => x.id !== b.id);

        if (state.currentBookId === b.id) state.currentBookId = null;

        // remove eventos desse livro
        const removedEventIds = state.events.filter(e => e.bookId === b.id).map(e => e.id);
        state.events = state.events.filter(e => e.bookId !== b.id);

        // se estava editando um evento desse livro, cancela
        if (editingEventId && removedEventIds.includes(editingEventId)) {
          cancelEdit();
        }

        save(state);
        renderAll();
      };

      actions.appendChild(btnAtual);
      actions.appendChild(btnDel);

      topo.appendChild(nome);
      topo.appendChild(actions);

      const atual = document.createElement("small");
      atual.textContent = (state.currentBookId === b.id) ? "✅ Livro atual" : "";

      // ✅ Estatística por livro (membros x visitantes)
      const { membros, visitantes } = attendanceStatsByBookSeparated(b.id);

      const statsBox = document.createElement("div");
      statsBox.className = "stats";

      const membrosLinha = document.createElement("div");
      membrosLinha.className = "stats-title";
      membrosLinha.textContent =
        "Membros: " + (membros.length ? membros.map(m => `${m.name} (${m.count})`).join(", ") : "nenhum");

      const visitantesLinha = document.createElement("div");
      visitantesLinha.className = "stats-title";
      visitantesLinha.textContent =
        "Visitantes: " + (visitantes.length ? visitantes.map(v => `${v.name} (${v.count})`).join(", ") : "nenhum");

      statsBox.appendChild(membrosLinha);
      statsBox.appendChild(visitantesLinha);

      li.appendChild(topo);
      if (atual.textContent) li.appendChild(atual);
      li.appendChild(statsBox);

      listaLivros.appendChild(li);
    });
  }

  // Select do livro atual
  livroAtualSelect.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "— Selecione —";
  livroAtualSelect.appendChild(opt0);

  state.books.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (b.id === state.currentBookId) opt.selected = true;
    livroAtualSelect.appendChild(opt);
  });

  const atual = bookById(state.currentBookId);
  livroAtualInfo.textContent = atual ? `Atual: ${atual.name}` : "Nenhum livro atual";
}

// =================== Render Presença Temporária ===================
function renderAttendanceTemp() {
  listaPresencaTemp.innerHTML = "";

  if (attendanceTemp.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.textContent = "Adicione nomes para compor a presença deste evento.";
    listaPresencaTemp.appendChild(li);
    return;
  }

  attendanceTemp.forEach(p => {
    const li = document.createElement("li");
    li.className = "item";

    const topo = document.createElement("div");
    topo.className = "item-topo";

    const nome = document.createElement("span");
    nome.textContent = p.isVisitor ? `👤 ${p.name} (visitante)` : `🧑 ${p.name}`;

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-del";
    btnDel.textContent = "Remover";
    btnDel.onclick = () => {
      attendanceTemp = attendanceTemp.filter(x => x.id !== p.id);
      renderAttendanceTemp();
    };

    topo.appendChild(nome);
    topo.appendChild(btnDel);

    li.appendChild(topo);
    listaPresencaTemp.appendChild(li);
  });
}

// =================== Render Eventos ===================
function renderEvents() {
  listaEventos.innerHTML = "";

  if (state.events.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.textContent = "Nenhum evento salvo ainda.";
    listaEventos.appendChild(li);
    return;
  }

  // mais recente primeiro (por data)
  const ordenados = [...state.events].sort((a,b) => (b.date || "").localeCompare(a.date || ""));

  ordenados.forEach(e => {
    const li = document.createElement("li");
    li.className = "item";

    const topo = document.createElement("div");
    topo.className = "item-topo";

    const titulo = document.createElement("strong");
    const livro = bookById(e.bookId);
    const livroNome = livro ? livro.name : "(livro removido)";
    titulo.textContent = `🗓️ ${e.date || "sem data"} — ${livroNome}`;

    const actions = document.createElement("div");

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn-sec";
    btnEdit.textContent = "Editar";
    btnEdit.onclick = () => startEdit(e.id);

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-del";
    btnDel.textContent = "Excluir";
    btnDel.onclick = () => {
      // se estava editando esse evento, cancela antes
      if (editingEventId === e.id) cancelEdit();

      state.events = state.events.filter(x => x.id !== e.id);
      save(state);
      renderEvents();
      renderBooks(); // atualiza estatísticas por livro
    };

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);

    topo.appendChild(titulo);
    topo.appendChild(actions);

    const chap = document.createElement("div");
    chap.innerHTML = `<span class="badge">Capítulos: ${e.chaptersText || "-"}</span>`;

    const temas = document.createElement("div");
    temas.innerHTML = `<small><strong>Temas:</strong> ${e.themes ? e.themes.replaceAll("\n"," / ") : "-"}</small>`;

    const pres = document.createElement("div");
    const qtd = Array.isArray(e.attendance) ? e.attendance.length : 0;
    pres.innerHTML = `<small><strong>Presença (${qtd}):</strong> ${
      qtd ? e.attendance.map(p => p.isVisitor ? `👤 ${p.name}` : `🧑 ${p.name}`).join(", ") : "-"
    }</small>`;

    li.appendChild(topo);
    li.appendChild(chap);
    li.appendChild(temas);
    li.appendChild(pres);

    listaEventos.appendChild(li);
  });
}

// =================== Eventos (listeners) ===================

// 1) Adicionar livro
formLivro.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const name = livroNome.value.trim();
  if (!name) return alert("Digite o nome do livro.");

  const exists = state.books.some(b => b.name.toLowerCase() === name.toLowerCase());
  if (exists) return alert("Esse livro já existe.");

  const book = { id: id(), name };
  state.books.push(book);

  // se ainda não tem livro atual, define
  if (!state.currentBookId) state.currentBookId = book.id;

  save(state);
  livroNome.value = "";
  livroNome.focus();
  renderAll();
});

// 2) Selecionar livro atual pelo select
livroAtualSelect.addEventListener("change", () => {
  const val = livroAtualSelect.value || null;
  state.currentBookId = val;
  save(state);
  renderAll();
});

// 3) Adicionar nome na presença (temp)
btnAddPresenca.addEventListener("click", () => {
  const name = presencaNome.value.trim();
  if (!name) return alert("Digite um nome para a presença.");

  attendanceTemp.push({
    id: id(),
    name,
    isVisitor: presencaVisitante.checked
  });

  presencaNome.value = "";
  presencaVisitante.checked = false;
  presencaNome.focus();
  renderAttendanceTemp();
});

// 4) Salvar/Atualizar evento
formEvento.addEventListener("submit", (ev) => {
  ev.preventDefault();

  if (!state.currentBookId) return alert("Selecione um livro atual antes de criar evento.");

  const date = eventoData.value;
  const chaptersText = eventoCapitulos.value.trim();
  const themes = eventoTemas.value.trim();

  if (!date) return alert("Escolha uma data.");
  if (!chaptersText) return alert("Preencha os capítulos (texto livre).");
  if (attendanceTemp.length === 0) return alert("Adicione pelo menos 1 nome na presença.");

  if (editingEventId) {
    // ✅ Atualizar evento existente
    const idx = state.events.findIndex(e => e.id === editingEventId);
    if (idx < 0) return alert("Evento em edição não foi encontrado.");

    state.events[idx] = {
      ...state.events[idx],
      bookId: state.currentBookId,
      date,
      chaptersText,
      themes,
      attendance: [...attendanceTemp]
    };

    save(state);

    cancelEdit();  // limpa o modo edição
    renderAll();
    return;
  }

  // ✅ Criar novo evento
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

  // limpa o formulário do evento
  eventoCapitulos.value = "";
  eventoTemas.value = "";
  attendanceTemp = [];
  renderAttendanceTemp();
  renderEvents();
  renderBooks();
});

function isValidBackup(obj) {
  // validação simples pra evitar importar arquivo errado
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.books)) return false;
  if (!Array.isArray(obj.events)) return false;

  // valida livros
  for (const b of obj.books) {
    if (!b || typeof b !== "object") return false;
    if (typeof b.id !== "string") return false;
    if (typeof b.name !== "string") return false;
  }

  // valida eventos (mínimo necessário)
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

  // currentBookId pode ser null ou string
  if (!(obj.currentBookId === null || typeof obj.currentBookId === "string")) return false;

  return true;
}

function exportBackup() {
  const data = load(); // pega do localStorage do jeito oficial
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
}

function importBackupFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const obj = JSON.parse(text);

      if (!isValidBackup(obj)) {
        alert("Esse arquivo não parece ser um backup válido do seu projeto.");
        return;
      }

      const ok = confirm("Importar backup vai SUBSTITUIR todos os dados atuais. Continuar?");
      if (!ok) return;

      // substitui tudo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));

      // se estiver editando evento, cancela (se existir no seu JS de edição)
      if (typeof cancelEdit === "function") cancelEdit();

      state = load();
      renderAll();

      alert("Backup importado com sucesso ✅");
    } catch (err) {
      alert("Erro ao importar: arquivo JSON inválido.");
    }
  };

  reader.readAsText(file);
}

function clearAllData() {
  const ok = confirm("Tem certeza que quer apagar todos os dados? Essa ação não tem volta.");
  if (!ok) return;

  localStorage.removeItem(STORAGE_KEY);

  if (typeof cancelEdit === "function") cancelEdit();

  state = load();
  renderAll();
}


// =================== Render Geral ===================
function renderAll() {
  state = load();
  renderBooks();
  renderAttendanceTemp();
  renderEvents();

  // garante UI do modo edição
  btnSalvarEvento.textContent = editingEventId ? "Atualizar evento" : "Salvar evento";
  btnCancelarEdicao.style.display = editingEventId ? "inline-block" : "none";
}

renderAll();

btnExport.addEventListener("click", () => {
  exportBackup();
});

btnImport.addEventListener("click", () => {
  fileImport.value = ""; // permite importar o mesmo arquivo 2 vezes seguidas
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

