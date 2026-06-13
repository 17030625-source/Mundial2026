/* =========================
   CONFIGURACIÓN
========================= */

const SHEET_ID = "1kSROYgfS696IbbXCSglfe9JqfzrE1CeCuPvJeWIwiMY";
const GID_GROUPS = "2016873157";
const GID_POINTS = "71021384";

const PLAYER_PHOTOS = {
    Ivan:   "https://drive.google.com/file/d/1fdAq7ecDmKsRa-VSznkXTIKdos19mgwz/view?usp=sharing",
    Brayan: "https://drive.google.com/file/d/1aUbhzMrX4wKN2Hd40kEd-I2RYc-mkZrS/view?usp=sharing",
    Jetzuz: "https://drive.google.com/file/d/1YqbEFNSecj5ThHuTGFLi-OpE5lBK5Ij-/view?usp=sharing",
    Yantoa: "https://drive.google.com/file/d/1MoYAawmK0PuwbhmAawVaPZgAJ-aP5sKF/view?usp=sharing",
    Tellez: "https://drive.google.com/file/d/1GvTCNy7rsVrFEKMmsohisYZd54WkZndz/view?usp=sharing",
    Tapia:  "https://drive.google.com/file/d/1kFmhFl1ecAXKCMNeF8YqQREMUw0hE6Jp/view?usp=sharing",
    Dante:  "https://drive.google.com/file/d/10cnjUNR8mdvIk3r5h7a2Moy-_OzHhXvW/view?usp=sharing",
    Dani:   "https://drive.google.com/file/d/1q0pUz6MwBt4NQ2S8pS-UMo9DoXDRPg4S/view?usp=sharing",
    Javis:  "https://drive.google.com/file/d/1wCbU_Urhsje3oJCjgIXUFxCRtqkqZlLl/view?usp=sharing",
    Pancho: "https://drive.google.com/file/d/138tUz0X7D8K6tMgJ2ELaPbehg8IuMCvz/view?usp=sharing",
    Alan:   "https://drive.google.com/file/d/1ZODKijW7orzLleRUErAJgEzeETZ-8ccR/view?usp=sharing"
};

/* =========================
   VARIABLES GLOBALES
========================= */

let participants = [];
let matches = [];
let currentPlayerIndex = 0;

/* =========================
   UTILIDAD: CONVERTIR URL DE DRIVE
========================= */

function getDrivePhoto(url){
    if(!url) return "";
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if(!match) return url;
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
}

/* =========================
   UTILIDAD: PARSEAR CSV
========================= */

function parseCSV(text){
    const lines = text.trim().split("\n");
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const cols = splitCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = (cols[i] || "").trim();
        });
        return obj;
    });
}

function splitCSVLine(line){
    const cols = [];
    let current = "";
    let inQuotes = false;
    for(let ch of line){
        if(ch === '"') inQuotes = !inQuotes;
        else if(ch === ',' && !inQuotes){ cols.push(current.trim()); current = ""; }
        else current += ch;
    }
    cols.push(current.trim());
    return cols;
}

/* =========================
   INICIO
========================= */

loadGoogleSheet();
setTimeout(() => loadGoogleSheet(), 30000);

/* =========================
   CARGAR SHEETS VÍA CSV
========================= */

async function loadGoogleSheet(){

    try{

        const csvURL = (gid) =>
            `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

        const [groupsRes, pointsRes] = await Promise.all([
            fetch(csvURL(GID_GROUPS)),
            fetch(csvURL(GID_POINTS))
        ]);

        const groupsText = await groupsRes.text();
        const pointsText = await pointsRes.text();

        // Fila 0: decorativa "Quiniela 2026..." → ignorar
        // Fila 1: headers reales → Fecha, EquipoLocal, ResultadoLocal, IvanLocal...
        // Fila 2+: partidos
        const allLines = groupsText.trim().split("\n");
        const csvDesdeHeaders = allLines.slice(1).join("\n");

        matches = parseCSV(csvDesdeHeaders);
        const points = parseCSV(pointsText);

        buildParticipants();
        renderRanking(points);
        renderPlayer();
        setupButtons();

    }
    catch(error){
        console.error("Error cargando sheet:", error);
    }
}

/* =========================
   PARTICIPANTES
========================= */

function buildParticipants(){
    participants = Object.keys(PLAYER_PHOTOS);
}

/* =========================
   RANKING
========================= */

function renderRanking(points){
 
    const tbody = document.getElementById("rankingBody");
    tbody.innerHTML = "";

    const ranking = points
        .map(row => ({
            name:      row.Participante,
            total:     Number(row["Total"] || 0),
            prevTotal: Number(row["TotalPrevio"] || 0)
        }))
        .filter(p => p.name)
        .sort((a,b) => b.total - a.total);

    // Calcular ranking previo basado en TotalPrevio
    const prevRanking = [...ranking]
        .sort((a,b) => b.prevTotal - a.prevTotal)
        .map((p, i) => ({ name: p.name, pos: i + 1 }));

    const prevPosMap = {};
    prevRanking.forEach(p => prevPosMap[p.name] = p.pos);

    ranking.forEach((player, index) => {

        const tr       = document.createElement("tr");
        const position = index + 1;
        const prevPos  = prevPosMap[player.name] || position;
        const diff     = prevPos - position;

        let cssClass = "";
        if(position === 1) cssClass = "gold";
        if(position === 2) cssClass = "silver";
        if(position === 3) cssClass = "bronze";

        let trendHTML = "";
        if(diff > 0){
            trendHTML = `<span class="trend-up">▲${diff}</span>`;
        } else if(diff < 0){
            trendHTML = `<span class="trend-down">▼${Math.abs(diff)}</span>`;
        } else {
            trendHTML = `<span class="trend-same">—</span>`;
        }

        tr.innerHTML = `
            <td class="${cssClass}">${position}</td>
            <td>${player.name}</td>
            <td>${player.total}</td>
            <td>${trendHTML}</td>
        `;

        tbody.appendChild(tr);
    });
}

/* =========================
   BOTONES
========================= */

function setupButtons(){

    document.getElementById("prevBtn").onclick = () => {
        currentPlayerIndex--;
        if(currentPlayerIndex < 0) currentPlayerIndex = participants.length - 1;
        transitionPlayer();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentPlayerIndex++;
        if(currentPlayerIndex >= participants.length) currentPlayerIndex = 0;
        transitionPlayer();
    };
}

/* =========================
   PARTICIPANTE ACTUAL
========================= */

function renderPlayer(){

    const player = participants[currentPlayerIndex];

    document.getElementById("playerName").textContent = player;

    const photoURL = getDrivePhoto(PLAYER_PHOTOS[player] || "");
    const img = document.getElementById("playerPhoto");
    img.src = photoURL;
    img.onerror = () => { img.src = ""; img.alt = player; };

    renderPredictions(player);
}

/* =========================
   TABLA PRONÓSTICOS
========================= */

function renderPredictions(player){

    const tbody = document.getElementById("predictionBody");
    tbody.innerHTML = "";

    matches.forEach(row => {

        const local = row.EquipoLocal;
        const visit = row.EquipoVisitante;

        const realLocal  = Number(row.ResultadoLocal);
        const realVisit  = Number(row.ResultadoVisitante);
        const predLocal  = Number(row[`${player}Local`]);
        const predVisit  = Number(row[`${player}Visitante`]);

        const status = getStatus(
            row.ResultadoLocal,
            row.ResultadoVisitante,
            realLocal,
            realVisit,
            predLocal,
            predVisit
        );

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${local} vs ${visit}</td>
            <td>${row.ResultadoLocal === "" ? "-" : realLocal} - ${row.ResultadoVisitante === "" ? "-" : realVisit}</td>
            <td>${isNaN(predLocal) ? "-" : predLocal} - ${isNaN(predVisit) ? "-" : predVisit}</td>
            <td class="${status.class}">${status.icon}</td>
        `;

        tbody.appendChild(tr);
    });
}

