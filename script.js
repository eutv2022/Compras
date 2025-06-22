document.addEventListener("DOMContentLoaded", () => {
    console.log("App cargada correctamente");
    renderizarProductos();
    actualizarTotales();
});

const formulario = document.getElementById("formulario");
const listaProductos = document.getElementById("listaProductos");
const panelTotales = document.getElementById("panelTotales"); // Obtener el panel
const filtroTotalSelect = document.getElementById("filtroTotal"); // El select de filtro de totales
const btnCalcularTotal = document.getElementById("btnCalcularTotal"); // Botón TOTAL
const resultadoTotalesDiv = document.getElementById("resultadoTotales"); // Div donde se muestran los totales

let productos = JSON.parse(localStorage.getItem("productos")) || [];
let productoEnEdicion = null;
let productoEditandoId = null;
let modoAgrupacion = "categoria"; // Valor inicial por defecto para la agrupación (categoria o lugar)

/**
 * Función principal para renderizar la lista de productos.
 * Agrupa los productos según el modo de agrupación actual (categoría o lugar).
 */
function renderizarProductos() {
    listaProductos.innerHTML = ""; // Limpia la lista antes de volver a renderizar
    actualizarTotales(); // Asegura que los totales se actualicen con cada renderizado

    // Ordenar productos: primero por el modo de agrupación actual, luego por 'comprado'
    // Esto asegura que los grupos estén juntos y que los comprados vayan al final dentro de cada grupo.
    productos.sort((a, b) => {
        // Ordena por el campo de agrupación primero
        const grupoA = a[modoAgrupacion] || "";
        const grupoB = b[modoAgrupacion] || "";
        if (grupoA < grupoB) return -1;
        if (grupoA > grupoB) return 1;

        // Si los grupos son iguales, ordena por estado de comprado (false antes que true)
        return a.comprado - b.comprado;
    });

    const gruposOrdenados = {};
    productos.forEach(producto => {
        const clave = producto[modoAgrupacion]; // Utiliza el modoAgrupacion para la clave
        if (!gruposOrdenados[clave]) {
            gruposOrdenados[clave] = [];
        }
        gruposOrdenados[clave].push(producto);
    });

    // Encabezado de la tabla (fuera del bucle de grupos para que aparezca una sola vez)
    // NOTA: El CSS espera 9 columnas para el encabezado y los items (7 datos + 2 botones).
    // Asegúrate de que el contenido aquí coincida con eso.
    const encabezadoDiv = document.createElement("div");
    encabezadoDiv.classList.add("encabezado");
    encabezadoDiv.innerHTML = `
        <div>Producto</div>
        <div>Cantidad</div>
        <div>Unidad</div>
        <div>Valor U.</div>
        <div>Valor T.</div>
        <div>Categoría</div>
        <div>Lugar</div>
        <div></div> <div></div> `;
    listaProductos.appendChild(encabezadoDiv);


    // Renderizar productos por grupos
    for (const claveAgrupacion in gruposOrdenados) {
        const grupo = gruposOrdenados[claveAgrupacion];

        // Crear y añadir el título del grupo (ej. "CATEGORÍA: LÁCTEOS")
        const grupoCategoriaDiv = document.createElement("div");
        grupoCategoriaDiv.classList.add("grupo-categoria");
        grupoCategoriaDiv.textContent = `${modoAgrupacion.toUpperCase()}: ${claveAgrupacion}`;
        listaProductos.appendChild(grupoCategoriaDiv);

        grupo.forEach(producto => {
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("item");
            itemDiv.dataset.id = producto.id;
            if (producto.comprado) itemDiv.classList.add("comprado");
            // Agrega la clase 'editando' al contenedor principal del item si está en edición
            if (producto.id === productoEditandoId) {
                itemDiv.classList.add("editando");
            }

            const total = (producto.cantidad * producto.valorUnitario).toFixed(2);

            // Celdas de datos: Cada div aquí corresponde a una columna de tu grid CSS (7 en total)
            const nombreCelda = document.createElement("div");
            nombreCelda.textContent = producto.nombre;
            itemDiv.appendChild(nombreCelda);

            const cantidadCelda = document.createElement("div");
            cantidadCelda.textContent = producto.cantidad;
            itemDiv.appendChild(cantidadCelda);

            const unidadCelda = document.createElement("div");
            unidadCelda.textContent = producto.unidad;
            itemDiv.appendChild(unidadCelda);

            const valorUnitarioCelda = document.createElement("div");
            valorUnitarioCelda.textContent = `$${producto.valorUnitario.toFixed(2)}`;
            itemDiv.appendChild(valorUnitarioCelda);

            const valorTotalCelda = document.createElement("div");
            valorTotalCelda.textContent = `$${total}`;
            itemDiv.appendChild(valorTotalCelda);

            const categoriaCelda = document.createElement("div");
            categoriaCelda.textContent = producto.categoria;
            itemDiv.appendChild(categoriaCelda);

            const lugarCelda = document.createElement("div");
            lugarCelda.textContent = producto.lugar;
            itemDiv.appendChild(lugarCelda);

            // Celda para el botón Editar (columna 8)
            const celdaBotonEditar = document.createElement("div");
            const btnEditar = document.createElement("button");
            btnEditar.innerHTML = "✏️";
            btnEditar.title = "Editar producto";
            btnEditar.classList.add("btn-editar");
            btnEditar.dataset.id = producto.id; // Asignar el ID para delegación de eventos
            celdaBotonEditar.appendChild(btnEditar);
            itemDiv.appendChild(celdaBotonEditar);

            // Celda para el botón Eliminar (columna 9)
            const celdaBotonEliminar = document.createElement("div");
            const btnEliminar = document.createElement("button");
            btnEliminar.innerHTML = "🗑️";
            btnEliminar.title = "Eliminar producto";
            btnEliminar.classList.add("btn-eliminar");
            btnEliminar.dataset.id = producto.id; // Asignar el ID para delegación de eventos
            celdaBotonEliminar.appendChild(btnEliminar);
            itemDiv.appendChild(celdaBotonEliminar);


            // Añadir la clase `celda-editando` a las celdas de datos del producto en edición
            if (producto.id === productoEditandoId) {
                // Selecciona las primeras 7 celdas (los datos, no los botones)
                Array.from(itemDiv.children).slice(0, 7).forEach(celda => {
                    celda.classList.add("celda-editando");
                });
            }

            listaProductos.appendChild(itemDiv);
        });
    }

    // Guardar productos en localStorage
    localStorage.setItem("productos", JSON.stringify(productos));
}

