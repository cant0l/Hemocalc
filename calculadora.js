// --- VARIABLES GLOBALES ---
let valorSangradoPermisible = 0;
let valorSangradoActual = 0;

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

// --- NUEVO: FUNCIÓN DIRECTA PARA EL BOTÓN DESPLEGABLE ---
function toggleFicha() {
    const seccionId = document.getElementById('seccion-identificacion');
    const toggleIcon = document.getElementById('toggle-icon');
    const btnToggleId = document.getElementById('btn-toggle-id');

    if (seccionId.style.display === 'none' || seccionId.style.display === '') {
        seccionId.style.display = 'block';
        toggleIcon.innerText = '➖';
        btnToggleId.style.border = '1px solid var(--border-color)';
    } else {
        seccionId.style.display = 'none';
        toggleIcon.innerText = '➕';
        btnToggleId.style.border = '1px dashed var(--primary-color)';
    }
}

// --- LÓGICA DE CARGA AUTOMÁTICA (Para editar pacientes) ---
window.addEventListener('DOMContentLoaded', () => {
    const activoId = localStorage.getItem('pacienteActivoId');
    if (activoId) {
        const historial = JSON.parse(localStorage.getItem('historialPacientes')) || [];
        const p = historial.find(pac => pac.id == activoId);
        if (p) {
            document.getElementById('id-nombre').value = p.nombre || "";
            document.getElementById('id-cedula').value = p.cedula || "";
            document.getElementById('id-historia').value = p.historia || "";
            document.getElementById('id-edad').value = p.edad || "";
            document.getElementById('id-servicio').value = p.servicio || "";
            document.getElementById('id-dx').value = p.dx || "";
            document.getElementById('id-plan').value = p.plan || "";
            document.getElementById('id-asa').value = p.asaBase || "-";
            document.getElementById('id-asa-e').checked = p.isEmergencia || false;
            document.getElementById('id-sangre').value = p.sangre || "-";
            
            document.getElementById('peso').value = p.peso || "";
            document.getElementById('tipo-paciente').value = p.tipoPaciente || "75";
            document.getElementById('hto-inicial').value = p.htoInicial || "";
            document.getElementById('hto-minimo').value = p.htoMinimo || "";
            document.getElementById('trauma').value = p.trauma || "2";
            document.getElementById('ayuno').value = p.ayuno || "";
            document.getElementById('vol-orina').value = p.orina || "";
            document.getElementById('tiempo-orina').value = p.tiempoOrina || "";
            
            document.getElementById('peso-manchadas').value = p.pesoManchadas || "";
            document.getElementById('peso-secas').value = p.pesoSecas || "";
            document.getElementById('vol-frasco').value = p.volFrasco || "";
            document.getElementById('vol-lavado').value = p.volLavado || "";
            document.getElementById('cristaloides-pasados').value = p.cristPasados || "";
            document.getElementById('coloides-pasados').value = p.colPasados || "";

            // Auto-abrir la sección si el paciente ya tenía nombre guardado
            const seccionId = document.getElementById('seccion-identificacion');
            if (p.nombre && p.nombre !== "Paciente Anónimo" && seccionId) {
                seccionId.style.display = 'block';
                document.getElementById('toggle-icon').innerText = '➖';
                document.getElementById('btn-toggle-id').style.border = '1px solid var(--border-color)';
            }

            calcularTodo();
            calcularSangradoActual();
        }
    }
});

// --- 1. LÓGICA DE LA CALCULADORA PRINCIPAL ---
const inputs = document.querySelectorAll('.calc-grid input, .calc-grid select');
const resVolemia = document.getElementById('res-volemia');
const resSangrado = document.getElementById('res-sangrado');
const resMantenimiento = document.getElementById('res-mantenimiento');
const resInsensibles = document.getElementById('res-insensibles');
const resAyuno = document.getElementById('res-ayuno');
const resDiuresis = document.getElementById('res-diuresis');

