// =================================================================================
// C A T Á L O G O   D E   P R O D U C T O S  -  C U S T O M   W E A R
// =================================================================================
// Versión: 3.1 (Sección de Liquidación Plegable)
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
        seccionLiquidacion: document.getElementById('liquidacion-section'),
        liquidacionHeader: document.getElementById('liquidacion-header'),
        contenedorLiquidacion: document.getElementById('liquidacion-products'),
        contenedorProductosRegulares: document.getElementById('products'),
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
        cargarYProcesarProductos();
    }

    function initStateFromURL() {
        const params = new URLSearchParams(location.search);
        state.categoriaActual = params.get('cat') || 'Caballero';
        state.subcategoriaActual = params.get('subcat') || 'TODOS';
        state.terminoBusqueda = params.get('search') || '';
        DOM.inputBusqueda.value = state.terminoBusqueda;
    }

    // --- 3. MANEJO DE DATOS Y RENDERIZADO PRINCIPAL ---
    async function cargarYProcesarProductos() {
        mostrarMensajeCarga(true, DOM.contenedorProductosRegulares);
        DOM.seccionLiquidacion.classList.add('hidden');
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.googleSheetId}/gviz/tq?tqx=out:json&sheet=${state.categoriaActual}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error en la respuesta de la red');
            const text = await response.text();
            const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonText);
            
            const todosLosProductos = parseDataByHeaders(data.table);
            separarYRenderizarProductos(todosLosProductos);

        } catch (error) {
            console.error('Error al cargar los productos:', error);
            mostrarMensajeError(DOM.contenedorProductosRegulares);
        } finally {
            mostrarMensajeCarga(false, DOM.contenedorProductosRegulares);
        }
    }
    
    function separarYRenderizarProductos(productos) {
        const colLiquidacion = CONFIG.nombresColumnas.liquidacion;
        let productosRegulares = [];
        let productosEnLiquidacion = [];

        if (tipo === 'minorista') {
            for (const producto of productos) {
                const tipoLiquidacion = String(producto[colLiquidacion]);
                if (tipoLiquidacion === '5' || tipoLiquidacion === '6') {
                    productosEnLiquidacion.push(producto);
                } else {
                    productosRegulares.push(producto);
                }
            }
            renderizarSeccionLiquidacion(productosEnLiquidacion);
        } else {
            productosRegulares = productos;
            renderizarSeccionLiquidacion([]);
        }
        
        state.productos = productosRegulares;
        filtrarYRenderizarRegulares();
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

    // --- 4. LÓGICA DE RENDERIZADO ESPECÍFICO ---

    function renderizarSeccionLiquidacion(items) {
        DOM.contenedorLiquidacion.innerHTML = '';
        if (items.length > 0 && tipo === 'minorista') {
            DOM.seccionLiquidacion.classList.remove('hidden');
            const fragment = document.createDocumentFragment();
            items.forEach(item => fragment.appendChild(crearTarjetaLiquidacion(item)));
            DOM.contenedorLiquidacion.appendChild(fragment);
        } else {
            DOM.seccionLiquidacion.classList.add('hidden');
        }
    }

    function crearTarjetaLiquidacion(item) {
        const { nombresColumnas } = CONFIG;
        const precioOriginal = parseFloat(item[nombresColumnas.precioMinorista]);
        const tipoLiquidacion = String(item[nombresColumnas.liquidacion]);
        
        // Lógica de imagen mejorada para ignorar espacios en blanco
        const nombreImagen = item[nombresColumnas.imagen]?.trim();
        const imagen = nombreImagen 
            ? `${CONFIG.rutaBaseImagenes}${nombreImagen}` 
            : 'img/imagen-generica.png';

        let descuento = 0;
        let condicion = '';

        if (tipoLiquidacion === '5') {
            descuento = 0.35;
            condicion = '(Sólo Efectivo/Transferencia)';
        } else if (tipoLiquidacion === '6') {
            descuento = 0.50;
            condicion = '(Sólo Efectivo/Transferencia)';
        }

        const precioFinal = precioOriginal * (1 - descuento);

        const productDiv = document.createElement('div');
        productDiv.className = 'product-liquidacion';
        productDiv.innerHTML = `
            <img 
                src="${imagen}" 
                alt="${item[nombresColumnas.nombre]}"
                loading="lazy"
                onerror="this.onerror=null; this.src='img/imagen-generica.png';"
            >
            <h4>${item[nombresColumnas.nombre]}</h4>
            <div class="precio-liquidacion-container">
                <span class="precio-original">$${formatearPrecio(precioOriginal)}</span>
                <span class="descuento-tag">${descuento * 100}% OFF</span>
                <span class="precio-final">$${formatearPrecio(precioFinal)}</span>
                ${condicion ? `<span class="condicion-pago">${condicion}</span>` : ''}
            </div>
        `;
        return productDiv;
    }
    
    function filtrarYRenderizarRegulares() {
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
        
        renderizarProductosRegulares();
        actualizarURL();
    }

    function renderizarProductosRegulares() {
        DOM.contenedorProductosRegulares.innerHTML = '';
        if (state.productosFiltrados.length === 0 && DOM.contenedorLiquidacion.innerHTML === '') {
             DOM.contenedorProductosRegulares.innerHTML = '<p class="info-msg">No se encontraron productos con estos filtros.</p>';
        } else if (state.productosFiltrados.length > 0) {
            const fragment = document.createDocumentFragment();
            state.productosFiltrados.forEach(item => fragment.appendChild(crearTarjetaProductoRegular(item)));
            DOM.contenedorProductosRegulares.appendChild(fragment);
        }
    }
    
    function crearTarjetaProductoRegular(item) {
        const { nombresColumnas, textos } = CONFIG;
        const esMayorista = tipo === 'mayorista';
        const precio = esMayorista ? item[nombresColumnas.precioMayorista] : item[nombresColumnas.precioMinorista];
        const precioPromo = esMayorista ? item[nombresColumnas.precioSugerido] : item[nombresColumnas.precioPromo];
        const nombreImagen = item[nombresColumnas.imagen];
        const imagen = nombreImagen 
            ? `${CONFIG.rutaBaseImagenes}${nombreImagen}` 
            : 'img/imagen-generica.png';
        const stockValueRaw = item[nombresColumnas.stock];
        const stockValueLower = String(stockValueRaw).trim().toLowerCase();
        
        const productDiv = document.createElement('div');
        let productClasses = 'product';
        let badgeHTML = '';

        if (stockValueLower === 'nuevo') {
            badgeHTML = '<div class="product-badge badge-new">Nuevo</div>';
            productClasses += ' product-new';
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

    // --- 5. FUNCIONES DE UI Y EVENTOS ---
    function actualizarUICompleta() {
        const textosTipo = CONFIG.textos[tipo];
        DOM.tituloPagina.textContent = textosTipo.tituloPagina;
        DOM.bannerPrincipal.src = textosTipo.bannerUrl;
        actualizarBotonesActivos('.categoria-selector button', 'data-categoria', state.categoriaActual);
        generarControlesSubcategoria();
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

    function mostrarMensajeCarga(mostrar, contenedor) {
        if (mostrar) contenedor.innerHTML = '<p class="info-msg">Cargando productos...</p>';
    }
    
    function mostrarMensajeError(contenedor) {
        contenedor.innerHTML = '<p class="info-msg error">Hubo un error al cargar el catálogo. Intenta de nuevo más tarde.</p>';
    }

    function actualizarBotonesActivos(selector, dataAttribute, valorActivo) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute(dataAttribute).toLowerCase() === valorActivo.toLowerCase());
        });
    }

    function setupEventListeners() {
        document.querySelector('.categoria-selector').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                state.categoriaActual = e.target.getAttribute('data-categoria');
                state.subcategoriaActual = 'TODOS';
                state.terminoBusqueda = '';
                DOM.inputBusqueda.value = '';
                actualizarUICompleta();
                cargarYProcesarProductos();
            }
        });
        
        DOM.selectorSubcatDesktop.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                state.subcategoriaActual = e.target.getAttribute('data-subcategoria');
                document.getElementById('subcat-select').value = state.subcategoriaActual;
                actualizarBotonesActivos('.subcategoria-selector button', 'data-subcategoria', state.subcategoriaActual);
                filtrarYRenderizarRegulares();
            }
        });

        DOM.selectorSubcatMobile.addEventListener('change', e => {
            state.subcategoriaActual = e.target.value;
            actualizarBotonesActivos('.subcategoria-selector button', 'data-subcategoria', state.subcategoriaActual);
            filtrarYRenderizarRegulares();
        });
        
        DOM.inputBusqueda.addEventListener('input', () => {
            state.terminoBusqueda = DOM.inputBusqueda.value;
            filtrarYRenderizarRegulares();
        });
        
        // Listener para Clic en Imágenes (ambas secciones)
        [DOM.contenedorProductosRegulares, DOM.contenedorLiquidacion].forEach(container => {
            container.addEventListener('click', e => {
                const productCard = e.target.closest('.product, .product-liquidacion');
                if (e.target.tagName === 'IMG' && productCard) {
                    DOM.imgModal.src = e.target.src;
                    DOM.modalImagen.style.display = "flex";
                    document.body.style.overflow = "hidden";
                }
            });
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
            cargarYProcesarProductos();
        });

        // Listener para sección plegable
        if (DOM.liquidacionHeader) {
            DOM.liquidacionHeader.addEventListener('click', toggleSeccionLiquidacion);
        }
    }

    // --- 6. FUNCIONES UTILITARIAS ---
    function toggleSeccionLiquidacion() {
        DOM.contenedorLiquidacion.classList.toggle('collapsed-content');
        const toggleBtn = document.getElementById('toggle-liquidacion-btn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('collapsed');
        }
    }

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