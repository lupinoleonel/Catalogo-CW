
// config.js

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

// Si el tipo viene por URL, lo guardamos en localStorage
if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  // Si no viene por URL, tratamos de obtenerlo del localStorage
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista';
}

// Ahora sí podemos usar 'tipo' correctamente en el resto del archivo
const esMinorista = tipo === 'minorista';

// Textos personalizados según el tipo
const textos = {
  titulo: esMinorista ? 'Catálogo Minorista' : 'Catálogo Revendedor',
  precio: esMinorista ? 'Precio efectivo/transferencia' : 'Precio revendedor',
  tipo
};

document.title = textos.titulo;
document.querySelector('[data-titulo]').textContent = textos.titulo;
document.querySelector('[data-precio-label]').textContent = textos.precio;