function calcularTodo() {
    const peso = parseFloat(document.getElementById('peso').value) || 0;
    const factorVolemia = parseFloat(document.getElementById('tipo-paciente').value);
    const htoInicial = parseFloat(document.getElementById('hto-inicial').value) || 0;
    const htoMinimo = parseFloat(document.getElementById('hto-minimo').value) || 0;
    const trauma = parseFloat(document.getElementById('trauma').value);
    const ayuno = parseFloat(document.getElementById('ayuno').value) || 0;
    
    const orina = parseFloat(document.getElementById('vol-orina').value) || 0;
    const tiempoOrina = parseFloat(document.getElementById('tiempo-orina').value) || 0;

    if (peso > 0) {
        const volemia = peso * factorVolemia;
        resVolemia.innerText = `${volemia.toFixed(0)} ml`;

        if (htoInicial > htoMinimo) {
            valorSangradoPermisible = volemia * ((htoInicial - htoMinimo) / htoInicial);
            resSangrado.innerText = `${valorSangradoPermisible.toFixed(0)} ml`;
        } else {
            valorSangradoPermisible = 0;
            resSangrado.innerText = "0 ml";
        }

        let mantenimiento = 0;
        if (peso <= 10) mantenimiento = peso * 4;
        else if (peso <= 20) mantenimiento = 40 + ((peso - 10) * 2);
        else mantenimiento = 60 + (peso - 20);
        resMantenimiento.innerText = `${mantenimiento} ml/hr`;

        resInsensibles.innerText = `${(peso * trauma).toFixed(0)} ml/hr`;
        resAyuno.innerText = `${mantenimiento * ayuno} ml`;

        if (orina > 0 && tiempoOrina > 0) {
            const diuresis = (orina / peso) / tiempoOrina;
            resDiuresis.innerText = `${diuresis.toFixed(2)} ml/kg/hr`;
            if(diuresis < 0.5) resDiuresis.style.color = "#dc2626";
            else resDiuresis.style.color = "var(--text-main)";
        } else {
            resDiuresis.innerText = "0 ml/kg/hr";
            resDiuresis.style.color = "var(--text-main)";
        }
        
        calcularSangradoActual();
    }
}

inputs.forEach(input => input.addEventListener('input', calcularTodo));

// --- 2. LÓGICA DE LA VENTANA RÁPIDA (MODAL) ---
const modal = document.getElementById('modal-sangrado');
const btnAbrir = document.getElementById('btn-cuantificar');
const spanCerrar = document.querySelector('.close-btn');

btnAbrir.onclick = () => modal.style.display = "flex";
spanCerrar.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

const inputsModal = document.querySelectorAll('#modal-sangrado input');
const displaySangradoActual = document.getElementById('sangrado-actual');
const alertaTransfusion = document.getElementById('alerta-transfusion');

