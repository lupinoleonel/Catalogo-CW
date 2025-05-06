window.addEventListener('DOMContentLoaded', () => {
    document.title = tipo === 'mayorista' ? "Custom Wear (Revendedores)" : "Custom Wear (Minoristas)";
    const titulo = document.getElementById("catalogo-title");
    if (titulo) {
        titulo.innerText = tipo === 'mayorista' ? "Catálogo para Revendedores" : "Catálogo Minorista";
    }
});

// Función para mostrar el menú al hacer clic en el botón de menú
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (toggleButton && menu) {
        toggleButton.addEventListener('click', function () {
            menu.classList.toggle('active');
        });
    }
});

// Script principal
let currentSheet = 'Caballero';

function cambiarCategoria(elemento, categoria) {
    currentSheet = categoria;
    subcategoriaSeleccionada = "TODOS"; // Reset subcategoría
    document.getElementById("subcategoria").value = "TODOS"; // Actualiza selector visual
    actualizarActivos('categoria-selector', elemento);
    actualizarActivos('subcategoria-selector', null);
    history.pushState({ categoria }, '', `?cat=${categoria}`);
    loadProducts();
}


// Función para seleccionar subcategorías
function filterProducts() {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    const filtros = subcategorias[subcategoriaSeleccionada] || [];
    history.pushState({ categoria: currentSheet, subcategoria: subcategoriaSeleccionada, search: searchTerm }, '', `?cat=${currentSheet}&subcat=${subcategoriaSeleccionada}&search=${encodeURIComponent(searchTerm)}`);

    const products = document.querySelectorAll(".product");
    products.forEach(product => {
        const name = product.querySelector("h4").textContent.toLowerCase();
        product.style.display = name.includes(searchTerm) ? "block" : "none";
    });
}

// Función para seleccionar subcategoría desde el menú desplegable
function filterProducts() {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    const filtros = subcategorias[subcategoriaSeleccionada] || [];
    history.pushState({ categoria: currentSheet, subcategoria: subcategoriaSeleccionada, search: searchTerm }, '', `?cat=${currentSheet}&subcat=${subcategoriaSeleccionada}&search=${encodeURIComponent(searchTerm)}`);

    const products = document.querySelectorAll(".product");
    products.forEach(product => {
        const name = product.querySelector("h4").textContent.toLowerCase();
        product.style.display = name.includes(searchTerm) ? "block" : "none";
    });
}

// Manejo del botón atrás del navegador
window.addEventListener('popstate', function (event) {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || 'Caballero';
    const subcat = params.get('subcat') || 'TODOS';
    const search = params.get('search') || '';

    currentSheet = cat;
    subcategoriaSeleccionada = subcat;

    // Actualizar buscador
    document.getElementById("search").value = search;
    // Actualizar subcategoría
    document.getElementById("subcategoria").value = subcat;


    // Actualizar botones visuales
    const catContainer = document.getElementsByClassName('categoria-selector')[0];
    if (catContainer) {
        const botones = catContainer.getElementsByTagName('button');
        for (let boton of botones) {
            boton.classList.toggle('active', boton.textContent.trim().toLowerCase() === cat.toLowerCase());
        }
    }

    const subcatContainer = document.getElementsByClassName('subcategoria-selector')[0];
    if (subcatContainer) {
        const botones = subcatContainer.getElementsByTagName('button');
        for (let boton of botones) {
            boton.classList.toggle('active', boton.textContent.toUpperCase().includes(subcat));
        }
    }

    // Recargar productos filtrados
    loadProducts();
});



// Cargar productos desde Google Sheets
async function loadProducts() {
    const baseURL = 'https://docs.google.com/spreadsheets/d/1uKig237GzsXTYi2aPp-WPm8FOWWsb1QB4M4Wvufw_E8/gviz/tq?tqx=out:json&sheet=';
    const response = await fetch(baseURL + currentSheet);
    const text = await response.text();
    const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const jsonData = JSON.parse(jsonText);
    const rows = jsonData.table.rows;

    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';

    rows.forEach(row => {
        const item = {
            nombre: row.c[1]?.v || "Sin nombre",
            precio: tipo === 'mayorista' ? row.c[2]?.v || 0 : row.c[4]?.v || 0,
            precioPromo: tipo === 'mayorista' ? row.c[4]?.v || 0 : row.c[3]?.v || 0,
            imagen: row.c[5]?.v && row.c[5].v.trim() !== "" ? row.c[5].v : "img/imagen-generica.png",
            stock: row.c[6]?.v ? String(row.c[6].v).trim().toLowerCase() : "Sin Stock"
        };
        const tipoPrenda = row.c[0]?.v ? row.c[0].v.substring(0, 4).toUpperCase() : "";
        const filtros = subcategorias[subcategoriaSeleccionada] || [];

        if (subcategoriaSeleccionada !== "TODOS" && !filtros.includes(tipoPrenda)) {
            return; // Si no está en los filtros permitidos, NO lo mostramos
        }



        if (!item.stock.toLowerCase().includes("sin stock")) {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';

            productDiv.innerHTML = `
                    <img src="${item.imagen}" alt="${item.nombre}" onerror="this.onerror=null; this.src='img/imagen-generica.png';">
                    <h4>${item.nombre}</h4>
                    <div class="price-container">
                    <p class="price">${tipo === 'mayorista' ? 'Precio Mayorista' : 'Precio'}: $${formatPrice(item.precio)}</p>
                    <p class="promo-price">${tipo === 'mayorista' ? 'Precio Sugerido' : 'Efectivo / Transferencia'}: $${formatPrice(item.precioPromo)}</p>
                    </div>
                `;
            productsContainer.appendChild(productDiv);
        }
    });
}
function formatPrice(value) {
    if (!value) return '0';
    return parseFloat(value).toLocaleString('es-AR'); // Formato argentino
}


