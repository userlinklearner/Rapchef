(function () {
    const freezerSelect = document.getElementById('freezerSelect');
    const nameFilterInput = document.getElementById('searchNameInput');
    const tableBody = document.getElementById('tableBody');
    const statusSection = document.getElementById('statusSection');
    const lastUpdateText = document.getElementById('lastUpdateText');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const tableSection = document.getElementById('tableSection');
    const emptySection = document.getElementById('emptySection');
    const emptyMessage = document.getElementById('emptyMessage');
    const refreshBtn = document.getElementById('refreshBtn');
    const orderWhatsAppBtn = document.getElementById('orderWhatsAppBtn');

    let items = [];
    let deposits = [];
    const initialFreezerOptions = freezerSelect ? Array.from(freezerSelect.options).map(opt => opt.cloneNode(true)) : [];
    let selectedDepositId = null;

    function setSectionsVisibility({ loading = false, error = false, table = false, empty = false, status = false }) {
        loadingSection.style.display = loading ? '' : 'none';
        errorSection.style.display = error ? '' : 'none';
        tableSection.style.display = table ? '' : 'none';
        emptySection.style.display = empty ? '' : 'none';
        statusSection.style.display = status ? '' : 'none';
    }

    function formatDate(dateInput) {
        const date = dateInput ? new Date(dateInput) : null;
        if (!date || Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function normalizeItem(item) {
        // Derive stock from matching deposit in the first grade (API nests stock per grade).
        const grade = Array.isArray(item.grades) && item.grades.length ? item.grades[0] : null;
        const stockEntry = Array.isArray(grade?.estoque)
            ? grade.estoque.find(e => String(e.id_deposito) === String(selectedDepositId))
            : null;

        const quantityRaw =
            stockEntry?.saldo ??
            item.quantity ?? item.quantidade ?? item.stock ?? item.qtd ?? item.unidades ?? item.estoque ?? 0;
        const quantity = Number.isFinite(Number(quantityRaw)) ? Number(quantityRaw) : 0;

        const updatedAt =
            stockEntry?.data ||
            grade?.ultima_alteracao ||
            item.updatedAt ||
            item.lastUpdated ||
            item.updated_at ||
            item.dataAtualizacao ||
            item.data_atualizacao ||
            item.data ||
            item.updated ||
            null;

        const name =
            item.product ||
            item.produto ||
            item.name ||
            item.nome ||
            item.productName ||
            item.descricao ||
            'Produto';

        const status = item.status || (quantity > 0 ? 'Disponível' : 'Indisponível');

        return {
            name,
            quantity,
            status,
            updatedAt
        };
    }

    function extractItems(payload) {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (payload.items && Array.isArray(payload.items)) return payload.items;
        if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;

        // Handle licenca structure (e.g., { licenca: [ { depositos: [], produtos: [...] } ] })
        const licencas = payload.data?.licenca || payload.licenca;
        if (Array.isArray(licencas) && licencas.length) {
            const first = licencas[0] || {};
            const candidates = first.produtos || first.products || first.estoque || first.items || [];
            if (Array.isArray(candidates)) return candidates;
        }

        return [];
    }

    function renderTable(list) {
        tableBody.innerHTML = '';
        list.forEach(item => {
            const tr = document.createElement('tr');

            const nameTd = document.createElement('td');
            nameTd.textContent = item.name || 'Produto';

            const quantityTd = document.createElement('td');
            quantityTd.textContent = Number.isFinite(item.quantity) ? item.quantity : '0';

            const statusTd = document.createElement('td');
            statusTd.textContent = item.status || (item.quantity > 0 ? 'Disponível' : 'Indisponível');

            const updateTd = document.createElement('td');
            updateTd.textContent = formatDate(item.updatedAt) || '—';

            tr.appendChild(nameTd);
            tr.appendChild(quantityTd);
            tr.appendChild(statusTd);
            tr.appendChild(updateTd);
            tableBody.appendChild(tr);
        });
    }

    function applyFilters() {
        let filtered = [...items];

        const query = (nameFilterInput?.value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (query) {
            filtered = filtered.filter(item => {
                const normalizedName = (item.name || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                return normalizedName.includes(query);
            });
        }

        if (!filtered.length) {
            renderTable([]);
            emptyMessage.textContent = 'Nenhuma informação disponível no momento para este freezer.';
            setSectionsVisibility({ loading: false, error: false, table: false, empty: true, status: true });
            return;
        }

        renderTable(filtered);
        setSectionsVisibility({ loading: false, error: false, table: true, empty: false, status: true });
    }

    function setError(message) {
        errorMessage.textContent = message || 'Não foi possível carregar o estoque.';
        setSectionsVisibility({ loading: false, error: true, table: false, empty: false, status: false });
    }

    async function loadStock() {
        const freezer = freezerSelect.value;
        if (!freezer) {
            setError('Selecione um freezer para ver o estoque.');
            return;
        }

        setSectionsVisibility({ loading: true, error: false, table: false, empty: false, status: false });

        const today = new Date().toISOString().slice(0, 10);
        const url = `/api/stock?freezer=${encodeURIComponent(freezer)}&date=${encodeURIComponent(today)}`;

        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const payload = await response.json().catch(() => null);

            if (!response.ok || !payload) {
                throw new Error((payload && payload.error) || `Erro ao buscar estoque (${response.status})`);
            }

            const rawItems = extractItems(payload.data ?? payload);
            items = rawItems.map(normalizeItem);

            applyFilters();

            const lastUpdate = payload.meta?.fetchedAt || payload.lastUpdate || new Date().toISOString();
            lastUpdateText.textContent = `Atualizado em ${formatDate(lastUpdate)}`;
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados do estoque.');
        }
    }

    function handleFreezerChange() {
        if (!freezerSelect.value) {
            items = [];
            renderTable([]);
            setSectionsVisibility({ loading: false, error: false, table: false, empty: false, status: false });
            return;
        }
        selectedDepositId = freezerSelect.value;
        loadStock();
    }

    function slugify(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'freezer';
    }

    function normalizeDeposit(dep, idx) {
        const name = dep?.name || dep?.nome || dep?.description || dep?.descricao || dep?.deposit || dep?.deposito || dep?.client || dep?.cliente || `Freezer ${idx + 1}`;
        const id = dep?.id ?? dep?.codigo ?? dep?.code ?? idx + 1;
        return {
            name,
            id,
            value: String(id)
        };
    }

    function populateDeposits() {
        if (!freezerSelect) return;

        const placeholder = freezerSelect.querySelector('option[value=""]');
        const hasDeposits = Array.isArray(deposits) && deposits.length > 1;

        freezerSelect.innerHTML = '';

        if (hasDeposits) {
            if (placeholder) {
                freezerSelect.appendChild(placeholder);
            } else {
                freezerSelect.appendChild(new Option('Selecione um freezer', ''));
            }

            // Skip first deposit (already set) and use the rest as clients.
            const usable = deposits.slice(1);
            usable.forEach((dep, idx) => {
                const opt = document.createElement('option');
                opt.value = dep.value;
                opt.textContent = dep.name || `Cliente ${idx + 1}`;
                freezerSelect.appendChild(opt);
            });
        } else if (initialFreezerOptions.length) {
            initialFreezerOptions.forEach(opt => freezerSelect.appendChild(opt.cloneNode(true)));
        } else {
            freezerSelect.appendChild(new Option('Selecione um freezer', ''));
        }

        freezerSelect.disabled = freezerSelect.options.length <= 1;
    }

    async function loadDeposits() {
        try {
            const response = await fetch('/api/deposits', { headers: { Accept: 'application/json' } });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload) {
                throw new Error((payload && payload.error) || `Erro ao buscar unidades (${response.status})`);
            }

            const root = payload.data ?? payload;
            let raw = [];
            if (Array.isArray(root?.licenca) && root.licenca.length) {
                raw = root.licenca[0]?.depositos || [];
            } else if (Array.isArray(root)) {
                raw = root;
            } else if (Array.isArray(root?.items)) {
                raw = root.items;
            }

            deposits = raw.map(normalizeDeposit);
            populateDeposits();
        } catch (err) {
            console.error('Deposits fetch failed:', err.message);
            // Restore initial options on failure so user can still choose manually.
            deposits = [];
            populateDeposits();
        }
    }

    function init() {
        if (freezerSelect) {
            freezerSelect.addEventListener('change', handleFreezerChange);
        }
        if (nameFilterInput) {
            nameFilterInput.addEventListener('input', applyFilters);
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadStock();
            });
        }
        if (orderWhatsAppBtn) {
            orderWhatsAppBtn.addEventListener('click', () => {
                const suggestion = (items && items.length) ? items[0].name : '';
                const dish = prompt('Qual prato você quer pedir?', suggestion || '');
                if (dish === null) return;
                const selectedClient =
                    (freezerSelect && freezerSelect.options[freezerSelect.selectedIndex]?.textContent?.trim()) || '';
                const clientAnswer = prompt('Para qual cliente/unidade?', selectedClient || '');
                if (clientAnswer === null) return;

                const dishText = dish.trim();
                const clientText = clientAnswer.trim() || 'Não informado';
                const text = dishText
                    ? `Olá! Quero pedir o prato "${dishText}". Cliente/Unidade: ${clientText}.`
                    : `Olá! Quero pedir um prato do estoque. Cliente/Unidade: ${clientText}.`;
                const url = `https://wa.me/5511947223641?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            });
        }

        loadDeposits().then(() => {
            // Optionally auto-select the first available freezer to speed up usage.
            if (freezerSelect && !freezerSelect.value && freezerSelect.options.length > 1) {
                freezerSelect.value = freezerSelect.options[1].value;
                selectedDepositId = freezerSelect.value;
                loadStock();
            } else if (freezerSelect && freezerSelect.value) {
                selectedDepositId = freezerSelect.value;
                loadStock();
            }
        });
    }

    init();
})();
