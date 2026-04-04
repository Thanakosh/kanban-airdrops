// Módulo para adicionar suporte a PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    });
}

/**
 * Módulo Model - Gerencia os dados e operações de CRUD
 */
class KanbanModel {
    constructor() {
        this.STORAGE_KEY = 'kanbanAirdrop';
        this.dados = this.carregarDados();
        this.listeners = [];
    }

    /**
     * Carrega dados do localStorage ou usa os padrões
     * @returns {Array} Dados do kanban
     */
    carregarDados() {
        try {
            const dadosArmazenados = localStorage.getItem(this.STORAGE_KEY);
            if (dadosArmazenados) {
                return JSON.parse(dadosArmazenados);
            }
            return this.dadosPadrao();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return this.dadosPadrao();
        }
    }

    /**
     * Salva dados no localStorage
     */
    salvarDados() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.dados));
            this.notificarListeners();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            toast('Erro ao salvar dados', 'danger');
        }
    }

    /**
     * Dados padrão para inicializar o kanban
     * @returns {Array} Dados iniciais
     */
    dadosPadrao() {
        return [
            // Exemplo de coluna inicial (pode ser vazio)
            // { id: 1, name: "A Fazer", color: "#2563eb", order: 1, cards: [] }
        ];
    }

    /**
     * Cria um quadro inicial com colunas padrão para o primeiro uso
     * @returns {Boolean} Se o quadro foi criado
     */
    criarQuadroInicial() {
        if (this.dados.length) return false;

        this.dados = [
            { id: 1, name: 'Descobertos', color: '#38bdf8', order: 1, cards: [] },
            { id: 2, name: 'Validando', color: '#8b5cf6', order: 2, cards: [] },
            { id: 3, name: 'Em andamento', color: '#f59e0b', order: 3, cards: [] },
            { id: 4, name: 'Concluídos', color: '#22c55e', order: 4, cards: [] }
        ];

        this.salvarDados();
        return true;
    }

    /**
     * Normaliza links antes de salvar
     * @param {String} link Link informado pelo usuário
     * @returns {String} Link normalizado
     */
    normalizarLink(link) {
        const linkLimpo = (link || '').trim();

        if (!linkLimpo || linkLimpo === 'http://' || linkLimpo === 'https://') {
            return '';
        }

        return linkLimpo;
    }

    /**
     * Converte os dados do formulário para o formato interno do cartão
     * @param {Object} cartao Dados de entrada
     * @returns {Object} Dados normalizados
     */
    normalizarCartao(cartao) {
        return {
            title: (cartao.titulo || cartao.title || '').trim(),
            description: (cartao.descricao || cartao.description || '').trim(),
            status: cartao.status || 'Em andamento',
            priority: cartao.prioridade || cartao.priority || 'Média',
            prazo: cartao.prazo || null,
            link: this.normalizarLink(cartao.link),
            tags: Array.isArray(cartao.tags)
                ? cartao.tags
                    .map(tag => String(tag).trim())
                    .filter(Boolean)
                : [],
            checklist: Array.isArray(cartao.checklist)
                ? cartao.checklist
                    .map((item, index) => ({
                        id: item.id || index + 1,
                        text: String(item.text || '').trim(),
                        done: Boolean(item.done)
                    }))
                    .filter(item => item.text)
                : [],
            obs: (cartao.obs || '').trim()
        };
    }

    /**
     * Adiciona um listener para mudanças nos dados
     * @param {Function} callback Função a ser chamada quando os dados mudarem
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifica todos os listeners sobre mudanças
     */
    notificarListeners() {
        this.listeners.forEach(callback => callback(this.dados));
    }

    /**
     * Obtém todas as colunas
     * @returns {Array} Colunas do kanban
     */
    getColunas() {
        return [...this.dados];
    }

    /**
     * Gera um ID único para uma nova coluna
     * @returns {Number} Novo ID
     */
    gerarNovoIdColuna() {
        return this.dados.length ? Math.max(...this.dados.map(c => c.id)) + 1 : 1;
    }

    /**
     * Gera um ID único para um novo cartão
     * @returns {Number} Novo ID
     */
    gerarNovoIdCartao() {
        const cards = this.dados.flatMap(c => c.cards);
        return cards.length ? Math.max(...cards.map(c => c.id)) + 1 : 1;
    }

    /**
     * Adiciona uma nova coluna
     * @param {String} nome Nome da coluna
     * @param {String} color Cor da coluna
     */
    adicionarColuna(nome, color) {
        const novoId = this.gerarNovoIdColuna();
        this.dados.push({
            id: novoId,
            name: nome,
            color: color || "#2563eb",
            order: this.dados.length + 1,
            cards: []
        });
        this.salvarDados();
        return novoId;
    }

    /**
     * Edita uma coluna existente
     * @param {Number} id ID da coluna
     * @param {String} nome Novo nome
     * @param {String} color Nova cor
     */
    editarColuna(id, nome, color) {
        const coluna = this.dados.find(c => c.id === id);
        if (coluna) {
            coluna.name = nome;
            if (color) coluna.color = color;
            this.salvarDados();
            return true;
        }
        return false;
    }

    /**
     * Remove uma coluna
     * @param {Number} id ID da coluna a remover
     */
    removerColuna(id) {
        this.dados = this.dados.filter(c => c.id !== id);
        this.salvarDados();
    }

    /**
     * Adiciona um novo cartão
     * @param {Object} cartao Dados do cartão 
     */
    adicionarCartao(cartao) {
        const coluna = this.dados.find(c => c.id === cartao.colunaId);
        if (coluna) {
            const novoId = this.gerarNovoIdCartao();
            const dadosNormalizados = this.normalizarCartao(cartao);
            const novoCartao = {
                id: novoId,
                ...dadosNormalizados,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            coluna.cards.push(novoCartao);
            this.salvarDados();
            return novoId;
        }
        return null;
    }

    /**
     * Edita um cartão existente
     * @param {Number} colunaId ID da coluna
     * @param {Number} cartaoId ID do cartão
     * @param {Object} dadosCartao Novos dados
     */
    editarCartao(colunaOrigemId, cartaoId, dadosCartao, colunaDestinoId = colunaOrigemId) {
        const colunaOrigem = this.dados.find(c => c.id === colunaOrigemId);
        const colunaDestino = this.dados.find(c => c.id === colunaDestinoId);

        if (!colunaOrigem || !colunaDestino) return false;

        const indiceCartao = colunaOrigem.cards.findIndex(c => c.id === cartaoId);
        if (indiceCartao === -1) return false;

        const cartaoAtual = colunaOrigem.cards[indiceCartao];
        const cartaoAtualizado = {
            ...cartaoAtual,
            ...this.normalizarCartao(dadosCartao),
            updated_at: new Date().toISOString()
        };

        if (colunaOrigemId === colunaDestinoId) {
            colunaOrigem.cards[indiceCartao] = cartaoAtualizado;
        } else {
            colunaOrigem.cards.splice(indiceCartao, 1);
            colunaDestino.cards.push(cartaoAtualizado);
        }

        this.salvarDados();
        return true;
    }

    /**
     * Move um cartão para outra coluna
     * @param {Number} cartaoId ID do cartão
     * @param {Number} colunaOrigemId ID da coluna de origem
     * @param {Number} colunaDestinoId ID da coluna de destino
     */
    moverCartao(cartaoId, colunaOrigemId, colunaDestinoId) {
        try {
            const colunaOrigem = this.dados.find(c => c.id === colunaOrigemId);
            const colunaDestino = this.dados.find(c => c.id === colunaDestinoId);

            if (!colunaOrigem || !colunaDestino) return false;

            const indiceCartao = colunaOrigem.cards.findIndex(c => c.id === cartaoId);
            if (indiceCartao === -1) return false;

            const cartao = colunaOrigem.cards[indiceCartao];
            colunaOrigem.cards.splice(indiceCartao, 1);
            colunaDestino.cards.push({...cartao, updated_at: new Date().toISOString()});

            this.salvarDados();
            return true;
        } catch (error) {
            console.error("Erro ao mover cartão:", error);
            return false;
        }
    }

    /**
     * Remove um cartão
     * @param {Number} colunaId ID da coluna
     * @param {Number} cartaoId ID do cartão
     */
    removerCartao(colunaId, cartaoId) {
        const coluna = this.dados.find(c => c.id === colunaId);
        if (coluna) {
            coluna.cards = coluna.cards.filter(c => c.id !== cartaoId);
            this.salvarDados();
            return true;
        }
        return false;
    }

    /**
     * Obtém estatísticas dos dados
     */
    getEstatisticas() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cards = this.dados.flatMap(c => c.cards);

        const porStatus = {
            'Em andamento': 0,
            'Concluído': 0,
            'Aguardando': 0,
            'Rejeitado': 0
        };

        const porPrioridade = {
            'Alta': 0,
            'Média': 0,
            'Baixa': 0
        };

        let ativos = 0;
        let atrasados = 0;

        cards.forEach(card => {
            // Contagem por status
            porStatus[card.status] = (porStatus[card.status] || 0) + 1;

            // Contagem por prioridade
            porPrioridade[card.priority] = (porPrioridade[card.priority] || 0) + 1;

            if (!['Concluído', 'Rejeitado'].includes(card.status)) {
                ativos++;
            }

            // Contagem de atrasados
            if (card.prazo && card.status !== 'Concluído') {
                const prazoDate = new Date(card.prazo);
                prazoDate.setHours(0, 0, 0, 0);
                if (prazoDate < today) atrasados++;
            }
        });

        return {
            total: cards.length,
            porStatus,
            porPrioridade,
            ativos,
            concluidos: porStatus['Concluído'] || 0,
            emAndamento: porStatus['Em andamento'] || 0,
            atrasados
        };
    }

    /**
     * Exporta os dados do kanban
     * @returns {String} Dados em formato JSON
     */
    exportarDados() {
        return JSON.stringify(this.dados, null, 2);
    }

    /**
     * Importa dados para o kanban
     * @param {String} jsonData Dados em formato JSON
     */
    importarDados(jsonData) {
        try {
            const dados = JSON.parse(jsonData);
            if (!Array.isArray(dados)) throw new Error("Formato inválido");
            this.dados = dados;
            this.salvarDados();
            return true;
        } catch (error) {
            console.error("Erro ao importar dados:", error);
            return false;
        }
    }
}