// --- Event Listeners ---

// Formulario de agregar/editar producto
formulario.addEventListener("submit", e => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = parseFloat(document.getElementById("cantidad").value);
    const unidad = document.getElementById("unidad").value;
    const valorUnitario = parseFloat(document.getElementById("valorUnitario").value);
    const categoria = document.getElementById("categoria").value;
    const lugar = document.getElementById("lugar").value;

    if (!nombre || isNaN(cantidad) || isNaN(valorUnitario) || cantidad <= 0 || valorUnitario <= 0 || !categoria || !lugar) {
        alert("Por favor, rellena todos los campos correctamente.");
        return;
    }

    if (productoEnEdicion) {
        // Modo edición: actualiza el producto existente
        productoEnEdicion.nombre = nombre;
        productoEnEdicion.cantidad = cantidad;
        productoEnEdicion.unidad = unidad;
        productoEnEdicion.valorUnitario = valorUnitario;
        productoEnEdicion.categoria = categoria;
        productoEnEdicion.lugar = lugar;

        productoEnEdicion = null; // Reinicia el estado de edición
        productoEditandoId = null; // Reinicia el ID de edición
        formulario.querySelector("button[type='submit']").textContent = "Agregar producto"; // Restablecer texto del botón
    } else {
        // Nuevo producto: crea un nuevo objeto
        const nuevoProducto = {
            id: Date.now().toString(), // ID único basado en la marca de tiempo
            nombre,
            cantidad,
            unidad,
            valorUnitario,
            categoria,
            lugar,
            comprado: false
        };
        productos.push(nuevoProducto);
    }

    renderizarProductos();
    actualizarTotales();
    formulario.reset(); // Limpia el formulario
});

// Delegación de eventos para los clics en la lista de productos
listaProductos.addEventListener("click", e => {
    // Comprobar si se hizo clic en un botón de eliminar
    if (e.target.classList.contains("btn-eliminar")) {
        const id = e.target.dataset.id;
        borrarProducto(id);
    }
    // Comprobar si se hizo clic en un botón de editar
    else if (e.target.classList.contains("btn-editar")) {
        const id = e.target.dataset.id;
        cargarProductoEnFormulario(id);
        formulario.querySelector("button[type='submit']").textContent = "Guardar cambios"; // Cambiar texto del botón
    }
    // Si se hizo clic en un item (fila) que no es un botón, alternar estado de comprado
    else {
        const item = e.target.closest(".item");
        if (item) { // Asegúrate de que se hizo clic dentro de un .item
            const id = item.dataset.id;
            const index = productos.findIndex(p => p.id === id);
            if (index !== -1) {
                productos[index].comprado = !productos[index].comprado;
                renderizarProductos();
                actualizarTotales();
            }
        }
    }
});

