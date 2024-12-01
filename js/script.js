// Configuración del socket
const socket = io('http://localhost:3000/', {
    reconnection: true,             // Habilitar reconexión automática
    reconnectionAttempts: 10,       // Número máximo de intentos de reconexión
    reconnectionDelay: 2000,        // Tiempo de espera entre intentos (en ms)
    timeout: 5000,                  // Tiempo de espera para la conexión inicial (en ms)
    autoConnect: true               // Conectar automáticamente al instanciar
});

// Eventos de conexión y reconexión
socket.on('connect', () => {
    console.log('Conectado al servidor.');
});

socket.on('disconnect', (reason) => {
    console.log('Desconectado del servidor:', reason);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

socket.on('reconnect_attempt', (attempt) => {
    console.log(`Intento de reconexión #${attempt}`);
});

socket.on('reconnect_failed', () => {
    console.log('Todos los intentos de reconexión han fallado.');
});

// Configuración inicial del gráfico
const datos = {
    labels: [],
    datasets: [{
        label: 'Coeficientes',
        data: [],
        borderColor: 'blue',
        fill: false,
        tension: 0.1
    }, {
        label: 'Puntos Rosa',
        data: [],
        borderColor: 'pink',
        fill: false,
        pointBackgroundColor: '#ff1493',
        pointRadius: 5,
        showLine: false
    }]
};

const opciones = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: { beginAtZero: true }
    },
    plugins: {
        legend: {
            display: false // Oculta las etiquetas del gráfico
        }
    }
};

const ctx = document.getElementById('grafico').getContext('2d');
const miGrafico = new Chart(ctx, { type: 'line', data: datos, options: opciones });

// Función para agregar valor al gráfico
const agregarValor = (valor, tiempo) => {
    const ultimoValor = datos.datasets[0].data.length
        ? datos.datasets[0].data[datos.datasets[0].data.length - 1]
        : 0;

    let nuevoValor;
    if (valor >= 2.0 && valor <= 9.99) {
        nuevoValor = ultimoValor + 1; // +1
        datos.datasets[1].data.push(null); // Sin punto rosa
    } else if (valor < 2.0) {
        nuevoValor = ultimoValor - 1; // -1
        datos.datasets[1].data.push(null); // Sin punto rosa
    } else if (valor >= 10.0) {
        nuevoValor = ultimoValor + 1; // +1
        datos.datasets[1].data.push(nuevoValor); // Punto rosa
    }

    datos.labels.push(tiempo);
    datos.datasets[0].data.push(nuevoValor);

    // Limitar a los últimos 23 puntos
    if (datos.labels.length > 32) {
        datos.labels.shift();
        datos.datasets[0].data.shift();
        datos.datasets[1].data.shift();
    }

    // Actualizar gráfico
    miGrafico.update();
};

// Escuchar datos nuevos desde el servidor
socket.on('nuevoDato', (dato) => {
    console.log('Nuevo coeficiente recibido:', dato);
    agregarValor(dato.coeficiente, dato.tiempo);
});

// Prevenir recargas no deseadas
window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevenir comportamiento predeterminado al presionar Enter
    }
});