/**
 * Módulo View - Responsável pela renderização da interface
 */
class KanbanView {
    constructor(model, controller) {
        this.model = model;
        this.controller = controller;
        this.kanbanBoard = document.getElementById('kanban-board');
        this.selectColunas = document.getElementById('modal-cartao-coluna-id');
        this.theme = localStorage.getItem('kanban-theme') || 'dark';

        // Aplicar tema inicial
        this.applyTheme(this.theme);

        // Configurar listeners para interface
        this.setupEventListeners();
    }

    /**
     * Configura event listeners para elementos da interface
     */
    setupEventListeners() {
        // Form da coluna
        document.getElementById('form-coluna').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('coluna-id').value;
            const nome = document.getElementById('nome-coluna').value;
            const cor = document.getElementById('cor-coluna').value;

            if (id) {
                this.controller.editarColuna(parseInt(id), nome, cor);
            } else {
                this.controller.adicionarColuna(nome, cor);
            }

            bootstrap.Modal.getInstance(document.getElementById('modalColuna')).hide();
            document.getElementById('form-coluna').reset();
            document.getElementById('coluna-id').value = '';
        });

        // Form do cartão
        document.getElementById('form-modal-cartao').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('modal-cartao-id').value;
            const colunaId = parseInt(document.getElementById('modal-cartao-coluna-id').value, 10);
            const colunaOriginalId = parseInt(
                document.getElementById('modal-cartao-coluna-original-id').value || colunaId,
                10
            );
            const titulo = document.getElementById('modal-cartao-titulo').value.trim();
            const status = document.getElementById('modal-cartao-status').value;

            // Validação mínima: título, coluna e status
            if (!titulo || !colunaId || !status) {
                this.exibirToast('Preencha os campos obrigatórios: Título, Coluna e Status.', 'danger');
                return;
            }
            const descricao = document.getElementById('modal-cartao-descricao').value;
            const prioridade = document.getElementById('modal-cartao-prioridade').value;
            const prazo = document.getElementById('modal-cartao-prazo').value;
            const link = document.getElementById('modal-cartao-link').value;
            const tagsString = document.getElementById('modal-cartao-tags').value;
            const obs = document.getElementById('modal-cartao-obs').value;

            // Processar tags
            const tags = tagsString.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            // Obter checklist
            const checklist = Array.from(document.querySelectorAll('.checklist-item'))
                .map((item, idx) => ({
                    id: idx + 1,
                    text: item.querySelector('.checklist-text').textContent,
                    done: item.querySelector('input[type="checkbox"]').checked
                }));

            const cartao = {
                titulo,
                descricao,
                status,
                prioridade,
                prazo,
                link,
                tags,
                checklist,
                obs,
                colunaId
            };

            if (id) {
                this.controller.editarCartao(colunaOriginalId, parseInt(id, 10), cartao, colunaId);
            } else {
                this.controller.adicionarCartao(cartao);
            }

            bootstrap.Modal.getInstance(document.getElementById('modalCartao'))?.hide();
        });

        // Adicionar item ao checklist
        document.getElementById('add-checklist-item').addEventListener('click', () => {
            const input = document.getElementById('novo-checklist-item');
            if (input.value.trim()) {
                this.adicionarChecklistItem(input.value, false);
                input.value = '';
            }
        });

        document.getElementById('novo-checklist-item').addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;

            event.preventDefault();
            document.getElementById('add-checklist-item').click();
        });

        // Filtros
        document.getElementById('busca').addEventListener('input', this.renderizar.bind(this));
        document.getElementById('filtro-status').addEventListener('change', this.renderizar.bind(this));
        document.getElementById('filtro-prioridade').addEventListener('change', this.renderizar.bind(this));

        const newCardButton = document.getElementById('new-card-btn');
        if (newCardButton) {
            newCardButton.addEventListener('click', () => {
                if (!this.model.getColunas().length) {
                    this.exibirToast(getTranslationSet().createColumnFirst, 'warning');
                    this.controller.abrirModalColuna();
                    return;
                }

                this.controller.abrirModalCartao(null, null);
            });
        }

        // Alternância de tema
        const themeToggleButton = document.getElementById('theme-toggle');
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                // Alterna o tema atual
                this.theme = this.theme === 'dark' ? 'light' : 'dark';
                // Aplica o novo tema
                this.applyTheme(this.theme);
                // Salva a preferência no localStorage
                localStorage.setItem('kanban-theme', this.theme);
                // Opcional: log de atividade
                // if (typeof this.logAtividade === 'function') {
                //     this.logAtividade(`Tema alterado para ${this.theme}.`);
                // }
            });
        }
    }

    /**
     * Aplica o tema (claro/escuro) ao documento
     * @param {String} theme Nome do tema ('light' ou 'dark')
     */
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    /**
     * Adiciona um item ao checklist no modal
     * @param {String} text Texto do item
     * @param {Boolean} done Status do item (concluído ou não)
     */
    adicionarChecklistItem(text, done = false) {
        const container = document.getElementById('checklist-container');
        const div = document.createElement('div');
        div.className = 'checklist-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.checked = done;

        const textSpan = document.createElement('span');
        textSpan.className = 'checklist-text ms-2';
        textSpan.textContent = text;
        if (done) textSpan.classList.add('completed');

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger ms-auto';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => div.remove();

        div.appendChild(checkbox);
        div.appendChild(textSpan);
        div.appendChild(removeBtn);

        checkbox.addEventListener('change', () => {
            textSpan.classList.toggle('completed', checkbox.checked);
        });

        container.appendChild(div);
    }

    /**
     * Renderiza todo o kanban
     */
    renderizar() {
        this.kanbanBoard.innerHTML = '';

        // Obter filtros
        const busca = document.getElementById('busca').value.toLowerCase();
        const filtroStatus = document.getElementById('filtro-status').value;
        const filtroPrioridade = document.getElementById('filtro-prioridade').value;

        let colunas = this.model.getColunas();
        colunas.sort((a, b) => a.order - b.order);
        const stats = this.model.getEstatisticas();

        this.atualizarResumoPrincipal(colunas, stats);
        this.atualizarEstadoAcoes(colunas.length > 0);
        this.atualizarSelectColunas(colunas);

        if (!colunas.length) {
            this.kanbanBoard.innerHTML = this.criarEstadoVazio();
            this.registrarAcoesEstadoVazio();
            return;
        }

        // Renderizar colunas
        colunas.forEach(coluna => {
            const colunaEl = this.criarElementoColuna(coluna);

            // Filtrar cartões
            let cartoes = coluna.cards;
            if (busca) {
                cartoes = cartoes.filter(card => 
                    (card.title && card.title.toLowerCase().includes(busca)) || 
                    (card.description && card.description.toLowerCase().includes(busca)) || 
                    (card.obs && card.obs.toLowerCase().includes(busca)) ||
                    (card.tags && card.tags.some(tag => tag.toLowerCase().includes(busca)))
                );
            }

            if (filtroStatus) {
                cartoes = cartoes.filter(card => card.status === filtroStatus);
            }

            if (filtroPrioridade) {
                cartoes = cartoes.filter(card => card.priority === filtroPrioridade);
            }

            // Renderizar cartões
            cartoes.forEach(cartao => {
                const cartaoEl = this.criarElementoCartao(cartao, coluna.id);
                colunaEl.querySelector('.column-cards').appendChild(cartaoEl);
            });

            this.kanbanBoard.appendChild(colunaEl);
        });

        // Habilitar drag and drop
        this.habilitarDragAndDrop();
    }

    /**
     * Atualiza os indicadores principais da tela
     * @param {Array} colunas Lista de colunas
     * @param {Object} stats Estatísticas do quadro
     */
    atualizarResumoPrincipal(colunas, stats) {
        document.getElementById('summary-columns').textContent = colunas.length;
        document.getElementById('summary-active').textContent = stats.ativos;
        document.getElementById('summary-overdue').textContent = stats.atrasados;
    }

    /**
     * Habilita ou desabilita ações que dependem da existência de colunas
     * @param {Boolean} temColunas Se o quadro já possui colunas
     */
    atualizarEstadoAcoes(temColunas) {
        const newCardButton = document.getElementById('new-card-btn');
        if (!newCardButton) return;

        newCardButton.disabled = !temColunas;
        newCardButton.title = temColunas ? '' : getTranslationSet().createColumnFirst;
    }

    /**
     * Cria o markup do estado vazio
     * @returns {String} HTML do estado vazio
     */
    criarEstadoVazio() {
        const t = getTranslationSet();

        return `
            <section class="empty-state">
                <span class="empty-state-eyebrow">${t.emptyEyebrow}</span>
                <h2>${t.emptyTitle}</h2>
                <p>${t.emptyDescription}</p>
                <div class="empty-state-actions">
                    <button type="button" class="btn btn-light" id="empty-load-template">${t.loadTemplate}</button>
                    <button type="button" class="btn btn-outline-light" id="empty-add-column">${t.newColumn}</button>
                </div>
            </section>
        `;
    }

    /**
     * Registra ações do estado vazio
     */
    registrarAcoesEstadoVazio() {
        document.getElementById('empty-load-template')?.addEventListener('click', () => {
            this.controller.criarQuadroInicial();
        });

        document.getElementById('empty-add-column')?.addEventListener('click', () => {
            this.controller.abrirModalColuna();
        });
    }

    /**
     * Cria elemento HTML para uma coluna
     * @param {Object} coluna Dados da coluna
     * @returns {HTMLElement} Elemento da coluna
     */
    criarElementoColuna(coluna) {
        const div = document.createElement('div');
        div.className = 'trello-column';
        div.setAttribute('data-col-id', coluna.id);
        div.style.borderTop = `6px solid ${coluna.color}`;

        // Header com título e ações
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '12px';

        const title = document.createElement('div');
        title.className = 'column-title';
        title.textContent = coluna.name;

        const actions = document.createElement('div');
        actions.innerHTML = `
            <button class="btn btn-sm btn-outline-primary" onclick="controller.abrirModalCartao(null, ${coluna.id})">
                <i class="fas fa-plus"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="controller.abrirModalColuna(${coluna.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="controller.confirmarRemoverColuna(${coluna.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;

        header.appendChild(title);
        header.appendChild(actions);
        div.appendChild(header);

        // Container para cartões
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'column-cards';
        div.appendChild(cardsContainer);

        return div;
    }

    /**
     * Cria elemento HTML para um cartão
     * @param {Object} cartao Dados do cartão
     * @param {Number} colunaId ID da coluna
     * @returns {HTMLElement} Elemento do cartão
     */
    criarElementoCartao(cartao, colunaId) {
        const t = getTranslationSet();
        const div = document.createElement('div');
        div.className = `trello-card ${this.getCardColorClass(cartao)}`;
        div.setAttribute('data-card-id', cartao.id);
        div.setAttribute('data-col-id', colunaId);

        // Header com título e status
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center';

        const title = document.createElement('strong');
        title.textContent = cartao.title;

        const statusBadge = document.createElement('span');
        statusBadge.className = `badge bg-${this.getStatusClass(cartao.status)}`;
        statusBadge.textContent = this.getStatusLabel(cartao.status);

        header.appendChild(title);
        header.appendChild(statusBadge);
        div.appendChild(header);

        // Descrição
        if (cartao.description) {
            const desc = document.createElement('div');
            desc.className = 'mt-2';
            desc.textContent = cartao.description;
            div.appendChild(desc);
        }

        // Tags
        if (cartao.tags && cartao.tags.length) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'mt-2';

            cartao.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                tagSpan.style.backgroundColor = this.getTagColor(tag);
                tagsDiv.appendChild(tagSpan);
            });

            div.appendChild(tagsDiv);
        }

        // Prioridade
        const priorityBadge = document.createElement('div');
        priorityBadge.className = 'mt-2';
        priorityBadge.innerHTML = `
            <span class="badge priority-${cartao.priority?.toLowerCase() || 'medium'}">
                ${this.getPriorityLabel(cartao.priority || 'Média')}
            </span>
        `;
        div.appendChild(priorityBadge);

        // Prazo
        if (cartao.prazo) {
            const prazo = document.createElement('div');
            prazo.className = 'mt-2 small';

            const prazoDate = new Date(cartao.prazo);
            const today = new Date();
            prazoDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const isAtrasado = prazoDate < today && cartao.status !== 'Concluído';

            prazo.innerHTML = `
                <i class="fas fa-calendar-alt me-1"></i>
                <span class="${isAtrasado ? 'text-danger' : ''}">
                    ${this.formatarData(cartao.prazo)}
                    ${isAtrasado ? ` (${t.overdueShort})` : ''}
                </span>
            `;
            div.appendChild(prazo);
        }

        // Link
        if (cartao.link) {
            const link = document.createElement('div');
            link.className = 'mt-2';
            link.innerHTML = `<a href="${cartao.link}" target="_blank" class="btn btn-sm btn-outline-info">
                <i class="fas fa-external-link-alt"></i> ${t.visit}
            </a>`;
            div.appendChild(link);
        }

        // Checklist resumido (se houver)
        if (cartao.checklist && cartao.checklist.length) {
            const checklistDiv = document.createElement('div');
            checklistDiv.className = 'mt-2 small';

            const completed = cartao.checklist.filter(item => item.done).length;
            const total = cartao.checklist.length;
            const percent = Math.round((completed / total) * 100);

            checklistDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-tasks me-1"></i> ${completed}/${total}</span>
                    <span>${percent}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" style="width: ${percent}%"></div>
                </div>
            `;

            div.appendChild(checklistDiv);
        }

        // Observações
        if (cartao.obs) {
            const obs = document.createElement('div');
            obs.className = 'mt-2 small fst-italic text-muted';
            obs.textContent = cartao.obs;
            div.appendChild(obs);
        }

        // Ações
        const actions = document.createElement('div');
        actions.className = 'mt-3 text-end';
        actions.innerHTML = `
            <button class="btn btn-sm btn-outline-primary" onclick="controller.abrirModalCartao(${cartao.id}, ${colunaId})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-success" onclick="controller.duplicarCartao(${cartao.id}, ${colunaId})">
                <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="controller.confirmarRemoverCartao(${colunaId}, ${cartao.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        div.appendChild(actions);

        return div;
    }

    /**
     * Obtém classe de cor para um cartão com base na prioridade
     * @param {Object} cartao Dados do cartão
     * @returns {String} Nome da classe CSS
     */
    getCardColorClass(cartao) {
        const prioridadeMap = {
            'Alta': 'red',
            'Média': 'orange',
            'Baixa': 'green',
            High: 'red',
            Medium: 'orange',
            Low: 'green'
        };
        return prioridadeMap[cartao.priority] || 'blue';
    }

    /**
     * Traduz a exibição do status do cartão
     * @param {String} status Status salvo
     * @returns {String} Status localizado
     */
    getStatusLabel(status) {
        const t = getTranslationSet();
        const labels = {
            'Em andamento': t.inProgress,
            'Concluído': t.done,
            Aguardando: t.waiting,
            Rejeitado: t.rejected
        };

        return labels[status] || status;
    }

    /**
     * Traduz a prioridade do cartão
     * @param {String} prioridade Prioridade salva
     * @returns {String} Prioridade localizada
     */
    getPriorityLabel(prioridade) {
        const t = getTranslationSet();
        const labels = {
            Alta: t.high,
            Média: t.medium,
            Baixa: t.low,
            High: t.high,
            Medium: t.medium,
            Low: t.low
        };

        return labels[prioridade] || prioridade;
    }

    /**
     * Gera uma cor consistente para uma tag específica
     * @param {String} tag Nome da tag
     * @returns {String} Código de cor hexadecimal
     */
    getTagColor(tag) {
        // Gerar uma cor consistente baseada na string da tag
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Converter para um tom mais atraente
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 40%)`;
    }

    /**
     * Formata uma data para exibição
     * @param {String} dateStr String de data ISO
     * @returns {String} Data formatada para exibição
     */
    formatarData(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(getLocaleForCalendar());
    }

    /**
     * Atualiza o select de colunas
     * @param {Array} colunas Lista de colunas
     */
    atualizarSelectColunas(colunas) {
        this.selectColunas.innerHTML = '';
        colunas.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col.id;
            opt.textContent = col.name;
            this.selectColunas.appendChild(opt);
        });
    }

    /**
     * Habilita funcionalidade de drag and drop para cartões
     */
    habilitarDragAndDrop() {
        const cartoes = document.querySelectorAll('.trello-card');
        const colunas = document.querySelectorAll('.trello-column');

        cartoes.forEach(cartao => {
            cartao.setAttribute('draggable', 'true');

            cartao.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    cardId: parseInt(cartao.getAttribute('data-card-id')),
                    colId: parseInt(cartao.getAttribute('data-col-id'))
                }));
                cartao.classList.add('dragging');
            });

            cartao.addEventListener('dragend', () => {
                cartao.classList.remove('dragging');
            });
        });

        colunas.forEach(coluna => {
            coluna.addEventListener('dragover', e => {
                e.preventDefault();
                coluna.classList.add('drag-over');
            });

            coluna.addEventListener('dragleave', () => {
                coluna.classList.remove('drag-over');
            });

            coluna.addEventListener('drop', e => {
                e.preventDefault();
                coluna.classList.remove('drag-over');

                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const colunaDestinoId = parseInt(coluna.getAttribute('data-col-id'));

                    if (data.colId !== colunaDestinoId) {
                        this.controller.moverCartao(
                            data.cardId,
                            data.colId,
                            colunaDestinoId
                        );
                    }
                } catch (err) {
                    console.error('Erro no drop:', err);
                }
            });
        });
    }

    /**
     * Abre o modal de coluna para edição ou criação
     * @param {Object|null} coluna Dados da coluna ou null para nova coluna
     */
    abrirModalColuna(coluna = null) {
        const t = getTranslationSet();
        const idInput = document.getElementById('coluna-id');
        const nomeInput = document.getElementById('nome-coluna');
        const corInput = document.getElementById('cor-coluna');
        const modal = document.getElementById('modalColuna');
        const modalTitle = modal.querySelector('.modal-title');

        // Resetar form
        document.getElementById('form-coluna').reset();

        if (coluna) {
            // Modo de edição
            idInput.value = coluna.id;
            nomeInput.value = coluna.name;
            corInput.value = coluna.color || '#2563eb';
            modalTitle.textContent = t.editColumn;
        } else {
            // Modo de criação
            idInput.value = '';
            modalTitle.textContent = t.newColumn;
        }

        // Abrir modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    /**
     * Abre o modal de cartão para edição ou criação
     * @param {Object|null} cartao Dados do cartão ou null para novo cartão
     * @param {Number} colunaId ID da coluna para novo cartão
     */
    abrirModalCartao(cartao = null, colunaId = null) {
        const t = getTranslationSet();
        const idInput = document.getElementById('modal-cartao-id');
        const colunaOriginalInput = document.getElementById('modal-cartao-coluna-original-id');
        const tituloInput = document.getElementById('modal-cartao-titulo');
        const descricaoInput = document.getElementById('modal-cartao-descricao');
        const statusSelect = document.getElementById('modal-cartao-status');
        const prioridadeSelect = document.getElementById('modal-cartao-prioridade');
        const prazoInput = document.getElementById('modal-cartao-prazo');
        const linkInput = document.getElementById('modal-cartao-link');
        const tagsInput = document.getElementById('modal-cartao-tags');
        const obsInput = document.getElementById('modal-cartao-obs');
        const colunaSelect = document.getElementById('modal-cartao-coluna-id');
        const checklistContainer = document.getElementById('checklist-container');
        const modal = document.getElementById('modalCartao');
        const modalTitle = modal.querySelector('.modal-title');

        if (!this.model.getColunas().length) {
            this.exibirToast(t.createColumnFirst, 'warning');
            return;
        }

        // Limpar formulário e checklist
        document.getElementById('form-modal-cartao').reset();
        checklistContainer.innerHTML = '';

        if (cartao) {
            // Modo de edição
            idInput.value = cartao.id;
            colunaOriginalInput.value = colunaId;
            tituloInput.value = cartao.title || '';
            descricaoInput.value = cartao.description || '';
            statusSelect.value = cartao.status || 'Em andamento';
            prioridadeSelect.value = cartao.priority || 'Média';
            prazoInput.value = cartao.prazo || '';
            linkInput.value = cartao.link || '';
            tagsInput.value = (cartao.tags || []).join(', ');
            obsInput.value = cartao.obs || '';
            colunaSelect.value = colunaId;

            // Adicionar itens do checklist
            if (cartao.checklist && cartao.checklist.length) {
                cartao.checklist.forEach(item => {
                    this.adicionarChecklistItem(item.text, item.done);
                });
            }

            modalTitle.textContent = t.editCard;
        } else {
            // Modo de criação
            idInput.value = '';
            colunaOriginalInput.value = colunaId || '';
            colunaSelect.value = colunaId || this.model.getColunas()[0]?.id || '';
            linkInput.value = '';
            modalTitle.textContent = t.newCard;
        }

        // Abrir modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    /**
     * Atualiza os gráficos no dashboard
     * @param {Object} stats Estatísticas do kanban
     */
    atualizarDashboard(stats) {
        // Atualizar valores
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-concluidos').textContent = stats.concluidos;
        document.getElementById('stat-andamento').textContent = stats.emAndamento;
        document.getElementById('stat-atrasados').textContent = stats.atrasados;

        // Atualizar gráficos
        this.renderizarGraficoStatus(stats.porStatus);
        this.renderizarGraficoPrioridade(stats.porPrioridade);
    }

    /**
     * Renderiza gráfico de status
     * @param {Object} data Dados de status
     */
    renderizarGraficoStatus(data) {
        const ctx = document.getElementById('status-chart').getContext('2d');

        if (window.statusChart) window.statusChart.destroy();

        window.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#2563eb', // Em andamento
                        '#16a34a', // Concluído
                        '#f59e42', // Aguardando
                        '#ef4444'  // Rejeitado
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: this.theme === 'dark' ? '#fff' : '#333'
                        }
                    }
                }
            }
        });
    }

    /**
     * Renderiza gráfico de prioridade
     * @param {Object} data Dados de prioridade
     */
    renderizarGraficoPrioridade(data) {
        const ctx = document.getElementById('priority-chart').getContext('2d');

        if (window.priorityChart) window.priorityChart.destroy();

        window.priorityChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#ef4444', // Alta
                        '#f59e42', // Média
                        '#16a34a'  // Baixa
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: this.theme === 'dark' ? '#fff' : '#333'
                        }
                    }
                }
            }
        });
    }

    /**
     * Renderiza o calendário com eventos baseados nos prazos
     * @param {Array} cards Lista de cartões com prazos
     */
    renderizarCalendario(cards) {
        const calendarEl = document.getElementById('calendar');

        if (window.calendar) {
            window.calendar.destroy();
        }

        // Mapear cartões para eventos do calendário
        const eventos = cards
            .filter(card => card.prazo)
            .map(card => {
                const color = card.status === 'Concluído' ? '#16a34a' : 
                             new Date(card.prazo) < new Date() ? '#ef4444' : '#2563eb';

                return {
                    id: `card-${card.id}`,
                    title: card.title,
                    start: card.prazo,
                    color: color,
                    extendedProps: {
                        description: card.description,
                        status: card.status
                    }
                };
            });

        // Inicializar calendário
        window.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: getFullCalendarLocale(),
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: eventos,
            eventClick: function(info) {
                alert(`Cartão: ${info.event.title}\nStatus: ${info.event.extendedProps.status}\nDescrição: ${info.event.extendedProps.description || 'Sem descrição'}`);
            },
            themeSystem: 'bootstrap',
            height: 'auto'
        });

        window.calendar.render();
    }

    /**
     * Exibe um toast de notificação
     * @param {String} message Mensagem a ser exibida
     * @param {String} type Tipo do toast (success, danger, warning, info)
     */
    exibirToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast kanban-toast bg-${type} text-white show`;
        toast.innerHTML = `
            <div class="toast-body">
                <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                ${message}
            </div>
        `;

        container.appendChild(toast);

        // Remover toast após a animação
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Obtém ícone para toast baseado no tipo
     * @param {String} type Tipo do toast
     * @returns {String} Nome do ícone FontAwesome
     */
    getToastIcon(type) {
        const iconMap = {
            'success': 'check-circle',
            'danger': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };

        return iconMap[type] || 'info-circle';
    }

    /**
     * Exibe modal de confirmação
     * @param {String} message Mensagem de confirmação
     * @param {String} title Título do modal
     * @param {Function} onConfirm Função a ser executada ao confirmar
     */
    exibirConfirmacao(message, title, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;

        const confirmButton = document.getElementById('confirmationConfirm');

        // Remover event listeners anteriores
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

        // Adicionar novo event listener
        newConfirmButton.addEventListener('click', () => {
            onConfirm();
            bootstrap.Modal.getInstance(modal).hide();
        });

        // Exibir modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    /**
     * Retorna a classe Bootstrap para o status do cartão
     */
    getStatusClass(status) {
        switch (status) {
            case 'Em andamento': return 'primary';
            case 'Concluído': return 'success';
            case 'Aguardando': return 'warning';
            case 'Rejeitado': return 'danger';
            default: return 'secondary';
        }
    }
}

/**
 * Módulo Controller - Gerencia as interações do usuário
 */
class KanbanController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        // Adicionar listener para atualizações do modelo
        this.model.addListener(() => {
            this.view.renderizar();
        });
    }

    /**
     * Inicializa o controller
     */
    inicializar() {
        this.view.renderizar();

        // Funções globais para uso em eventos HTML
        window.exportarKanban = () => this.exportar();
        window.importarKanban = (event) => this.importar(event);
    }

    /**
     * Adiciona uma nova coluna
     * @param {String} nome Nome da coluna
     * @param {String} cor Cor da coluna
     */
    adicionarColuna(nome, cor) {
        const id = this.model.adicionarColuna(nome, cor);
        this.view.exibirToast(`Coluna "${nome}" adicionada!`, 'success');
        return id;
    }

    /**
     * Edita uma coluna existente
     * @param {Number} id ID da coluna
     * @param {String} nome Novo nome
     * @param {String} cor Nova cor
     */
    editarColuna(id, nome, cor) {
        const sucesso = this.model.editarColuna(id, nome, cor);

        if (sucesso) {
            this.view.exibirToast(`Coluna atualizada!`, 'success');
        } else {
            this.view.exibirToast(`Erro ao editar coluna!`, 'danger');
        }

        return sucesso;
    }

    /**
     * Cria um quadro inicial para o primeiro uso
     * @returns {Boolean} Se o quadro foi criado
     */
    criarQuadroInicial() {
        const sucesso = this.model.criarQuadroInicial();

        if (sucesso) {
            this.view.exibirToast(getTranslationSet().templateLoaded, 'success');
        }

        return sucesso;
    }

    /**
     * Confirma e remove uma coluna
     * @param {Number} id ID da coluna
     */
    confirmarRemoverColuna(id) {
        const colunas = this.model.getColunas();
        const coluna = colunas.find(c => c.id === id);

        if (!coluna) return;

        const temCartoes = coluna.cards && coluna.cards.length > 0;
        const mensagem = temCartoes 
            ? `A coluna "${coluna.name}" contém ${coluna.cards.length} cartões que também serão removidos. Deseja continuar?` 
            : `Deseja remover a coluna "${coluna.name}"?`;

        this.view.exibirConfirmacao(
            mensagem,
            'Remover coluna?',
            () => this.removerColuna(id, coluna.name)
        );
    }

    /**
     * Remove uma coluna
     * @param {Number} id ID da coluna
     * @param {String} nome Nome da coluna (para log)
     */
    removerColuna(id, nome) {
        this.model.removerColuna(id);
        this.view.exibirToast(`Coluna removida!`, 'info');
    }

    /**
     * Adiciona um novo cartão
     * @param {Object} cartao Dados do cartão
     */
    adicionarCartao(cartao) {
        const id = this.model.adicionarCartao(cartao);

        if (id) {
            this.view.exibirToast(`Cartão adicionado com sucesso!`, 'success');
        } else {
            this.view.exibirToast(`Erro ao adicionar cartão!`, 'danger');
        }

        return id;
    }

    /**
     * Edita um cartão existente
     * @param {Number} colunaId ID da coluna
     * @param {Number} cartaoId ID do cartão
     * @param {Object} cartao Novos dados
     */
    editarCartao(colunaOrigemId, cartaoId, cartao, colunaDestinoId = colunaOrigemId) {
        const sucesso = this.model.editarCartao(colunaOrigemId, cartaoId, cartao, colunaDestinoId);

        if (sucesso) {
            this.view.exibirToast(`Cartão atualizado com sucesso!`, 'success');
        } else {
            this.view.exibirToast(`Erro ao atualizar cartão!`, 'danger');
        }

        return sucesso;
    }

    /**
     * Confirma e remove um cartão
     * @param {Number} colunaId ID da coluna
     * @param {Number} cartaoId ID do cartão
     */
    confirmarRemoverCartao(colunaId, cartaoId) {
        const colunas = this.model.getColunas();
        const coluna = colunas.find(c => c.id === colunaId);

        if (!coluna) return;

        const cartao = coluna.cards.find(c => c.id === cartaoId);

        if (!cartao) return;

        this.view.exibirConfirmacao(
            `Deseja remover o cartão "${cartao.title}"?`,
            'Remover cartão?',
            () => this.removerCartao(colunaId, cartaoId, cartao.title)
        );
    }

    /**
     * Remove um cartão
     * @param {Number} colunaId ID da coluna
     * @param {Number} cartaoId ID do cartão
     * @param {String} titulo Título do cartão (para log)
     */
    removerCartao(colunaId, cartaoId, titulo) {
        const sucesso = this.model.removerCartao(colunaId, cartaoId);

        if (sucesso) {
            this.view.exibirToast(`Cartão removido!`, 'info');
        } else {
            this.view.exibirToast(`Erro ao remover cartão!`, 'danger');
        }
    }

    /**
     * Move um cartão para outra coluna
     * @param {Number} cartaoId ID do cartão
     * @param {Number} colunaOrigemId ID da coluna de origem
     * @param {Number} colunaDestinoId ID da coluna de destino
     */
    moverCartao(cartaoId, colunaOrigemId, colunaDestinoId) {
        const colunas = this.model.getColunas();
        const colunaOrigem = colunas.find(c => c.id === colunaOrigemId);
        const colunaDestino = colunas.find(c => c.id === colunaDestinoId);

        if (!colunaOrigem || !colunaDestino) return false;

        const cartao = colunaOrigem.cards.find(c => c.id === cartaoId);

        if (!cartao) return false;

        const sucesso = this.model.moverCartao(cartaoId, colunaOrigemId, colunaDestinoId);

        if (sucesso) {
            this.view.exibirToast(`Cartão movido com sucesso!`, 'success');
        }

        return sucesso;
    }

    /**
     * Duplica um cartão existente
     * @param {Number} cartaoId ID do cartão
     * @param {Number} colunaId ID da coluna
     */
    duplicarCartao(cartaoId, colunaId) {
        const colunas = this.model.getColunas();
        const coluna = colunas.find(c => c.id === colunaId);

        if (!coluna) return false;

        const cartao = coluna.cards.find(c => c.id === cartaoId);

        if (!cartao) return false;

        // Criar uma cópia do cartão com novo ID
        const cartaoDuplicado = {
            titulo: `${cartao.title} (Cópia)`,
            descricao: cartao.description,
            status: cartao.status,
            prioridade: cartao.priority,
            prazo: cartao.prazo,
            link: cartao.link,
            tags: [...(cartao.tags || [])],
            checklist: [...(cartao.checklist || [])].map(item => ({...item, done: false})),
            obs: cartao.obs,
            colunaId: colunaId
        };

        const novoId = this.model.adicionarCartao(cartaoDuplicado);

        if (novoId) {
            this.view.exibirToast(`Cartão duplicado com sucesso!`, 'success');
        } else {
            this.view.exibirToast(`Erro ao duplicar cartão!`, 'danger');
        }

        return novoId;
    }

    /**
     * Abre o modal de coluna
     * @param {Number} colunaId ID da coluna para edição, ou null para nova coluna
     */
    abrirModalColuna(colunaId = null) {
        if (colunaId) {
            const colunas = this.model.getColunas();
            const coluna = colunas.find(c => c.id === colunaId);
            if (coluna) {
                this.view.abrirModalColuna(coluna);
            }
        } else {
            this.view.abrirModalColuna();
        }
    }

    /**
     * Abre o modal de cartão
     * @param {Number} cartaoId ID do cartão para edição, ou null para novo cartão
     * @param {Number} colunaId ID da coluna
     */
    abrirModalCartao(cartaoId = null, colunaId = null) {
        if (!this.model.getColunas().length) {
            this.view.exibirToast(getTranslationSet().createColumnFirst, 'warning');
            this.abrirModalColuna();
            return;
        }

        if (cartaoId) {
            const colunas = this.model.getColunas();
            const coluna = colunas.find(c => c.id === colunaId);

            if (coluna) {
                const cartao = coluna.cards.find(c => c.id === cartaoId);
                if (cartao) {
                    this.view.abrirModalCartao(cartao, colunaId);
                    return;
                }
            }
        }

        this.view.abrirModalCartao(null, colunaId);
    }

    /**
     * Atualiza o dashboard com estatísticas
     */
    atualizarDashboard() {
        const stats = this.model.getEstatisticas();
        this.view.atualizarDashboard(stats);
    }

    /**
     * Atualiza o calendário com cartões
     */
    atualizarCalendario() {
        const cards = this.model.getColunas().flatMap(c => c.cards);
        this.view.renderizarCalendario(cards);
    }

    /**
     * Exporta dados do kanban
     */
    exportar() {
        const dados = this.model.exportarDados();
        const blob = new Blob([dados], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban_airdrop_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.view.exibirToast('Kanban exportado com sucesso!', 'success');
    }

    /**
     * Importa dados para o kanban
     * @param {Event} event Evento de input de arquivo
     */
    importar(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const sucesso = this.model.importarDados(e.target.result);

                if (sucesso) {
                    this.view.renderizar();
                    this.view.exibirToast('Kanban importado com sucesso!', 'success');
                } else {
                    this.view.exibirToast('Erro ao importar dados!', 'danger');
                }
            } catch (error) {
                console.error('Erro na importação:', error);
                this.view.exibirToast('Arquivo de importação inválido!', 'danger');
            }
        };

        reader.readAsText(file);
    }
}

let model;
let controller;
let view;

// ===== Internacionalização =====
const translations = {
    pt: {
        brandBadge: 'Local-first',
        kicker: 'Fluxo local para acompanhar airdrops',
        subtitle: 'Organize oportunidades, tarefas e prazos em um quadro simples salvo no próprio navegador.',
        dashboard: 'Dashboard',
        calendar: 'Calendário',
        summaryColumns: 'Colunas ativas',
        summaryActive: 'Cards ativos',
        summaryOverdue: 'Atrasados',
        search: 'Buscar...',
        status: 'Status',
        inProgress: 'Em andamento',
        done: 'Concluído',
        waiting: 'Aguardando',
        rejected: 'Rejeitado',
        priority: 'Prioridade',
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa',
        newColumn: 'Nova Coluna',
        newCard: 'Novo Cartão',
        save: 'Salvar',
        cancel: 'Cancelar',
        close: 'Fechar',
        columnName: 'Nome da Coluna',
        columnColor: 'Cor da Coluna',
        blue: 'Azul',
        green: 'Verde',
        orange: 'Laranja',
        red: 'Vermelho',
        purple: 'Roxo',
        cyan: 'Ciano',
        gray: 'Cinza',
        cardTitle: 'Título',
        cardColumn: 'Coluna',
        cardDescription: 'Descrição',
        cardStatus: 'Status',
        cardPriority: 'Prioridade',
        cardDue: 'Prazo',
        cardLink: 'Link do Projeto',
        cardLinkPlaceholder: 'https://projeto.xyz',
        cardTags: 'Tags (separadas por vírgula)',
        checklist: 'Checklist',
        newTask: 'Nova tarefa...',
        notes: 'Observações',
        emptyEyebrow: 'Comece pelo fluxo',
        emptyTitle: 'Monte seu primeiro pipeline de airdrops',
        emptyDescription: 'Crie colunas para descoberta, validação e execução ou carregue um quadro inicial com um clique.',
        loadTemplate: 'Usar modelo inicial',
        createColumnFirst: 'Crie uma coluna antes de adicionar cartões.',
        templateLoaded: 'Modelo inicial criado com sucesso!',
        editColumn: 'Editar Coluna',
        editCard: 'Editar Cartão',
        visit: 'Visitar',
        overdueShort: 'Atrasado',
        import: 'Importar',
        export: 'Exportar'
    },
    en: {
        brandBadge: 'Local-first',
        kicker: 'Local workflow for tracking airdrops',
        subtitle: 'Organize opportunities, tasks and deadlines in a simple board saved directly in your browser.',
        dashboard: 'Dashboard',
        calendar: 'Calendar',
        summaryColumns: 'Active columns',
        summaryActive: 'Active cards',
        summaryOverdue: 'Overdue',
        search: 'Search...',
        status: 'Status',
        inProgress: 'In progress',
        done: 'Done',
        waiting: 'Waiting',
        rejected: 'Rejected',
        priority: 'Priority',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        newColumn: 'New Column',
        newCard: 'New Card',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        columnName: 'Column Name',
        columnColor: 'Column Color',
        blue: 'Blue',
        green: 'Green',
        orange: 'Orange',
        red: 'Red',
        purple: 'Purple',
        cyan: 'Cyan',
        gray: 'Gray',
        cardTitle: 'Title',
        cardColumn: 'Column',
        cardDescription: 'Description',
        cardStatus: 'Status',
        cardPriority: 'Priority',
        cardDue: 'Due Date',
        cardLink: 'Project Link',
        cardLinkPlaceholder: 'https://project.xyz',
        cardTags: 'Tags (comma separated)',
        checklist: 'Checklist',
        newTask: 'New task...',
        notes: 'Notes',
        emptyEyebrow: 'Start with the flow',
        emptyTitle: 'Build your first airdrop pipeline',
        emptyDescription: 'Create columns for discovery, validation and execution or load a starter board with one click.',
        loadTemplate: 'Use starter board',
        createColumnFirst: 'Create a column before adding cards.',
        templateLoaded: 'Starter board created successfully!',
        editColumn: 'Edit Column',
        editCard: 'Edit Card',
        visit: 'Open',
        overdueShort: 'Overdue',
        import: 'Import',
        export: 'Export'
    },
    es: {
        brandBadge: 'Local-first',
        kicker: 'Flujo local para seguir airdrops',
        subtitle: 'Organiza oportunidades, tareas y plazos en un tablero simple guardado directamente en tu navegador.',
        dashboard: 'Panel',
        calendar: 'Calendario',
        summaryColumns: 'Columnas activas',
        summaryActive: 'Tarjetas activas',
        summaryOverdue: 'Atrasadas',
        search: 'Buscar...',
        status: 'Estado',
        inProgress: 'En progreso',
        done: 'Completado',
        waiting: 'Esperando',
        rejected: 'Rechazado',
        priority: 'Prioridad',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
        newColumn: 'Nueva Columna',
        newCard: 'Nueva Tarjeta',
        save: 'Guardar',
        cancel: 'Cancelar',
        close: 'Cerrar',
        columnName: 'Nombre de la Columna',
        columnColor: 'Color de la Columna',
        blue: 'Azul',
        green: 'Verde',
        orange: 'Naranja',
        red: 'Rojo',
        purple: 'Morado',
        cyan: 'Cian',
        gray: 'Gris',
        cardTitle: 'Título',
        cardColumn: 'Columna',
        cardDescription: 'Descripción',
        cardStatus: 'Estado',
        cardPriority: 'Prioridad',
        cardDue: 'Fecha Límite',
        cardLink: 'Enlace del Proyecto',
        cardLinkPlaceholder: 'https://proyecto.xyz',
        cardTags: 'Etiquetas (separadas por coma)',
        checklist: 'Checklist',
        newTask: 'Nueva tarea...',
        notes: 'Notas',
        emptyEyebrow: 'Empieza por el flujo',
        emptyTitle: 'Crea tu primer pipeline de airdrops',
        emptyDescription: 'Crea columnas para descubrimiento, validación y ejecución o carga un tablero inicial con un clic.',
        loadTemplate: 'Usar tablero inicial',
        createColumnFirst: 'Crea una columna antes de añadir tarjetas.',
        templateLoaded: 'Tablero inicial creado con éxito.',
        editColumn: 'Editar Columna',
        editCard: 'Editar Tarjeta',
        visit: 'Abrir',
        overdueShort: 'Atrasada',
        import: 'Importar',
        export: 'Exportar'
    },
    zh: {
        brandBadge: '本地优先',
        kicker: '用于跟踪空投的本地流程',
        subtitle: '在浏览器中直接保存，用一个简单的看板组织机会、任务和截止日期。',
        dashboard: '仪表盘',
        calendar: '日历',
        summaryColumns: '进行中的列',
        summaryActive: '进行中的卡片',
        summaryOverdue: '已逾期',
        search: '搜索...',
        status: '状态',
        inProgress: '进行中',
        done: '已完成',
        waiting: '等待中',
        rejected: '已拒绝',
        priority: '优先级',
        high: '高',
        medium: '中',
        low: '低',
        newColumn: '新列',
        newCard: '新卡片',
        save: '保存',
        cancel: '取消',
        close: '关闭',
        columnName: '列名',
        columnColor: '列颜色',
        blue: '蓝色',
        green: '绿色',
        orange: '橙色',
        red: '红色',
        purple: '紫色',
        cyan: '青色',
        gray: '灰色',
        cardTitle: '标题',
        cardColumn: '列',
        cardDescription: '描述',
        cardStatus: '状态',
        cardPriority: '优先级',
        cardDue: '截止日期',
        cardLink: '项目链接',
        cardLinkPlaceholder: 'https://project.xyz',
        cardTags: '标签（逗号分隔）',
        checklist: '清单',
        newTask: '新任务...',
        notes: '备注',
        emptyEyebrow: '先定义流程',
        emptyTitle: '创建你的第一个空投流程',
        emptyDescription: '为发现、验证和执行创建列，或者一键加载初始看板。',
        loadTemplate: '使用初始看板',
        createColumnFirst: '请先创建一列再添加卡片。',
        templateLoaded: '初始看板创建成功！',
        editColumn: '编辑列',
        editCard: '编辑卡片',
        visit: '打开',
        overdueShort: '逾期',
        import: '导入',
        export: '导出'
    }
};

function getCurrentLang() {
    return localStorage.getItem('kanban-lang') || 'pt';
}

function setCurrentLang(lang) {
    localStorage.setItem('kanban-lang', lang);
}

function getTranslationSet() {
    return translations[getCurrentLang()] || translations.pt;
}

function getLocaleForCalendar() {
    const localeMap = {
        pt: 'pt-BR',
        en: 'en-US',
        es: 'es-ES',
        zh: 'zh-CN'
    };

    return localeMap[getCurrentLang()] || 'pt-BR';
}

function getFullCalendarLocale() {
    const localeMap = {
        pt: 'pt-br',
        en: 'en',
        es: 'es',
        zh: 'zh-cn'
    };

    return localeMap[getCurrentLang()] || 'pt-br';
}

function translatePage() {
    const lang = getCurrentLang();
    const t = getTranslationSet();

    document.documentElement.lang = lang;
    document.title = 'AirdropBoard';

    const kicker = document.getElementById('app-kicker');
    if (kicker) kicker.textContent = t.kicker;

    const subtitle = document.getElementById('main-subtitle');
    if (subtitle) subtitle.textContent = t.subtitle;

    const badge = document.getElementById('main-pro-badge');
    if (badge) badge.textContent = t.brandBadge;

    const summaryColumns = document.getElementById('summary-columns-label');
    if (summaryColumns) summaryColumns.textContent = t.summaryColumns;

    const summaryActive = document.getElementById('summary-active-label');
    if (summaryActive) summaryActive.textContent = t.summaryActive;

    const summaryOverdue = document.getElementById('summary-overdue-label');
    if (summaryOverdue) summaryOverdue.textContent = t.summaryOverdue;

    // Botões principais
    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) dashboardBtn.innerHTML = `<i class="fas fa-chart-line"></i> ${t.dashboard}`;

    const calendarBtn = document.getElementById('calendar-btn');
    if (calendarBtn) calendarBtn.innerHTML = `<i class="fas fa-calendar-alt"></i> ${t.calendar}`;

    // Filtros
    const searchInput = document.getElementById('busca');
    if (searchInput) searchInput.placeholder = t.search;

    const statusSelect = document.getElementById('filtro-status');
    if (statusSelect) {
        statusSelect.options[0].text = t.status;
        statusSelect.options[1].text = t.inProgress;
        statusSelect.options[2].text = t.done;
        statusSelect.options[3].text = t.waiting;
        statusSelect.options[4].text = t.rejected;
    }
    const prioritySelect = document.getElementById('filtro-prioridade');
    if (prioritySelect) {
        prioritySelect.options[0].text = t.priority;
        prioritySelect.options[1].text = t.high;
        prioritySelect.options[2].text = t.medium;
        prioritySelect.options[3].text = t.low;
    }

    // Botões de coluna/cartão
    const newColBtn = document.getElementById('new-column-btn');
    if (newColBtn) newColBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.newColumn}`;

    const newCardBtn = document.getElementById('new-card-btn');
    if (newCardBtn) newCardBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.newCard}`;

    // Modal Coluna
    const modalColTitle = document.querySelector('#modalColuna .modal-title');
    if (modalColTitle) {
        modalColTitle.textContent = document.getElementById('coluna-id')?.value ? t.editColumn : t.newColumn;
    }

    const colNameLabel = document.querySelector('label[for="nome-coluna"]');
    if (colNameLabel) colNameLabel.textContent = t.columnName;

    const colColorLabel = document.querySelector('label[for="cor-coluna"]');
    if (colColorLabel) colColorLabel.textContent = t.columnColor;

    const colColorSelect = document.getElementById('cor-coluna');
    if (colColorSelect) {
        colColorSelect.options[0].text = t.blue;
        colColorSelect.options[1].text = t.green;
        colColorSelect.options[2].text = t.orange;
        colColorSelect.options[3].text = t.red;
        colColorSelect.options[4].text = t.purple;
        colColorSelect.options[5].text = t.cyan;
        colColorSelect.options[6].text = t.gray;
    }

    const colSaveBtn = document.querySelector('#form-coluna button[type="submit"]');
    if (colSaveBtn) colSaveBtn.textContent = t.save;

    // Modal Cartão
    const modalCardTitle = document.getElementById('modalCartaoLabel');
    if (modalCardTitle) {
        modalCardTitle.textContent = document.getElementById('modal-cartao-id')?.value ? t.editCard : t.newCard;
    }

    const cardTitleLabel = document.querySelector('label[for="modal-cartao-titulo"]');
    if (cardTitleLabel) cardTitleLabel.textContent = t.cardTitle;

    const cardColLabel = document.querySelector('label[for="modal-cartao-coluna-id"]');
    if (cardColLabel) cardColLabel.textContent = t.cardColumn;

    const cardDescLabel = document.querySelector('label[for="modal-cartao-descricao"]');
    if (cardDescLabel) cardDescLabel.textContent = t.cardDescription;

    const cardStatusLabel = document.querySelector('label[for="modal-cartao-status"]');
    if (cardStatusLabel) cardStatusLabel.textContent = t.cardStatus;

    const cardPriorityLabel = document.querySelector('label[for="modal-cartao-prioridade"]');
    if (cardPriorityLabel) cardPriorityLabel.textContent = t.cardPriority;

    const cardDueLabel = document.querySelector('label[for="modal-cartao-prazo"]');
    if (cardDueLabel) cardDueLabel.textContent = t.cardDue;

    const cardLinkLabel = document.querySelector('label[for="modal-cartao-link"]');
    if (cardLinkLabel) cardLinkLabel.textContent = t.cardLink;

    const cardLinkInput = document.getElementById('modal-cartao-link');
    if (cardLinkInput) cardLinkInput.placeholder = t.cardLinkPlaceholder;

    const cardTagsLabel = document.querySelector('label[for="modal-cartao-tags"]');
    if (cardTagsLabel) cardTagsLabel.textContent = t.cardTags;

    const checklistLabel = document.querySelector('#checklist-container')?.previousElementSibling;
    if (checklistLabel) checklistLabel.textContent = t.checklist;

    const newTaskInput = document.getElementById('novo-checklist-item');
    if (newTaskInput) newTaskInput.placeholder = t.newTask;

    const notesLabel = document.querySelector('label[for="modal-cartao-obs"]');
    if (notesLabel) notesLabel.textContent = t.notes;

    // Botões de ação do modal cartão
    const cardCancelBtn = document.querySelector('#form-modal-cartao button.btn-outline-secondary');
    if (cardCancelBtn) cardCancelBtn.textContent = t.cancel;

    const cardSaveBtn = document.querySelector('#form-modal-cartao button.btn-success');
    if (cardSaveBtn) cardSaveBtn.textContent = t.save;
}

function initializeApplication() {
    model = new KanbanModel();
    view = new KanbanView(model, null);
    controller = new KanbanController(model, view);
    view.controller = controller;

    window.controller = controller;
    window.exportarKanban = () => controller.exportar();
    window.importarKanban = (event) => controller.importar(event);
    window.toast = (msg, type) => view.exibirToast(msg, type);

    document.getElementById('dashboardModal').addEventListener('shown.bs.modal', () => {
        controller.atualizarDashboard();
    });

    document.getElementById('calendarModal').addEventListener('shown.bs.modal', () => {
        controller.atualizarCalendario();
    });

    controller.inicializar();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();

    const langSwitcher = document.getElementById('language-switcher-inline');
    const lang = getCurrentLang();

    if (langSwitcher) {
        const btns = langSwitcher.querySelectorAll('.lang-btn');
        btns.forEach(btn => {
            if (btn.dataset.lang === lang) btn.classList.add('active');

            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                setCurrentLang(btn.dataset.lang);
                translatePage();

                if (window.controller) {
                    window.controller.view.renderizar();
                }
            });
        });
    }

    translatePage();

    if (window.controller) {
        window.controller.view.renderizar();
    }
});