/**
 * Elimina un producto de la lista.
 * @param {string} id - El ID del producto a eliminar.
 */
function borrarProducto(id) {
    const confirmar = confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (!confirmar) return;

    productos = productos.filter(p => p.id !== id);
    // Si el producto que se está eliminando era el que estaba en edición, resetear el estado de edición
    if (productoEditandoId === id) {
        productoEnEdicion = null;
        productoEditandoId = null;
        formulario.reset();
        formulario.querySelector("button[type='submit']").textContent = "Agregar producto";
    }
    renderizarProductos();
    actualizarTotales();
}

/**
 * Carga los datos de un producto en el formulario para su edición.
 * @param {string} id - El ID del producto a cargar.
 */
function cargarProductoEnFormulario(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("cantidad").value = producto.cantidad;
    document.getElementById("unidad").value = producto.unidad;
    document.getElementById("valorUnitario").value = producto.valorUnitario;
    document.getElementById("categoria").value = producto.categoria;
    document.getElementById("lugar").value = producto.lugar;

    productoEnEdicion = producto; // Establece el producto que se está editando
    productoEditandoId = id; // Guarda el ID del producto que se está editando
    renderizarProductos(); // Vuelve a renderizar para aplicar la clase 'celda-editando'
}

/**
 * Actualiza y muestra los totales en el panel lateral.
 */
function actualizarTotales() {
    const tipo = filtroTotalSelect.value;
    resultadoTotalesDiv.classList.remove("total-actualizado");
    // Forzar reflow para reiniciar la animación
    void resultadoTotalesDiv.offsetWidth;
    resultadoTotalesDiv.classList.add("total-actualizado");

    let contenidoHTML = '';

    if (tipo === "General") {
        const total = productos.reduce((acc, p) => acc + p.cantidad * p.valorUnitario, 0);
        contenidoHTML = `<strong>Total General:</strong> $${total.toFixed(2)}`;
    } else if (tipo === "Categoria") {
        const totales = {};
        productos.forEach(p => {
            totales[p.categoria] = (totales[p.categoria] || 0) + p.cantidad * p.valorUnitario;
        });
        contenidoHTML = Object.entries(totales)
            .map(([clave, val]) =>
                `<span class="etiqueta">${clave}:</span> <span class="monto">$${val.toFixed(2)}</span>`
            )
            .join("<br>");
    } else if (tipo === "Lugar") {
        const totales = {};
        productos.forEach(p => {
            totales[p.lugar] = (totales[p.lugar] || 0) + p.cantidad * p.valorUnitario;
        });
        contenidoHTML = Object.entries(totales)
            .map(([clave, val]) =>
                `<span class="etiqueta">${clave}:</span> <span class="monto">$${val.toFixed(2)}</span>`
            )
            .join("<br>");
    }
    resultadoTotalesDiv.innerHTML = contenidoHTML;
}


// --- Lógica de Agrupación (Toggle) ---
// Se crea el botón de agrupación dinámicamente y se inserta en el panel
const toggleAgrupacionBtn = document.createElement("button");
toggleAgrupacionBtn.id = "toggleAgrupacion";
toggleAgrupacionBtn.textContent = "Agrupar por Lugar"; // Texto inicial
panelTotales.insertBefore(toggleAgrupacionBtn, filtroTotalSelect.nextSibling); // Inserta después del select de filtroTotal

toggleAgrupacionBtn.addEventListener("click", () => {
    modoAgrupacion = modoAgrupacion === "categoria" ? "lugar" : "categoria";
    toggleAgrupacionBtn.textContent = `Agrupar por ${modoAgrupacion === "categoria" ? "Lugar" : "Categoría"}`; // Invierte el texto
    renderizarProductos(); // Vuelve a renderizar para aplicar la nueva agrupación
});


// Escuchar cambios en el filtro de totales
filtroTotalSelect.addEventListener("change", actualizarTotales);
// Escuchar clic en el botón de calcular total
btnCalcularTotal.addEventListener("click", actualizarTotales);