function calcularSangradoActual() {
    const pesoManchadas = parseFloat(document.getElementById('peso-manchadas').value) || 0;
    const pesoSecas = parseFloat(document.getElementById('peso-secas').value) || 0;
    const volFrasco = parseFloat(document.getElementById('vol-frasco').value) || 0;
    const volLavado = parseFloat(document.getElementById('vol-lavado').value) || 0;

    let sangradoGasas = pesoManchadas - pesoSecas;
    if (sangradoGasas < 0) sangradoGasas = 0;

    let sangradoAspirador = volFrasco - volLavado;
    if (sangradoAspirador < 0) sangradoAspirador = 0;

    valorSangradoActual = sangradoGasas + sangradoAspirador;
    displaySangradoActual.innerText = `${valorSangradoActual} ml`;

    const metaCrist = valorSangradoActual * 3;
    const metaCol = valorSangradoActual * 1;
    document.getElementById('meta-cristaloides').innerText = `${metaCrist} ml`;
    document.getElementById('meta-coloides').innerText = `${metaCol} ml`;

    const cristPasados = parseFloat(document.getElementById('cristaloides-pasados').value) || 0;
    const colPasados = parseFloat(document.getElementById('coloides-pasados').value) || 0;

    const volumenIntravascularRepuesto = (cristPasados / 3) + colPasados;
    let deficitReal = valorSangradoActual - volumenIntravascularRepuesto;
    if (deficitReal < 0) deficitReal = 0;

    const faltaCrist = deficitReal * 3;
    const faltaCol = deficitReal * 1;

    document.getElementById('falta-cristaloides').innerText = `${faltaCrist.toFixed(0)} ml`;
    document.getElementById('falta-coloides').innerText = `${faltaCol.toFixed(0)} ml`;

    const filaMetaSangre = document.getElementById('meta-sangre-row');
    const filaFaltaSangre = document.getElementById('falta-sangre-row');

    if (valorSangradoPermisible > 0 && valorSangradoActual >= valorSangradoPermisible) {
        filaMetaSangre.style.display = 'flex';
        filaFaltaSangre.style.display = 'flex';
    } else {
        filaMetaSangre.style.display = 'none';
        filaFaltaSangre.style.display = 'none';
    }

    if (valorSangradoPermisible > 0 && valorSangradoActual >= (valorSangradoPermisible * 0.8)) {
        alertaTransfusion.classList.remove('oculta');
    } else {
        alertaTransfusion.classList.add('oculta');
    }
}

const inputsLiquidos = [
    document.getElementById('cristaloides-pasados'),
    document.getElementById('coloides-pasados')
];
inputsLiquidos.forEach(input => { if(input) input.addEventListener('input', calcularSangradoActual); });
inputsModal.forEach(input => input.addEventListener('input', calcularSangradoActual));

// --- 3. LÓGICA DE EXPORTAR/COPIAR Y GUARDAR HISTORIAL ---
const btnCopiar = document.getElementById('btn-copiar');