// Carga inicial desde parámetros en la URL

let subcategoriaSeleccionada = "TODOS";

const subcategorias = {
    "TODOS": [],
    "BUZOS": ["BUZO", "CANG", "SUET"],
    "CAMPERAS": ["CAMP", "PARK", "ROMP", "CHAQ", "CHAL", "PUFF", "ANOR"],
    "CHOMBAS": ["CHOM",],
    "CAMISAS": ["CAMI",],
    "REMERAS": ["REME", "MUSC", "1702", "1802", "TOPM", "TOPR", "TOPL", "TOPJ", "TOPD", "TOPC", "TOPB", "TOPP",],
    "PANTALONES": ["PANT", "JEAN", "JOGG", "CARG", "BABU", "CHIN", "CALZ"],
    "SHORTS": ["BERM", "BERR", "2020", "2021", "SHOR"],
    "MALLAS": ["MALL",]
};

// Función para filtrar subcategoría
function filtrarSubcategoria(subcat, elemento) {
    subcategoriaSeleccionada = subcat;
    actualizarActivos('subcategoria-selector', elemento);
    const searchTerm = document.getElementById("search").value.toLowerCase();
    history.pushState({ categoria: currentSheet, subcategoria: subcategoriaSeleccionada, search: searchTerm }, '', `?cat=${currentSheet}&subcat=${subcat}&search=${encodeURIComponent(searchTerm)}`);
    loadProducts();
}

// Función para seleccionar subcategoría desde el menú desplegable
function seleccionarSubcategoriaDesdeMenu() {
    const select = document.getElementById("subcategoria");
    const subcat = select.value;

    subcategoriaSeleccionada = subcat;

    // Guardamos en la URL
    const searchTerm = document.getElementById("search").value.toLowerCase();
    history.pushState(
        { categoria: currentSheet, subcategoria: subcat, search: searchTerm },
        '',
        `?cat=${currentSheet}&subcat=${subcat}&search=${encodeURIComponent(searchTerm)}`
    );

    loadProducts();
}

// Función que actualiza los botones activos
function actualizarActivos(selectorClass, elementoActivo) {
    const container = document.getElementsByClassName(selectorClass)[0];
    if (container) {
        const botones = container.getElementsByTagName('button');
        for (let boton of botones) {
            boton.classList.remove('active');
        }
        if (elementoActivo) {
            elementoActivo.classList.add('active');
        }
    }
}

window.onload = () => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || 'Caballero';
    const search = params.get('search') || '';

    currentSheet = cat;

    loadProducts().then(() => {
        document.getElementById("search").value = search;
        filterProducts();
    });
};

// Ampliar imagen al hacer click y mostrar en modal
const modal = document.getElementById("imgModal");
const modalImg = modal.querySelector("img");

document.addEventListener("click", function (e) {
    if (e.target.tagName === "IMG" && e.target.closest(".product")) {
        modalImg.src = e.target.src;
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";

        // Agrega una entrada al historial para detectar cuando se toca "atrás"
        history.pushState({ modalOpen: true }, "", "#modal");
    }
});

// Manejo del cierre del modal
modal.addEventListener("click", function (e) {
    if (e.target === modal) cerrarModal();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") cerrarModal();
});

function cerrarModal() {
    modal.style.display = "none";
    modalImg.src = "";
    document.body.style.overflow = "";

    // Si estamos en el historial del modal, retrocede
    if (location.hash === "#modal") history.back();
}

// Manejo del cierre del modal al usar el botón "atrás"
// Si el usuario toca atrás cuando el modal está abierto, lo cerramos
window.addEventListener("popstate", function (event) {
    if (location.hash === "" && modal.style.display === "flex") {
        cerrarModal();
    }
});

// Botón para volver al inicio de la página
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.onscroll = function () {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

scrollTopBtn.onclick = function () {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};

// Indicador de carga
document.getElementById('products').innerHTML = '<p class="loading">Cargando productos...</p>';

fetch(DATA_URL)
    .then(response => response.json())
    .then(data => {
        productsData = data;
        renderProducts(productsData);
    })
    .catch(error => {
        document.getElementById('products').innerHTML = '<p class="error">Error al cargar productos</p>';
        console.error('Error cargando productos:', error);
    });


