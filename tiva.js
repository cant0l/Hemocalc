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

document.getElementById('btn-simular').addEventListener('click', () => {
    alert("Cálculo TCI en desarrollo...");
});

// Ejecutar al iniciar
actualizarInterfazFarmaco();
