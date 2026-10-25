// --- 0. LÓGICA DEL MODO OSCURO (Compartida) ---
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

// --- 1. INTERFAZ DINÁMICA (Modelos PK) ---
const farmaSelect = document.getElementById('farma-select');
const modeloSelect = document.getElementById('modelo-select');
const grupoModelo = document.getElementById('grupo-modelo');
const grupoLineal = document.getElementById('grupo-lineal');
const grupoTalla = document.getElementById('grupo-talla');
const grupoDemografia = document.getElementById('grupo-demografia');

// Diccionario de modelos para TCI
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

function actualizarInterfazFarmaco() {
    const farma = farmaSelect.value;
    
    // Si el fármaco está en la lista TCI
    if (modelosTCI[farma]) {
        grupoModelo.style.display = 'block';
        grupoLineal.style.display = 'none';
        
        modeloSelect.innerHTML = '';
        modelosTCI[farma].forEach(mod => {
            const option = document.createElement('option');
            option.value = mod.id;
            option.innerText = mod.nombre;
            modeloSelect.appendChild(option);
        });
        ajustarCamposBiometricos();
        
    } else {
        // Si es una Infusión Lineal (Dexmedetomidina, etc.)
        grupoModelo.style.display = 'none';
        grupoLineal.style.display = 'block';
        
        // Las infusiones lineales solo requieren peso
        grupoTalla.style.display = 'none';
        grupoDemografia.style.display = 'none';
        
        // Ajustar unidad por defecto según el fármaco
        const unidadSelect = document.getElementById('unidad-lineal');
        if (farma === 'dexmedetomidina') unidadSelect.value = 'mcg_kg_h';
        if (farma === 'rocuronio' || farma === 'vecuronio') unidadSelect.value = 'mcg_kg_min';
        if (farma === 'tranexamico' || farma === 'midazolam') unidadSelect.value = 'mg_kg_h';
        if (farma === 'magnesio') unidadSelect.value = 'mg_h';
    }
}

function ajustarCamposBiometricos() {
    // Solo aplica si estamos en un fármaco TCI
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

farmaSelect.addEventListener('change', actualizarInterfazFarmaco);
modeloSelect.addEventListener('change', ajustarCamposBiometricos);

// Inicializar
actualizarInterfazFarmaco();

// --- 2. CONFIGURACIÓN INICIAL DE LA GRÁFICA (VACÍA) ---
const ctx = document.getElementById('graficaTiva').getContext('2d');
let tivaChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [0, 5, 10, 15, 20, 25, 30], // Minutos (Eje X base)
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
        plugins: {
            legend: {
                labels: { color: 'var(--text-main)' }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Tiempo (min)', color: 'var(--text-main)' },
                ticks: { color: 'var(--text-muted)' }
            },
            y: {
                title: { display: true, text: 'Concentración (µg/ml o ng/ml)', color: 'var(--text-main)' },
                ticks: { color: 'var(--text-muted)' }
            }
        }
    }
});

// Botón de prueba para ver la animación
document.getElementById('btn-simular').addEventListener('click', () => {
    alert("Próximo paso: Integrar las ecuaciones de volumen de distribución (V1, V2, V3) y aclaramiento (k10, k12...) para dibujar las curvas reales.");
});
