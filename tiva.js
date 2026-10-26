// --- 0. LÓGICA DEL MODO OSCURO ---
const themeBtn = document.getElementById('theme-btn');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (themeBtn) themeBtn.innerText = '☀️';
}

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        let theme = document.body.getAttribute('data-theme');
        if (theme === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeBtn.innerText = '🌙';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeBtn.innerText = '☀️';
        }
    });
}

// --- 1. REFERENCIAS DEL DOM ---
const grupoTargetTCI = document.getElementById('grupo-target-tci');
const farmaSelect = document.getElementById('farma-select');
const modeloSelect = document.getElementById('modelo-select');
const grupoModelo = document.getElementById('grupo-modelo');
const grupoLineal = document.getElementById('grupo-lineal');
const grupoDilucion = document.getElementById('grupo-dilucion');
const grupoTalla = document.getElementById('grupo-talla');
const grupoDemografia = document.getElementById('grupo-demografia');
const tarjetaResultadoLineal = document.getElementById('tarjeta-resultado-lineal');
const tarjetaGrafica = document.getElementById('tarjeta-grafica');

const inputDosisLineal = document.getElementById('dosis-lineal');
const selectUnidadLineal = document.getElementById('unidad-lineal');
const inputDilucionDroga = document.getElementById('dilucion-droga');
const inputDilucionVolumen = document.getElementById('dilucion-volumen');
const inputPeso = document.getElementById('tiva-peso');
const resVelocidad = document.getElementById('res-velocidad');

// --- 2. CONFIGURACIÓN DE MODELOS TCI ---
const modelosTCI = {
    propofol: [
        { id: 'marsh', nombre: 'Marsh (Cp)' },
        { id: 'schnider', nombre: 'Schnider (Ce)' },
        { id: 'eleveld', nombre: 'Eleveld (Amplio)' }
    ],
    remifentanilo: [
        { id: 'minto', nombre: 'Minto (Ce)' },
        { id: 'eleveld_remi', nombre: 'Eleveld' }
    ],
    fentanilo: [
        { id: 'shafer', nombre: 'Shafer (Cp)' },
        { id: 'scott', nombre: 'Scott (Ce)' }
    ]
};

// --- 3. INTERFAZ DINÁMICA ---
function actualizarInterfazFarmaco() {
    const farma = farmaSelect.value;
    
    if (modelosTCI[farma]) {
        grupoTargetTCI.style.display = 'flex';
        // MODO TCI
        grupoModelo.style.display = 'block';
        grupoLineal.style.display = 'none';
        grupoDilucion.style.display = 'none';
        tarjetaResultadoLineal.style.display = 'none';
        tarjetaGrafica.style.display = 'block';
        
        modeloSelect.innerHTML = '';
        modelosTCI[farma].forEach(mod => {
            const option = document.createElement('option');
            option.value = mod.id;
            option.innerText = mod.nombre;
            modeloSelect.appendChild(option);
        });
        ajustarCamposBiometricos();
    } else {
        grupoTargetTCI.style.display = 'none';
        // MODO INFUSIÓN LINEAL
        grupoModelo.style.display = 'none';
        grupoLineal.style.display = 'block';
        grupoDilucion.style.display = 'flex';
        tarjetaResultadoLineal.style.display = 'block';
        tarjetaGrafica.style.display = 'none';
        
        // Las infusiones lineales solo requieren peso
        grupoTalla.style.display = 'none';
        grupoDemografia.style.display = 'none';
        
        // Ajustar unidad por defecto
        if (farma === 'dexmedetomidina') selectUnidadLineal.value = 'mcg_kg_h';
        if (farma === 'rocuronio' || farma === 'vecuronio') selectUnidadLineal.value = 'mcg_kg_min';
        if (farma === 'tranexamico' || farma === 'midazolam') selectUnidadLineal.value = 'mg_kg_h';
        if (farma === 'magnesio') selectUnidadLineal.value = 'mg_h';
        
        calcularInfusionLineal();
    }
}

function ajustarCamposBiometricos() {
    if (!modelosTCI[farmaSelect.value]) return;
    const modelo = modeloSelect.value;
    
    if (modelo === 'marsh' || modelo === 'shafer') {
        grupoTalla.style.display = 'none';
        grupoDemografia.style.display = 'none';
    } else {
        grupoTalla.style.display = 'block';
        grupoDemografia.style.display = 'flex';
    }
}

// --- 4. MOTOR DE CÁLCULO: INFUSIONES LINEALES ---
function calcularInfusionLineal() {
    const dosis = parseFloat(inputDosisLineal.value) || 0;
    const peso = parseFloat(inputPeso.value) || 0;
    const drogaTotal = parseFloat(inputDilucionDroga.value) || 0;
    const volumenTotal = parseFloat(inputDilucionVolumen.value) || 0;
    const unidad = selectUnidadLineal.value;

    if (dosis > 0 && drogaTotal > 0 && volumenTotal > 0) {
        const concentracion = drogaTotal / volumenTotal; 
        let dosisPorHora = 0;
        
        if (unidad === 'mcg_kg_h' || unidad === 'mg_kg_h') dosisPorHora = dosis * peso;
        else if (unidad === 'mcg_kg_min') dosisPorHora = dosis * peso * 60;
        else if (unidad === 'mg_h') dosisPorHora = dosis;

        const velocidadMlHr = dosisPorHora / concentracion;
        resVelocidad.innerText = `${velocidadMlHr.toFixed(1)} ml/hr`;
    } else {
        resVelocidad.innerText = "0.0 ml/hr";
    }
}

