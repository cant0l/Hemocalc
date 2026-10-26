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

// --- 6. MOTOR FARMACOCINÉTICO (PK/PD) ---
document.getElementById('btn-simular').addEventListener('click', () => {
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
        // Constantes Marsh
        const v1 = 0.228 * peso;
        const v2 = 0.463 * peso;
        const v3 = 2.893 * peso;
        const k10 = 0.119;
        const k12 = 0.112;
        const k21 = 0.055;
        const k13 = 0.042;
        const k31 = 0.0033;
        const ke0 = 0.26; 

        // Cálculos Clínicos (Concentración Jeringa = 10 mg/ml)
        const boloInduccionMg = target * v1;
        const clearance = v1 * k10;
        const mantMgMin = target * clearance; 
        const mantMlHr = (mantMgMin * 60) / 10;

        // Variables de estado
        let x1 = boloInduccionMg; 
        let x2 = 0, x3 = 0, ce = 0;

        const timeLabels = [];
        const cpData = [];
        const ceData = [];

        // Simulación de 30 minutos
        for (let t = 0; t <= 30; t++) {
            timeLabels.push(t);
            let cpActual = x1 / v1; 
            cpData.push(cpActual.toFixed(2));
            ceData.push(ce.toFixed(2));

            // Sub-pasos de precisión y adición de la infusión continua
            for (let step = 0; step < 10; step++) {
                let cp_dt = x1 / v1;
                // A la transferencia de masa le sumamos los mg/min que entran por la bomba
                let dx1 = -(k10 + k12 + k13) * x1 + k21 * x2 + k31 * x3 + mantMgMin;
                let dx2 = k12 * x1 - k21 * x2;
                let dx3 = k13 * x1 - k31 * x3;
                let dce = ke0 * (cp_dt - ce);

                x1 += dx1 * 0.1;
                x2 += dx2 * 0.1;
                x3 += dx3 * 0.1;
                ce += dce * 0.1;
            }
        }

      // Actualizar gráfica 
        tivaChart.data.labels = timeLabels;
        tivaChart.data.datasets[0].data = cpData;
        tivaChart.data.datasets[1].data = ceData;
        tivaChart.update();
        
        // Mostrar resultados en el panel de la gráfica
        const resTciContainer = document.getElementById('res-tci-container');
        const resTciBolo = document.getElementById('res-tci-bolo');
        const resTciMant = document.getElementById('res-tci-mant');
        
        resTciBolo.innerText = `${boloInduccionMg.toFixed(1)} mg`;
        resTciMant.innerText = `${mantMlHr.toFixed(1)} ml/hr`;
        resTciContainer.style.display = 'block';
        
    } else {
        alert("Modelo en desarrollo. Prueba con Propofol - Marsh por ahora.");
    }
});
