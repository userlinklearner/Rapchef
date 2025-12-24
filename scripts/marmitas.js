(function () {
    const cacheBust = 'v=2';
    const candidateDataUrls = [
        `marmitas nomeadas/marmitas.json?${cacheBust}`,
        `marmitas-nomeadas/marmitas.json?${cacheBust}`,
        `marmitas_nomeadas/marmitas.json?${cacheBust}`,
        `marmitas/marmitas.json?${cacheBust}`,
        `./marmitas nomeadas/marmitas.json?${cacheBust}`,
        `./marmitas-nomeadas/marmitas.json?${cacheBust}`
    ];

    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const sortSelect = document.getElementById('sortSelect');

    let items = [];

    const SVG_PLACEHOLDER = 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22360%22 viewBox=%220 0 640 360%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23FFF8F0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2324543B%22 font-family=%22DM Sans, Arial, sans-serif%22 font-size=%2220%22%3EImagem indisponível%3C/text%3E%3C/svg%3E';

    // Create modal overlay
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal__overlay"></div>
            <div class="image-modal__container">
                <button class="image-modal__close" aria-label="Fechar imagem">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <img class="image-modal__image" src="" alt="">
            </div>
        `;
        document.body.appendChild(modal);

        const overlay = modal.querySelector('.image-modal__overlay');
        const closeBtn = modal.querySelector('.image-modal__close');

        function closeModal() {
            modal.classList.remove('is-open');
        }

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        return modal;
    }

    const modal = createModal();

    function openModal(imageSrc, alt) {
        const modalImg = modal.querySelector('.image-modal__image');
        modalImg.src = imageSrc;
        modalImg.alt = alt;
        modal.classList.add('is-open');
    }

    function renderItems(list) {
        grid.innerHTML = '';
        if (!list.length) {
            emptyState.hidden = false;
            return;
        }
        emptyState.hidden = true;

        list.forEach(item => {
            const card = document.createElement('article');
            card.className = 'product-card card';

            const img = document.createElement('img');
            img.className = 'product-card__image';
            img.alt = item.name || 'Marmita RapChef';
            img.style.cursor = 'pointer';

            // Build candidate image paths
            const tryPaths = [];

            if (item.image) {
                const basename = item.image.split('/').pop();
                tryPaths.push(`marmitas nomeadas/${basename}`);
                tryPaths.push(`marmitas-nomeadas/${basename}`);
                tryPaths.push(`marmitas/${basename}`);
                tryPaths.push(item.image);
            }

            let attemptIndex = 0;
            function setNextSrc() {
                if (attemptIndex >= tryPaths.length) {
                    img.src = SVG_PLACEHOLDER;
                    return;
                }
                const p = tryPaths[attemptIndex++];
                img.src = encodeURI(p);
            }

            img.onerror = () => {
                setNextSrc();
            };

            // Click to zoom
            img.addEventListener('click', () => {
                openModal(img.src, img.alt);
            });

            setNextSrc();

            const body = document.createElement('div');
            body.className = 'product-card__body';

            const title = document.createElement('div');
            title.className = 'product-card__title';
            title.textContent = item.name || 'Sem nome';

            body.appendChild(title);

            if (item.description) {
                const desc = document.createElement('div');
                desc.className = 'product-card__desc';
                desc.textContent = item.description;
                body.appendChild(desc);
            }

            const meta = document.createElement('div');
            meta.className = 'product-card__meta';

            // Handle multiple categories
            const cats = Array.isArray(item.categories) ? item.categories : (item.category ? [item.category] : []);
            cats.forEach(cat => {
                const catBadge = document.createElement('div');
                catBadge.className = 'product-category';
                catBadge.textContent = cat;
                catBadge.setAttribute('aria-hidden', 'true');
                meta.appendChild(catBadge);
            });

            body.appendChild(meta);

            card.appendChild(img);
            card.appendChild(body);
            grid.appendChild(card);
        });
    }

    function populateCategories(list) {
        const cats = [];
        list.forEach(item => {
            const itemCats = Array.isArray(item.categories) ? item.categories : (item.category ? [item.category] : []);
            cats.push(...itemCats);
        });
        const uniqueCats = [...new Set(cats)].filter(Boolean).sort((a,b) => a.localeCompare(b, 'pt-BR'));
        uniqueCats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            categorySelect.appendChild(opt);
        });
    }

    function applyFilters() {
        const q = (searchInput.value || '').toLowerCase().trim();
        const selectedCat = categorySelect.value;
        let filtered = items.slice();

        // Filter by category — product matches if ANY of its categories match
        if (selectedCat) {
            filtered = filtered.filter(i => {
                const itemCats = Array.isArray(i.categories) ? i.categories : (i.category ? [i.category] : []);
                return itemCats.includes(selectedCat);
            });
        }

        // Filter by search
        if (q) {
            filtered = filtered.filter(i => {
                const itemCats = Array.isArray(i.categories) ? i.categories.join(' ') : (i.category || '');
                return ((i.name || '') + ' ' + (i.description || '') + ' ' + itemCats).toLowerCase().includes(q);
            });
        }

        // Sort
        const sort = sortSelect.value;
        if (sort === 'name-asc') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        else if (sort === 'name-desc') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'pt-BR'));

        renderItems(filtered);
    }

    function wireEvents() {
        searchInput.addEventListener('input', applyFilters);
        categorySelect.addEventListener('change', applyFilters);
        sortSelect.addEventListener('change', applyFilters);
    }

    async function fetchFirstAvailable(urls) {
        const tried = [];
        for (const raw of urls) {
            tried.push(raw);
            try {
                const res = await fetch(encodeURI(raw), { cache: 'no-store' });
                if (!res.ok) {
                    console.info('catalog fetch failed for', raw, res.status);
                    continue;
                }
                const json = await res.json();
                return { json, tried };
            } catch (err) {
                console.info('catalog fetch error for', raw, err && err.message);
                continue;
            }
        }
        return { json: null, tried };
    }

    (async function init() {
        const { json, tried } = await fetchFirstAvailable(candidateDataUrls);
        if (!json || !Array.isArray(json) || !json.length) {
            emptyState.hidden = false;
            emptyState.textContent = 'Não foi possível carregar o cardápio. Verifique marmitas.json nas pastas: ' + tried.join(' · ');
            console.warn('Tried catalog URLs:', tried);
            return;
        }

        items = json;
        populateCategories(items);
        wireEvents();
        renderItems(items);
    })();
})();