// Escuchar cambios
farmaSelect.addEventListener('change', actualizarInterfazFarmaco);
modeloSelect.addEventListener('change', ajustarCamposBiometricos);
[inputDosisLineal, selectUnidadLineal, inputDilucionDroga, inputDilucionVolumen, inputPeso].forEach(input => {
    if(input) input.addEventListener('input', calcularInfusionLineal);
});

// --- 5. GRÁFICA TCI INICIAL (VACÍA) ---
const ctx = document.getElementById('graficaTiva').getContext('2d');
let tivaChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [0, 5, 10, 15, 20, 25, 30],
        datasets: [
            {
                label: 'Concentración Plasmática (Cp)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Sitio Efecto (Ce)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#dc2626',
                borderDash: [5, 5],
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: 'var(--text-main)' } } },
        scales: {
            x: { title: { display: true, text: 'Tiempo (min)', color: 'var(--text-main)' }, ticks: { color: 'var(--text-muted)' } },
            y: { title: { display: true, text: 'Concentración', color: 'var(--text-main)' }, ticks: { color: 'var(--text-muted)' } }
        }
    }
});

// --- 6. MOTOR FARMACOCINÉTICO Y MONITOR EN VIVO ---
const liveDashboard = document.getElementById('live-dashboard');
const btnSimular = document.getElementById('btn-simular');
const btnDetener = document.getElementById('btn-detener');
const tivaTimer = document.getElementById('tiva-timer');
const tivaStatus = document.getElementById('tiva-status');
const resTciBolo = document.getElementById('res-tci-bolo');
const resTciMant = document.getElementById('res-tci-mant');

let timerInterval;
let segundosTranscurridos = 0;
let isInfusing = false;

// Función para dar formato 00:00:00 al reloj
function formatearTiempo(totalSegundos) {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

// Iniciar el Monitor En Vivo
btnSimular.addEventListener('click', () => {
    const farma = farmaSelect.value;
    const modelo = modeloSelect.value;
    const peso = parseFloat(inputPeso.value);
    const targetInput = document.getElementById('target-tci');
    const target = parseFloat(targetInput ? targetInput.value : 0);

    if (!peso || peso <= 0 || !target || target <= 0) {
        alert("Por favor, ingresa el peso y una Concentración Target válida.");
        return;
    }

    if (farma === 'propofol' && modelo === 'marsh') {
        // --- 1. MATEMÁTICA ESTÁTICA (Inicial) ---
        const v1 = 0.228 * peso;
        const k10 = 0.119;
        
        const boloInduccionMg = target * v1;
        const clearance = v1 * k10;
        const mantMgMin = target * clearance; 
        const mantMlHr = (mantMgMin * 60) / 10; // Asumiendo propofol 1% (10mg/ml)

        resTciBolo.innerText = `${boloInduccionMg.toFixed(1)} mg`;
        resTciMant.innerText = `${mantMlHr.toFixed(1)} ml/hr`;
        
        // --- 2. CAMBIO DE INTERFAZ A MODO "EN VIVO" ---
        liveDashboard.style.display = 'block';
        btnSimular.style.display = 'none';
        btnDetener.style.display = 'block';
        isInfusing = true;
        
        // Deshabilitar inputs para evitar cambios accidentales (Estructura de seguridad)
        inputPeso.disabled = true;
        targetInput.disabled = true;

        // --- 3. INICIAR CRONÓMETRO Y ALERTAS ---
        segundosTranscurridos = 0;
        tivaTimer.innerText = "00:00:00";
        tivaStatus.innerHTML = "🟢 Inducción: Administrar Bolo";
        tivaStatus.style.backgroundColor = "#22c55e"; // Verde

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            segundosTranscurridos++;
            tivaTimer.innerText = formatearTiempo(segundosTranscurridos);

            // Estructura de Alertas Interactivas (Ejemplo temporal)
            if (segundosTranscurridos === 60) {
                tivaStatus.innerHTML = "🟡 Fase de Distribución (1 min)";
                tivaStatus.style.backgroundColor = "#eab308"; // Amarillo
            }
            if (segundosTranscurridos === 300) {
                tivaStatus.innerHTML = "🔵 Mantenimiento Estable (5 min)";
                tivaStatus.style.backgroundColor = "#3b82f6"; // Azul
            }
            
            // Aquí en el futuro enlazaremos el avance de la línea en la gráfica
        }, 1000); // Se ejecuta cada 1000 ms (1 segundo)

    } else {
        alert("Selecciona Propofol - Marsh para esta prueba.");
    }
});

// Detener el Caso
btnDetener.addEventListener('click', () => {
    if(confirm("¿Estás seguro de detener la infusión de este caso?")) {
        clearInterval(timerInterval);
        isInfusing = false;
        
        // Restaurar Interfaz
        liveDashboard.style.display = 'none';
        btnSimular.style.display = 'block';
        btnDetener.style.display = 'none';
        
        // Rehabilitar inputs
        inputPeso.disabled = false;
        const targetInput = document.getElementById('target-tci');
        if(targetInput) targetInput.disabled = false;
        
        // Borrar gráfica (estructuralmente, luego la vaciaremos real)
        alert("Caso finalizado. Duración total: " + formatearTiempo(segundosTranscurridos));
    }
});