btnCopiar.onclick = () => {
    const nombre = document.getElementById('id-nombre').value || "Paciente Anónimo";
    const cedula = document.getElementById('id-cedula').value || "-";
    const historia = document.getElementById('id-historia').value || "-";
    const edad = document.getElementById('id-edad').value || "-";
    const servicio = document.getElementById('id-servicio').value || "No especificado";
    const dx = document.getElementById('id-dx').value || "-";
    const plan = document.getElementById('id-plan').value || "-";
    const sangre = document.getElementById('id-sangre').value;

    const asaBase = document.getElementById('id-asa').value;
    const isEmergencia = document.getElementById('id-asa-e').checked;
    let asaFinal = asaBase;
    if (asaBase !== "-" && isEmergencia) asaFinal = asaBase + " E";
    else if (asaBase === "-") asaFinal = "No especificado";

    const peso = document.getElementById('peso').value || "0";
    const tipoPaciente = document.getElementById('tipo-paciente').value;
    const htoInicial = document.getElementById('hto-inicial').value || "0";
    const htoMinimo = document.getElementById('hto-minimo').value || "0";
    const trauma = document.getElementById('trauma').value;
    const ayuno = document.getElementById('ayuno').value || "0";
    const orina = document.getElementById('vol-orina').value || "0";
    const tiempoOrina = document.getElementById('tiempo-orina').value || "0";

    const pesoManchadas = document.getElementById('peso-manchadas').value;
    const pesoSecas = document.getElementById('peso-secas').value;
    const volFrasco = document.getElementById('vol-frasco').value;
    const volLavado = document.getElementById('vol-lavado').value;
    
    const cristPasados = parseFloat(document.getElementById('cristaloides-pasados').value) || 0;
    const colPasados = parseFloat(document.getElementById('coloides-pasados').value) || 0;
    const metaCrist = valorSangradoActual * 3;
    const metaCol = valorSangradoActual * 1;
    
    const volumenIntravascularRepuesto = (cristPasados / 3) + colPasados;
    let deficitReal = valorSangradoActual - volumenIntravascularRepuesto;
    if (deficitReal < 0) deficitReal = 0;
    
    const faltaCrist = deficitReal * 3;
    const faltaCol = deficitReal * 1;

    const fechaHoy = new Date().toLocaleDateString('es-ES') + " " + new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
    
    const pacienteActivoId = localStorage.getItem('pacienteActivoId');
    const nuevoId = pacienteActivoId ? pacienteActivoId : Date.now(); 

    const pacienteData = {
        id: nuevoId,
        fecha: fechaHoy,
        nombre, cedula, historia, edad, servicio, dx, plan,
        asaBase, isEmergencia, sangre,
        peso, tipoPaciente, htoInicial, htoMinimo, trauma, ayuno, orina, tiempoOrina,
        pesoManchadas, pesoSecas, volFrasco, volLavado, cristPasados, colPasados,
        sangrado: valorSangradoActual
    };

    let historial = JSON.parse(localStorage.getItem('historialPacientes')) || [];
    
    if (pacienteActivoId) {
        const index = historial.findIndex(p => p.id == pacienteActivoId);
        if (index !== -1) historial[index] = pacienteData;
        else historial.unshift(pacienteData);
    } else {
        historial.unshift(pacienteData);
    }

    if(historial.length > 5) historial.pop(); 
    localStorage.setItem('historialPacientes', JSON.stringify(historial));

    let bloqueReposicion = `💦 REPOSICIÓN DE VOLUMEN (Al momento de copiar):
[CRISTALOIDES]
- Meta Sugerida (3:1): ${metaCrist} ml
- Administrado: ${cristPasados} ml
- Faltante Estimado: ${faltaCrist.toFixed(0)} ml`;

    if (valorSangradoPermisible > 0 && valorSangradoActual >= valorSangradoPermisible) {
        bloqueReposicion += `\n\n[SANGRE / COLOIDES]
- Meta Sugerida (1:1): ${metaCol} ml
- Administrado: ${colPasados} ml
- Faltante Estimado: ${faltaCol.toFixed(0)} ml`;
    } else if (colPasados > 0) {
        bloqueReposicion += `\n\n[SANGRE / COLOIDES]
- Administrado (Anotación): ${colPasados} ml`;
    }

    const textoResumen = `📋 RESUMEN ANESTÉSICO - HEMOCALC
📅 Fecha: ${fechaHoy}
----------------------------------------
👤 IDENTIFICACIÓN DEL PACIENTE:
- Nombre: ${nombre}
- Cédula: ${cedula} | Historia: ${historia}
- Edad: ${edad} años | Peso: ${peso} kg
- Estado Físico: ${asaFinal} | Grupo Sanguíneo: ${sangre}
- Servicio: ${servicio}
- Diagnóstico: ${dx}
- Procedimiento: ${plan}

🩸 PARÁMETROS HEMODINÁMICOS:
- Hto Inicial: ${htoInicial}%
- Volemia Estimada (VSE): ${resVolemia.innerText}
- Sangrado Máx. Permisible: ${resSangrado.innerText}

💧 LÍQUIDOS INTRAOPERATORIOS:
- Mantenimiento: ${resMantenimiento.innerText}
- Pérdidas Insensibles: ${resInsensibles.innerText}
- Déficit por Ayuno: ${resAyuno.innerText}

📊 BALANCE Y CUANTIFICACIÓN FINAL:
- Sangrado Estimado: ${valorSangradoActual} ml
- Gasto Urinario: ${resDiuresis.innerText}

${bloqueReposicion}
----------------------------------------`;

    navigator.clipboard.writeText(textoResumen).then(() => {
        const textoOriginal = btnCopiar.innerText;
        btnCopiar.innerText = "✅ ¡Copiado y Guardado!";
        btnCopiar.style.backgroundColor = "#16a34a";
        
        setTimeout(() => {
            btnCopiar.innerText = textoOriginal;
            btnCopiar.style.backgroundColor = "var(--primary-color)";
            window.location.href = "index.html";
        }, 1500);
    }).catch(err => {
        alert("Hubo un error al copiar. Revisa los permisos.");
    });
};