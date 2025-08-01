// =================================================================================
// C A T Á L O G O   D E   P R O D U C T O S  -  C U S T O M   W E A R
// =================================================================================
// Descripción: Script para cargar, filtrar y mostrar productos desde Google Sheets.
// Autor: Leonel Lupino
// Versión: 2.3 (Correccion parametros URL)
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ESTADO Y SELECTORES GLOBALES ---
    const state = {
        categoriaActual: 'Caballero',
        subcategoriaActual: 'TODOS',
        terminoBusqueda: '',
        productos: [],
        productosFiltrados: []
    };

    const DOM = {
        tituloPagina: document.querySelector('title'),
        bannerPrincipal: document.getElementById('banner-principal'),
        contenedorProductos: document.getElementById('products'),
        inputBusqueda: document.getElementById('search'),
        selectorSubcatDesktop: document.getElementById('subcategoria-selector-desktop'),
        selectorSubcatMobile: document.getElementById('subcategoria-selector-mobile'),
        modalImagen: document.getElementById('imgModal'),
        imgModal: document.querySelector('#imgModal img'),
        btnScrollTop: document.getElementById('scrollTopBtn'),
        menuToggle: document.getElementById('menu-toggle'),
        menu: document.getElementById('menu')
    };
    
    // --- 2. INICIALIZACIÓN ---
    function init() {
        initStateFromURL();
        setupEventListeners();
        actualizarUICompleta();
        cargarProductos();
    }

    function initStateFromURL() {
        const params = new URLSearchParams(location.search);
        state.categoriaActual = params.get('cat') || 'Caballero';
        state.subcategoriaActual = params.get('subcat') || 'TODOS';
        state.terminoBusqueda = params.get('search') || '';
        DOM.inputBusqueda.value = state.terminoBusqueda;
    }

    // --- 3. MANEJO DE DATOS (GOOGLE SHEETS) ---
    async function cargarProductos() {
        mostrarMensajeCarga(true);
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.googleSheetId}/gviz/tq?tqx=out:json&sheet=${state.categoriaActual}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error en la respuesta de la red');
            const text = await response.text();
            const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonText);
            state.productos = parseDataByHeaders(data.table);
            filtrarYRenderizarProductos();
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            mostrarMensajeError();
        } finally {
            mostrarMensajeCarga(false);
        }
    }

    function parseDataByHeaders(table) {
        if (!table || !table.cols || !table.rows) return [];
        const headers = table.cols.map(col => col.label);
        return table.rows
            .filter(row => row && row.c && row.c.some(cell => cell && cell.v !== null && cell.v !== ''))
            .map(row => {
                const item = {};
                headers.forEach((header, index) => {
                    const value = row.c[index]?.v;
                    item[header] = value !== null ? value : '';
                });
                return item;
            });
    }

    // --- 4. RENDERIZADO Y ACTUALIZACIÓN DE LA UI ---
    function actualizarUICompleta() {
        const textosTipo = CONFIG.textos[tipo];
        DOM.tituloPagina.textContent = textosTipo.tituloPagina;
        DOM.bannerPrincipal.src = textosTipo.bannerUrl;
        actualizarBotonesActivos('.categoria-selector button', 'data-categoria', state.categoriaActual);
        generarControlesSubcategoria();
    }

    function filtrarYRenderizarProductos() {
        const { productos, subcategoriaActual, terminoBusqueda } = state;
        const filtrosSubcat = CONFIG.subcategorias[subcategoriaActual] || [];
        const { codigo, nombre, stock } = CONFIG.nombresColumnas;

        state.productosFiltrados = productos.filter(item => {
            const stockValue = String(item[stock] || '').trim().toLowerCase();
            const tieneStock = stockValue !== 'sin stock' && stockValue !== 'agotado' && stockValue !== '0';
            if (!tieneStock) return false;
            
            const codigoProducto = String(item[codigo] || '').substring(0, 4).toUpperCase();
            const cumpleSubcat = subcategoriaActual === 'TODOS' || filtrosSubcat.includes(codigoProducto);
            
            const nombreProducto = String(item[nombre] || '').toLowerCase();
            const cumpleBusqueda = nombreProducto.includes(terminoBusqueda.toLowerCase());

            return cumpleSubcat && cumpleBusqueda;
        });

        if (state.subcategoriaActual === 'TODOS') {
            state.productosFiltrados.sort((a, b) => {
                const stockA = String(a[stock] || '').toLowerCase();
                const stockB = String(b[stock] || '').toLowerCase();
                const aIsSpecial = stockA === 'nuevo' || stockA === 'reingreso';
                const bIsSpecial = stockB === 'nuevo' || stockB === 'reingreso';
                if (aIsSpecial && !bIsSpecial) return -1;
                if (!aIsSpecial && bIsSpecial) return 1;
                return 0;
            });
        }
        
        renderizarProductos();
        actualizarURL();
    }

    function renderizarProductos() {
        DOM.contenedorProductos.innerHTML = '';
        if (state.productosFiltrados.length === 0) {
            DOM.contenedorProductos.innerHTML = '<p class="info-msg">No se encontraron productos con estos filtros.</p>';
            return;
        }
        const fragment = document.createDocumentFragment();
        state.productosFiltrados.forEach(item => fragment.appendChild(crearElementoProducto(item)));
        DOM.contenedorProductos.appendChild(fragment);
    }

    function crearElementoProducto(item) {
        const { nombresColumnas, textos } = CONFIG;
        const esMayorista = tipo === 'mayorista';

        const precio = esMayorista ? item[nombresColumnas.precioMayorista] : item[nombresColumnas.precioMinorista];
        const precioPromo = esMayorista ? item[nombresColumnas.precioSugerido] : item[nombresColumnas.precioPromo];
        const imagen = item[nombresColumnas.imagen] || 'img/imagen-generica.png';
        const stockValueRaw = item[nombresColumnas.stock];
        const stockValueLower = String(stockValueRaw).trim().toLowerCase();
        
        const productDiv = document.createElement('div');
        let productClasses = 'product';
        let badgeHTML = '';

        if (stockValueLower === 'nuevo') {
            badgeHTML = '<div class="product-badge badge-new">Nuevo</div>';
            productClasses += ' product-new'; // Añade la clase para el borde
        } else if (stockValueLower === 'reingreso') {
            badgeHTML = '<div class="product-badge badge-reentry">Reingreso</div>';
        } else if (!isNaN(stockValueRaw) && Number(stockValueRaw) <= 5 && Number(stockValueRaw) > 0) {
            badgeHTML = `<div class="product-badge badge-last-units">¡Últimas ${Number(stockValueRaw)}!</div>`;
        }

        productDiv.className = productClasses;
        productDiv.innerHTML = `
            ${badgeHTML}
            <img src="${imagen}" alt="${item[nombresColumnas.nombre]}" loading="lazy" onerror="this.onerror=null; this.src='img/imagen-generica.png';">
            <h4>${item[nombresColumnas.nombre]}</h4>
            <div class="price-container">
                <div class="price-line">
                    <span class="price-label">${textos[tipo].etiquetaPrecio}:</span>
                    <span class="price-value">$${formatearPrecio(precio)}</span>
                </div>
                <div class="price-line">
                    <span class="price-label">${textos[tipo].etiquetaPromo}:</span>
                    <span class="price-value">$${formatearPrecio(precioPromo)}</span>
                </div>
            </div>
        `;
        return productDiv;
    }

    function generarControlesSubcategoria() {
        const subcategorias = Object.keys(CONFIG.subcategorias);
        DOM.selectorSubcatDesktop.innerHTML = subcategorias.map(subcat => `<button data-subcategoria="${subcat}">${subcat}</button>`).join('');
        DOM.selectorSubcatMobile.innerHTML = `
            <label for="subcat-select">Filtrar:</label>
            <select id="subcat-select">
                ${subcategorias.map(subcat => `<option value="${subcat}">${subcat}</option>`).join('')}
            </select>`;
        document.getElementById('subcat-select').value = state.subcategoriaActual;
        actualizarBotonesActivos('.subcategoria-selector button', 'data-subcategoria', state.subcategoriaActual);
    }

    function mostrarMensajeCarga(mostrar) {
        if (mostrar) DOM.contenedorProductos.innerHTML = '<p class="info-msg">Cargando productos...</p>';
    }
    
    function mostrarMensajeError() {
        DOM.contenedorProductos.innerHTML = '<p class="info-msg error">Hubo un error al cargar el catálogo. Intenta de nuevo más tarde.</p>';
    }

    function actualizarBotonesActivos(selector, dataAttribute, valorActivo) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute(dataAttribute).toLowerCase() === valorActivo.toLowerCase());
        });
    }

    // --- 5. MANEJO DE EVENTOS ---
    function setupEventListeners() {
        document.querySelector('.categoria-selector').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                state.categoriaActual = e.target.getAttribute('data-categoria');
                state.subcategoriaActual = 'TODOS';
                state.terminoBusqueda = '';
                DOM.inputBusqueda.value = '';
                actualizarUICompleta();
                cargarProductos();
            }
        });
        
        DOM.selectorSubcatDesktop.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                state.subcategoriaActual = e.target.getAttribute('data-subcategoria');
                document.getElementById('subcat-select').value = state.subcategoriaActual;
                actualizarBotonesActivos('.subcategoria-selector button', 'data-subcategoria', state.subcategoriaActual);
                filtrarYRenderizarProductos();
            }
        });

        DOM.selectorSubcatMobile.addEventListener('change', e => {
            state.subcategoriaActual = e.target.value;
            actualizarBotonesActivos('.subcategoria-selector button', 'data-subcategoria', state.subcategoriaActual);
            filtrarYRenderizarProductos();
        });
        
        DOM.inputBusqueda.addEventListener('keyup', () => {
            state.terminoBusqueda = DOM.inputBusqueda.value;
            filtrarYRenderizarProductos();
        });
        document.getElementById('search-button').addEventListener('click', () => {
            state.terminoBusqueda = DOM.inputBusqueda.value;
            filtrarYRenderizarProductos();
        });
        
        DOM.contenedorProductos.addEventListener('click', e => {
            if (e.target.tagName === 'IMG' && e.target.closest('.product')) {
                DOM.imgModal.src = e.target.src;
                DOM.modalImagen.style.display = "flex";
                document.body.style.overflow = "hidden";
            }
        });

        DOM.modalImagen.addEventListener('click', () => cerrarModal());
        document.addEventListener('keydown', e => { if (e.key === "Escape") cerrarModal(); });
        
        DOM.menuToggle.addEventListener('click', () => DOM.menu.classList.toggle('active'));

        window.addEventListener('scroll', () => {
            DOM.btnScrollTop.style.display = (window.scrollY > 400) ? 'flex' : 'none';
        });
        DOM.btnScrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

        window.addEventListener('popstate', () => {
            initStateFromURL();
            actualizarUICompleta();
            cargarProductos();
        });
    }

    // --- 6. FUNCIONES UTILITARIAS ---
    function cerrarModal() {
        DOM.modalImagen.style.display = "none";
        DOM.imgModal.src = "";
        document.body.style.overflow = "";
    }
    
    function formatearPrecio(valor) {
        const numero = parseFloat(valor);
        if (isNaN(numero)) return '0';
        return numero.toLocaleString('es-AR');
    }

    function actualizarURL() {
        const params = new URLSearchParams({
            tipo: tipo,
            cat: state.categoriaActual,
            subcat: state.subcategoriaActual,
            search: state.terminoBusqueda
        });
        history.pushState(state, '', `${window.location.pathname}?${params.toString()}`);
    }

    // --- 7. EJECUCIÓN ---
    init();
});
