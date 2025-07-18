// config.js

// 1. GESTIÓN DEL TIPO DE CATÁLOGO (MINORISTA/MAYORISTA)
// -----------------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista';
}

// 2. CONFIGURACIÓN CENTRALIZADA
// -----------------------------------------------------------------------------
const CONFIG = {
  googleSheetId: '1uKig237GzsXTYi2aPp-WPm8FOWWsb1QB4M4Wvufw_E8',
  
  // ¡IMPORTANTE! Reemplazar estos nombres con los encabezados EXACTOS de Google Sheet.
  nombresColumnas: {
    codigo: 'Articulo',
    nombre: 'Nombre',
    precioMayorista: 'Revendedor',
    precioSugerido: 'Lista',
    precioMinorista: 'Lista',
    precioPromo: 'Efectivo/Transferencia',
    imagen: 'Foto',
    stock: 'Stock'
  },
  
  textos: {
    mayorista: {
      titulo: "Catálogo Revendedores",
      tituloPagina: "Custom Wear (Revendedores)",
      etiquetaPrecio: "Precio Mayorista",
      etiquetaPromo: "Precio sugerido de venta",
      bannerUrl: "img/banner-mayo.png"
    },
    minorista: {
      titulo: "Catálogo Minorista",
      tituloPagina: "Custom Wear (Minoristas)",
      etiquetaPrecio: "Precio",
      etiquetaPromo: "Efect. / Transfer.",
      bannerUrl: "img/banner-mino.png"
    }
  },

  // Define aquí tus subcategorías. El primer valor es el que se busca en la columna 'Codigo'.
  subcategorias: {
    "TODOS": [],
    "BUZOS": ["BUZO", "CANG", "SUET"],
    "CAMPERAS": ["CAMP", "PARK", "ROMP", "CHAQ", "CHAL", "PUFF", "ANOR"],
    "CHOMBAS": ["CHOM"],
    "CAMISAS": ["CAMI"],
    "REMERAS": ["REME", "MUSC", "TOPM", "TOPR", "TOPL", "TOPJ", "TOPD", "TOPC", "TOPB", "TOPP"],
    "PANTALONES": ["PANT", "JEAN", "JOGG", "CARG", "BABU", "CHIN", "CALZ"],
    "SHORTS": ["BERM", "BERR", "SHOR"],
    "MALLAS": ["MALL"]
  }
};



