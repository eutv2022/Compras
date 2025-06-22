const listaProductos = document.getElementById("listaProductos");

let productos = [
  {
    id: "1",
    nombre: "Leche",
    cantidad: 2,
    unidad: "litros",
    categoria: "Lácteos",
    lugar: "D1",
    valorUnitario: 3.50,
    comprado: false
  },
  {
    id: "2",
    nombre: "Carne",
    cantidad: 1,
    unidad: "kg",
    categoria: "Proteínas",
    lugar: "Ara",
    valorUnitario: 12.00,
    comprado: true
  }
];

function renderizarProductos() {
  listaProductos.innerHTML = "";

  const headers = ['Producto', 'Cantidad', 'Categoría', 'Lugar', 'Precio U', 'Total', 'Estado'];
  headers.forEach(texto => {
    const celda = document.createElement("div");
    celda.textContent = texto;
    celda.classList.add("encabezado");
    listaProductos.appendChild(celda);
  });

  productos.forEach(producto => {
    const fila = document.createElement("div");
    fila.classList.add("item");
    if (producto.comprado) fila.classList.add("comprado");

    const total = (producto.cantidad * producto.valorUnitario).toFixed(2);
    const datos = [
      producto.nombre,
      `${producto.cantidad} ${producto.unidad}`,
      producto.categoria,
      producto.lugar,
      `$${producto.valorUnitario.toFixed(2)}`,
      `$${total}`,
      producto.comprado ? '✅' : '⏳'
    ];

    datos.forEach(dato => {
      const div = document.createElement("div");
      div.textContent = dato;
      fila.appendChild(div);
    });

    listaProductos.appendChild(fila);
  });
}

renderizarProductos();