/* =========================
   TRANSICION
========================= */

function setupButtons(){

    document.getElementById("prevBtn").onclick = () => {
        currentPlayerIndex--;
        if(currentPlayerIndex < 0) currentPlayerIndex = participants.length - 1;
        transitionPlayer();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentPlayerIndex++;
        if(currentPlayerIndex >= participants.length) currentPlayerIndex = 0;
        transitionPlayer();
    };
}

function transitionPlayer(){

    const photo  = document.getElementById("playerPhoto");
    const name   = document.getElementById("playerName");
    const loader = document.getElementById("ballLoader");

    photo.style.opacity   = "0";
    photo.style.transform = "scale(0.85)";

    name.style.opacity   = "0";
    name.style.transform = "translateY(8px)";

    loader.classList.add("active");

    setTimeout(() => {

        renderPlayer();

        const img = document.getElementById("playerPhoto");

        const mostrar = () => {
            loader.classList.remove("active");
            img.style.opacity   = "1";
            img.style.transform = "scale(1)";
            name.style.opacity   = "1";
            name.style.transform = "translateY(0)";
        };

        if(img.complete){
            mostrar();
        } else {
            img.onload  = mostrar;
            img.onerror = mostrar;
        }

    }, 350);
}


/* =========================
   INTRO + MÚSICA
========================= */

(function(){

    const intro    = document.getElementById("intro");
    const music    = document.getElementById("bgMusic");
    const musicBtn = document.getElementById("musicBtn");
    let   playing  = false;

    function cerrarIntro(){

        // Efecto explosión en la imagen
        intro.classList.add("explode");

        // Después del efecto, fade out del overlay completo
        setTimeout(() => {
            intro.classList.add("hidden");
        }, 700);

        // Intentar reproducir música
        music.volume = 0.3;
        music.play()
            .then(() => {
                playing = true;
                musicBtn.textContent = "🔊";
                musicBtn.classList.add("playing");
            })
            .catch(() => {
                // Bloqueado por el navegador — el usuario usa el botón
            });
    }

    // Auto-cerrar a los 5 segundos
    const autoClose = setTimeout(cerrarIntro, 5000);

    // Cerrar si toca la pantalla antes
    intro.addEventListener("click", () => {
        clearTimeout(autoClose);
        cerrarIntro();
    });

    // Botón música
    musicBtn.addEventListener("click", () => {

        if(playing){
            music.pause();
            playing = false;
            musicBtn.textContent = "🔇";
            musicBtn.classList.remove("playing");
        } else {
            music.volume = 0.3;
            music.play();
            playing = true;
            musicBtn.textContent = "🔊";
            musicBtn.classList.add("playing");
        }
    });

})();



/* =========================
   ESTADO
========================= */

function getStatus(rawLocal, rawVisit, realLocal, realVisit, predLocal, predVisit){

    if(rawLocal === "" || rawVisit === ""){
        return { icon:"⏳", class:"" };
    }

    if(realLocal === predLocal && realVisit === predVisit){
        return { icon:"✅", class:"exact" };
    }

    const realWinner = realLocal > realVisit ? "L" : realVisit > realLocal ? "V" : "E";
    const predWinner = predLocal > predVisit ? "L" : predVisit > predLocal ? "V" : "E";

    if(realWinner === predWinner){
        return { icon:"🟡", class:"winner" };
    }

    return { icon:"❌", class:"fail" };
}