
/* =========================
   CONFIGURACIÓN
========================= */
const SHEET_ID  = "1kSROYgfS696IbbXCSglfe9JqfzrE1CeCuPvJeWIwiMY";
const GID_GROUPS= "2016873157";
const GID_POINTS= "71021384";
const GID_FASE2 = "521566270";

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
   ESTADO GLOBAL
========================= */
let participants      = [];
let matches           = [];
let matchesFase2      = [];
let currentPlayerIndex= 0;
let currentPhase      = 1;
let currentMatchIndex = 0;
let matchAnimating    = false;
let _bracketSVG = null;


/* =========================
   UTILIDADES
========================= */
function getDrivePhoto(url){
    if(!url) return "";
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : url;
}
function parseCSV(text){
    const lines = text.trim().split("\n");
    const headers = splitCSVLine(lines[0]).map(h=>h.trim());
    return lines.slice(1).map(line=>{
        const cols=splitCSVLine(line); const obj={};
        headers.forEach((h,i)=>{obj[h]=(cols[i]||"").trim();}); return obj;
    });
}
function splitCSVLine(line){
    const delimiter=line.includes("\t")?"\t":",";
    const cols=[]; let cur="",inQ=false;
    for(let ch of line){
        if(ch==='"') inQ=!inQ;
        else if(ch===delimiter&&!inQ){cols.push(cur.trim());cur="";}
        else cur+=ch;
    }
    cols.push(cur.trim()); return cols;
}
function getStatus(rawL,rawV,rL,rV,pL,pV){
    if(rawL===""||rawV==="") return{icon:"⏳",class:""};
    if(rL===pL&&rV===pV) return{icon:"✅",class:"exact"};
    const rW=rL>rV?"L":rV>rL?"V":"E", pW=pL>pV?"L":pV>pL?"V":"E";
    if(rW===pW) return{icon:"🟡",class:"winner"};
    return{icon:"❌",class:"fail"};
}

/* =========================
   TABS
========================= */

/*
function setPhase(phase, e) {
    currentPhase = phase;

    // 1. quitar active a todos los tabs
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // 2. activar el clickeado
    e.currentTarget.classList.add("active");

    // 3. cambiar vistas
    document.getElementById("fase1").style.display = phase === 1 ? "block" : "none";
    document.getElementById("fase2").style.display = phase === 2 ? "block" : "none";

    if (phase === 2) renderBrackets();
}*/

const PHASE2_PASSWORD = "2026";
function setPhase(phase, e) {
    currentPhase = phase;

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // 🔒 BLOQUEO VISUAL + LÓGICO
    if (phase === 2) {
        const pass = prompt("🔒 Fase 2 bloqueada. Ingresa la contraseña:");

        if (pass !== PHASE2_PASSWORD) {
            alert("❌ Incorrecto");
            return;
        }

        // desbloquea visualmente el tab si entra
        const tab2 = document.getElementById("tabFase2");
        if (tab2) tab2.classList.remove("locked");
    }

    e.currentTarget.classList.add("active");

    document.getElementById("fase1").style.display = phase === 1 ? "block" : "none";
    document.getElementById("fase2").style.display = phase === 2 ? "block" : "none";

    if (phase === 2) renderBrackets();
}


/* =========================
   CARGA DE DATOS
========================= */
async function loadGoogleSheet(){
    try{
        const csvURL=gid=>`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
        const [gR,pR,f2R]=await Promise.all([fetch(csvURL(GID_GROUPS)),fetch(csvURL(GID_POINTS)),fetch(csvURL(GID_FASE2))]);
        const gT=await gR.text(), pT=await pR.text(), f2T=await f2R.text();

        let lines=gT.trim().split("\n");
        const fl=lines[0]?.toLowerCase()||"";
        if(fl.includes("quiniela")||fl.includes("fase")) lines=lines.slice(1);
        matches=parseCSV(lines.join("\n"));

        let lines2=f2T.trim().split("\n");
        const fl2=lines2[0]?.toLowerCase()||"";
        if(fl2.includes("quiniela")||fl2.includes("fase")) lines2=lines2.slice(1);
        matchesFase2=parseCSV(lines2.join("\n"));

        const points=parseCSV(pT);
        buildParticipants();
        renderRanking(points);
        renderPlayer();
        populateMatchSelect();
        setupMatchButtons();
        renderMatchView();
        if(currentPhase===2) renderBrackets();
    }catch(err){ console.error("Error cargando sheet:",err); }
}

function buildParticipants(){ participants=Object.keys(PLAYER_PHOTOS); }

/* =========================
   BRACKET FASE 2
   Estructura Excel: PartidoID | Ronda | JugadorA | PaisA | BanderaA | FIFAA |
                     JugadorB | PaisB | BanderaB | FIFAB | GolA | GolB | Ganador | SiguientePartido | LadoSiguiente
========================= */


function stars(n){
    const max = 5;
    const filled = Number(n) || 0;

    let out = "";

    for(let i=1;i<=max;i++){
        if(i <= filled){
            out += "★"; // llena
        } else {
            out += "☆"; // vacía
        }
    }

    return out;
}

//function stars(n){ return "⭐".repeat(Number(n)||0); }


/* ── FLAGS ── */
const FLAG_OVERRIDE = {
    "ENG": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "SCO": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "WAL": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    // agrega excepciones aquí si las necesitas
};
 
function countryFlagImg(code){

    if(!code) return "";

    code = String(code).toLowerCase();

    return `<img 
        src="https://flagcdn.com/24x18/${code}.png"
        style="width:22px; height:16px; border-radius:3px;"
        alt="${code}">
    `;
}

function buildTeamRow(player, country, flag, fifa, score, isWinner, isLoser){
    const cls = isWinner?"winner":isLoser?"loser":"";
    const sc  = (score!==undefined&&score!==""&&score!==null) ? score : "–";
    return `<div class="bm-team-row ${cls}">
        <span class="bm-flag">${countryFlagImg(flag)}</span>
        <div class="bm-team-left">
            <span class="bm-player">${player}</span>
            <span class="bm-country">${country}</span>
            <span class="bm-stars">${stars(fifa)}</span>
        </div>
        <span class="bm-score">${sc}</span>
    </div>`;
}

function buildMatchCard(m, delay){

    // 🔴 VALIDACIÓN GLOBAL (si falta cualquier dato del partido → bloqueado)
    const isInvalid = (v) =>
        v === null ||
        v === undefined ||
        v === "" ||
        v === "#N/A";

    if (
        !m ||
        isInvalid(m.JugadorA) ||
        isInvalid(m.JugadorB) ||
        isInvalid(m.PaisA) ||
        isInvalid(m.PaisB) ||
        isInvalid(m.BanderaA) ||
        isInvalid(m.BanderaB)
    ) {
        return `
        <div class="bracket-match bracket-match--locked" style="animation-delay:${delay}s">
            <div class="locked-content">
                <div class="locked-icon">🔒</div>
                <div class="locked-text">PRÓXIMAMENTE</div>
            </div>
        </div>`;
    }

    // 🟢 SI TODO ESTÁ BIEN → PARTIDO NORMAL
    const hasResult =
        m.GolA !== "" && m.GolB !== "" &&
        m.GolA !== undefined && m.GolB !== undefined &&
        m.GolA !== "#N/A" && m.GolB !== "#N/A";

    const winA = hasResult && m.Ganador === m.JugadorA;
    const winB = hasResult && m.Ganador === m.JugadorB;

    const isChampion =
        m.Ronda === "Final" && hasResult && m.Ganador;

    const winner = isChampion
        ? (winA
            ? { p: m.JugadorA, c: m.PaisA, f: m.BanderaA }
            : { p: m.JugadorB, c: m.PaisB, f: m.BanderaB })
        : null;

    return `
    <div class="bm-card${m.Ronda === "Final" ? " bm-final" : ""}" style="animation-delay:${delay}s">

        <div class="bm-card-id">${m.PartidoID} · ${m.Ronda}</div>

        ${buildTeamRow(
            m.JugadorA,
            m.PaisA,
           m.BanderaA,
            m.FIFAA,
            hasResult ? m.GolA : undefined,
            winA,
            hasResult && !winA
        )}

        <div class="bm-vs-bar"><span class="bm-vs-txt">VS</span></div>

        ${buildTeamRow(
            m.JugadorB,
            m.PaisB,
            m.BanderaB,
            m.FIFAB,
            hasResult ? m.GolB : undefined,
            winB,
            hasResult && !winB
        )}

        ${
            winner
                ? `<div class="bm-champion">
                        <div class="bm-trophy">🏆</div>
                        <div class="bm-champ-name">
                            ${winner.p} ${winner.f} Campeón
                        </div>
                   </div>`
                : ""
        }
    </div>`;
}




/* ── BRACKET STATE ── */
let _svg      = null;
let _board    = null;
let _winPath  = [];
let _scale    = 0.72;   // zoom inicial para que entre en pantalla
let _tx       = 0;
let _ty       = 0;
let _dragging = false;
let _last     = { x: 0, y: 0 };
 
const PAIRS = [
    ["R1","C1"],["R2","C1"],["R3","C2"],["R4","C2"],
    ["R5","C3"],["R6","C3"],["R7","C4"],["R8","C4"],
    ["R9","C5"],["R10","C5"],["R11","C6"],["R12","C6"],
    ["R13","C7"],["R14","C7"],["R15","C8"],["R16","C8"],
    ["C1","QF1"],["C2","QF1"],["C3","QF2"],["C4","QF2"],
    ["C5","QF3"],["C6","QF3"],["C7","QF4"],["C8","QF4"],
    ["QF1","S1"],["QF2","S1"],["QF3","S2"],["QF4","S2"],
    ["S1","F1"],["S2","F1"],
];
 
/* ── RENDER BRACKET ── */
function renderBrackets() {
    const container = document.getElementById("bracketContainer");
    if (!matchesFase2 || matchesFase2.length === 0) {
        container.innerHTML = `<div class="bm-empty">⏳ Datos de Fase 2 aún no disponibles</div>`;
        return;
    }
 
    const byId = {};
    matchesFase2.forEach(m => { byId[m.PartidoID] = m; });
 
    const r32   = ["R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12","R13","R14","R15","R16"];
    const c16   = ["C1","C2","C3","C4","C5","C6","C7","C8"];
    const qf    = ["QF1","QF2","QF3","QF4"];
    const sf    = ["S1","S2"];
    const final = ["F1"];
 
    function col(ids, cls) {
        return `<div class="col ${cls}">
            ${ids.map(id => `<div class="slot" id="slot-${id}">${buildMatchCard(byId[id], 0)}</div>`).join("")}
        </div>`;
    }
 
    container.innerHTML = `
    <div class="bracket-viewport" id="bracketViewport">
        <div class="bracket-board" id="bracketBoard">
            ${col(r32,  "col-r32")}
            ${col(c16,  "col-c16")}
            ${col(qf,   "col-qf")}
            ${col(sf,   "col-sf")}
            ${col(final,"col-final")}
        </div>
    </div>
    <div class="bracket-controls">
        <button onclick="bracketZoom(0.15)">＋</button>
        <button onclick="bracketZoom(-0.15)">－</button>
        <button onclick="bracketReset()">⊙</button>
    </div>`;
 
    _board = document.getElementById("bracketBoard");
    _svg   = null;   // se recrea en drawBracketLines
    _winPath = [];
    setupPanZoom();
    applyTransform();
 
    setTimeout(() => {
        drawBracketLines();
        autoHighlightWinner(byId);
    }, 120);
}
 
/* ── TRANSFORM ── */
function applyTransform() {
    if (!_board) return;
    _board.style.transform = `translate(${_tx}px,${_ty}px) scale(${_scale})`;
    _board.style.transformOrigin = "0 0";
    if (_svg) redrawLines();
}
 
function bracketZoom(delta) {
    _scale = Math.min(1.4, Math.max(0.3, _scale + delta));
    applyTransform();
}
 
function bracketReset() {
    _scale = 0.72; _tx = 0; _ty = 0;
    applyTransform();
}
 
/* ── PAN / ZOOM ── */
function setupPanZoom() {
    const vp = document.getElementById("bracketViewport");
    if (!vp) return;
 
    // wheel zoom
    vp.addEventListener("wheel", e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        _scale = Math.min(1.4, Math.max(0.3, _scale + delta));
        applyTransform();
    }, { passive: false });
 
    // mouse drag
    vp.addEventListener("mousedown", e => {
        _dragging = true; _last = { x: e.clientX, y: e.clientY };
        vp.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", e => {
        if (!_dragging) return;
        _tx += e.clientX - _last.x;
        _ty += e.clientY - _last.y;
        _last = { x: e.clientX, y: e.clientY };
        applyTransform();
    });
    window.addEventListener("mouseup", () => {
        _dragging = false;
        if (vp) vp.style.cursor = "grab";
    });
 
    // touch drag
    let lastTouch = null;
    vp.addEventListener("touchstart", e => { lastTouch = e.touches[0]; }, { passive: true });
    vp.addEventListener("touchmove", e => {
        if (!lastTouch) return;
        e.preventDefault();
        _tx += e.touches[0].clientX - lastTouch.clientX;
        _ty += e.touches[0].clientY - lastTouch.clientY;
        lastTouch = e.touches[0];
        applyTransform();
    }, { passive: false });
    vp.addEventListener("touchend", () => { lastTouch = null; });
 
    vp.style.cursor = "grab";
}
 
/* ── SVG LINES ── */
function drawBracketLines() {
    if (!_board) return;
 
    if (!_svg) {
        _svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        Object.assign(_svg.style, {
            position: "absolute", top: "0", left: "0",
            width: "100%", height: "100%",
            pointerEvents: "none", overflow: "visible", zIndex: "0",
        });
        _svg.innerHTML = `<defs>
            <linearGradient id="winGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#facc15"/>
                <stop offset="100%" stop-color="#22c55e"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>`;
        _board.prepend(_svg);
    }
 
    redrawLines();
}
 
function redrawLines() {
    if (!_svg || !_board) return;
    _svg.querySelectorAll("path[data-b]").forEach(p => p.remove());
 
    const bRect = _board.getBoundingClientRect();
 
    PAIRS.forEach(([fromId, toId], i) => {
        const fEl = document.getElementById(`slot-${fromId}`);
        const tEl = document.getElementById(`slot-${toId}`);
        if (!fEl || !tEl) return;
 
        const fR = fEl.getBoundingClientRect();
        const tR = tEl.getBoundingClientRect();
 
        // coords in board space (accounting for scale)
        const x1 = (fR.right  - bRect.left) / _scale;
        const y1 = (fR.top + fR.height / 2 - bRect.top) / _scale;
        const x2 = (tR.left   - bRect.left) / _scale;
        const y2 = (tR.top + tR.height / 2 - bRect.top) / _scale;
        const mx = (x1 + x2) / 2;
 
        const isWin = _winPath.includes(fromId) && _winPath.includes(toId);
        const path  = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("data-b", `${fromId}-${toId}`);
       const midX = (x1 + x2) / 2;

        path.setAttribute(
            "d",
            `M${x1},${y1}
            L${midX},${y1}
            L${midX},${y2}
            L${x2},${y2}`
        );
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", isWin ? "url(#winGrad)" : "rgba(34,197,94,0.35)");
        path.setAttribute("stroke-width", isWin ? 6 : 4);
        if (isWin) path.setAttribute("filter", "url(#glow)");
 
        // draw animation (first render only)
        const len = 300;
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;
        path.style.transition = `stroke-dashoffset 0.45s ease ${i * 15}ms`;
        _svg.appendChild(path);
        requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; }));
    });
}
 

/* Auto-resolve winner path from data */
function autoHighlightWinner(byId) {
    // build adjacency: PartidoID → SiguientePartido
    const next = {};
    matchesFase2.forEach(m => { if (m.SiguientePartido) next[m.PartidoID] = m.SiguientePartido; });
 
    // find F1 winner's chain by walking backwards (Ganador → SiguientePartido links)
    const winnerSlots = new Set();
 
    function traceBack(id) {
        const m = byId[id];
        if (!m || !m.Ganador) return;
        winnerSlots.add(id);
        // find which match fed this winner
        matchesFase2.forEach(prev => {
            if (prev.SiguientePartido === id && prev.Ganador === m.JugadorA || prev.Ganador === m.JugadorB) {
                if (prev.Ganador === m.JugadorA || prev.Ganador === m.JugadorB) {
                    // only trace if this prev match's winner is the same as current slot's one of the players
                }
            }
        });
        // simpler: find source matches whose Ganador equals JugadorA or JugadorB of m
        matchesFase2.forEach(prev => {
            if (prev.SiguientePartido === id) {
                traceBack(prev.PartidoID);
            }
        });
    }
 
    // Even simpler: collect all slots where Ganador is defined → their edges
    const path = [];
    matchesFase2.forEach(m => {
        if (m.Ganador && m.SiguientePartido) path.push(m.PartidoID, m.SiguientePartido);
    });
    const finalMatch = byId["F1"];
    if (finalMatch && finalMatch.Ganador) path.push("F1");
 
    highlightWinner([...new Set(path)]);
}
 
 

 


/* =========================
   RANKING
========================= */
function calcularRachas(){
    const rachas={};
    participants.forEach(player=>{
        let racha=0;
        for(let i=matches.length-1;i>=0;i--){
            const row=matches[i];
            if(row.ResultadoLocal===""||row.ResultadoVisitante==="") continue;
            const rL=Number(row.ResultadoLocal),rV=Number(row.ResultadoVisitante);
            const pL=Number(row[`${player}Local`]),pV=Number(row[`${player}Visitante`]);
            const s=getStatus(row.ResultadoLocal,row.ResultadoVisitante,rL,rV,pL,pV);
            if(s.icon==="✅"||s.icon==="🟡") racha++; else break;
        }
        rachas[player]=racha;
    });
    return rachas;
}

function renderRanking(points){
    const tbody=document.getElementById("rankingBody");
    tbody.innerHTML="";
    const rachas=calcularRachas();
    const ranking=points
        .map(row=>({name:row.Participante,total:Number(row["Total"]||0),prevTotal:Number(row["TotalPrevio"]||0)}))
        .filter(p=>p.name).sort((a,b)=>b.total-a.total);
    const prevPosMap={};
    [...ranking].sort((a,b)=>b.prevTotal-a.prevTotal).forEach((p,i)=>prevPosMap[p.name]=i+1);
    ranking.forEach((player,index)=>{
        const pos=index+1, diff=(prevPosMap[player.name]||pos)-pos, racha=rachas[player.name]||0;
        const css=pos===1?"gold":pos===2?"silver":pos===3?"bronze":"";
        const trend=diff>0?`<span class="trend-up">▲${diff}</span>`:diff<0?`<span class="trend-down">▼${Math.abs(diff)}</span>`:`<span class="trend-same">—</span>`;
        const rachaH=racha>=3?`<span class="racha-hot">🔥${racha}</span>`:racha>=1?`<span class="racha-ok">⚡${racha}</span>`:`<span class="racha-cold">❄️</span>`;
        const tr=document.createElement("tr");
        tr.innerHTML=`<td class="${css}">${pos}</td><td>${player.name} ${rachaH}</td><td>${player.total}</td><td>${trend}</td>`;
        tbody.appendChild(tr);
    });
}

/* =========================
   PLAYER CARD
========================= */
function renderPlayer(){
    const player=participants[currentPlayerIndex];
    document.getElementById("playerName").textContent=player;
    const img=document.getElementById("playerPhoto");
    img.src=getDrivePhoto(PLAYER_PHOTOS[player]||"");
    img.onerror=()=>{img.src="";img.alt=player;};
    renderPredictions(player);
}
function renderPredictions(player){
    const tbody=document.getElementById("predictionBody");
    tbody.innerHTML="";
    matches.forEach(row=>{
        const rL=Number(row.ResultadoLocal),rV=Number(row.ResultadoVisitante);
        const pL=Number(row[`${player}Local`]),pV=Number(row[`${player}Visitante`]);
        const s=getStatus(row.ResultadoLocal,row.ResultadoVisitante,rL,rV,pL,pV);
        const tr=document.createElement("tr");
        tr.innerHTML=`<td>${row.EquipoLocal} vs ${row.EquipoVisitante}</td>
            <td>${row.ResultadoLocal===""?"-":rL} - ${row.ResultadoVisitante===""?"-":rV}</td>
            <td>${isNaN(pL)?"-":pL} - ${isNaN(pV)?"-":pV}</td>
            <td class="${s.class}">${s.icon}</td>`;
        tbody.appendChild(tr);
    });
}

/* =========================
   BOTONES PLAYER
========================= */
function setupButtons(){
    document.getElementById("prevBtn").onclick=()=>{ currentPlayerIndex=(currentPlayerIndex-1+participants.length)%participants.length; transitionPlayer(); };
    document.getElementById("nextBtn").onclick=()=>{ currentPlayerIndex=(currentPlayerIndex+1)%participants.length; transitionPlayer(); };
}
function transitionPlayer(){
    const photo=document.getElementById("playerPhoto"),name=document.getElementById("playerName"),loader=document.getElementById("ballLoader");
    photo.style.opacity="0";photo.style.transform="scale(0.85)";
    name.style.opacity="0";name.style.transform="translateY(8px)";
    loader.classList.add("active");
    setTimeout(()=>{
        renderPlayer();
        const img=document.getElementById("playerPhoto");
        const show=()=>{loader.classList.remove("active");img.style.opacity="1";img.style.transform="scale(1)";name.style.opacity="1";name.style.transform="translateY(0)";};
        img.complete?show():(img.onload=show,img.onerror=show);
    },350);
}

/* =========================
   MATCH VIEW
========================= */
function populateMatchSelect(){
    const select=document.getElementById("matchSelect");
    select.innerHTML="";
    matches.forEach((row,i)=>{
        const opt=document.createElement("option");
        opt.value=i;opt.textContent=`${row.EquipoLocal} vs ${row.EquipoVisitante}`;
        select.appendChild(opt);
    });
    select.onchange=()=>{
        if(matchAnimating) return;
        const prev=currentMatchIndex;
        currentMatchIndex=Number(select.value);
        animateMatchTransition(currentMatchIndex>prev?"right":"left");
    };
}
function setupMatchButtons(){
    document.getElementById("prevMatchBtn").onclick=()=>{
        if(matchAnimating) return;
        currentMatchIndex=(currentMatchIndex-1+matches.length)%matches.length;
        document.getElementById("matchSelect").value=currentMatchIndex;
        animateMatchTransition("left");
    };
    document.getElementById("nextMatchBtn").onclick=()=>{
        if(matchAnimating) return;
        currentMatchIndex=(currentMatchIndex+1)%matches.length;
        document.getElementById("matchSelect").value=currentMatchIndex;
        animateMatchTransition("right");
    };
}
function animateMatchTransition(direction){
    matchAnimating=true;
    const card=document.getElementById("matchCard"),label=document.getElementById("matchLabel");
    const exitX=direction==="right"?"-60px":"60px",enterX=direction==="right"?"60px":"-60px";
    card.style.transition="opacity 0.22s ease, transform 0.22s ease";
    label.style.transition="opacity 0.22s ease, transform 0.22s ease";
    card.style.opacity="0";card.style.transform=`translateX(${exitX})`;
    label.style.opacity="0";label.style.transform=`translateX(${exitX}) scale(0.92)`;
    setTimeout(()=>{
        renderMatchView();
        card.style.transition="none";label.style.transition="none";
        card.style.transform=`translateX(${enterX})`;label.style.transform=`translateX(${enterX}) scale(0.92)`;
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
            card.style.transition="opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.4,0.64,1)";
            label.style.transition="opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.4,0.64,1)";
            card.style.opacity="1";card.style.transform="translateX(0)";
            label.style.opacity="1";label.style.transform="translateX(0) scale(1)";
            document.querySelectorAll("#matchBody tr").forEach((row,i)=>{
                row.style.opacity="0";row.style.transform="translateY(12px)";row.style.transition="none";
                setTimeout(()=>{row.style.transition=`opacity 0.22s ease ${i*35}ms, transform 0.22s ease ${i*35}ms`;row.style.opacity="1";row.style.transform="translateY(0)";},60+i*35);
            });
            setTimeout(()=>{matchAnimating=false;},400);
        }));
    },230);
}
function renderMatchView(){
    if(!matches||matches.length===0) return;
    const row=matches[currentMatchIndex],rL=row.ResultadoLocal,rV=row.ResultadoVisitante;
    document.getElementById("matchCounter").textContent=`Partido ${currentMatchIndex+1} / ${matches.length}`;
    const sel=document.getElementById("matchSelect");if(sel)sel.value=currentMatchIndex;
    const tbody=document.getElementById("matchBody");tbody.innerHTML="";
    participants.forEach(player=>{
        const pL=Number(row[`${player}Local`]),pV=Number(row[`${player}Visitante`]);
        const s=getStatus(rL,rV,Number(rL),Number(rV),pL,pV);
        const bg=s.icon==="✅"?"background:rgba(34,197,94,0.07);":s.icon==="🟡"?"background:rgba(250,204,21,0.05);":s.icon==="❌"?"background:rgba(239,68,68,0.04);":"";
        const tr=document.createElement("tr");tr.setAttribute("style",bg);
        tr.innerHTML=`<td style="font-weight:600">${player}</td>
            <td><span class="score-badge">${isNaN(pL)?"-":pL} - ${isNaN(pV)?"-":pV}</span></td>
            <td><span class="score-badge">${rL===""?"-":rL} - ${rV===""?"-":rV}</span></td>
            <td class="${s.class}">${s.icon}</td>`;
        tbody.appendChild(tr);
    });
}


function startCountdown(){

    // 🎯 FECHA DEL LIVE
    const targetDate = new Date("2026-06-27T19:00:00");

    const countdownEl = document.getElementById("countdown");

    function update(){
        const now = new Date();
        const diff = targetDate - now;

        if(diff <= 0){
            countdownEl.textContent = "🔴 EN VIVO AHORA";
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);

        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownEl.textContent =
            `Empieza en ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
}
/* =========================
   INTRO + MÚSICA
========================= */
(function(){
    const intro=document.getElementById("intro"),music=document.getElementById("bgMusic"),btn=document.getElementById("musicBtn");
    let playing=false;
    function cerrarIntro(){
        intro.classList.add("explode");
        setTimeout(()=>intro.classList.add("hidden"),700);
        music.volume=0.3;
        music.play().then(()=>{playing=true;btn.textContent="🔊";btn.classList.add("playing");}).catch(()=>{});
    }
    const auto=setTimeout(cerrarIntro,5000);
    intro.addEventListener("click",()=>{clearTimeout(auto);cerrarIntro();});
    btn.addEventListener("click",()=>{
        if(playing){music.pause();playing=false;btn.textContent="🔇";btn.classList.remove("playing");}
        else{music.volume=0.3;music.play();playing=true;btn.textContent="🔊";btn.classList.add("playing");}
    });
})();

/* ==============================================
   PEGA ESTO AL FINAL DE app.js
   (y elimina las dos funciones highlightWinner
   anteriores + autoHighlightWinner que ya tienes)
============================================== */

/* ── MAPA: partido → ganador avanza a ── */
/* Se construye desde matchesFase2 en runtime  */
let _pathCache = {};   // { "R1": ["R1","C1","QF1","S1","F1"], ... }
let _hoveredSlot = null;

/* Construye todos los caminos posibles desde cada slot hasta F1 */
function buildPathCache(byId) {
    _pathCache = {};

    /* next[id] = id del siguiente partido */
    const nextMatch = {};
    matchesFase2.forEach(m => {
        if (m.SiguientePartido) nextMatch[m.PartidoID] = m.SiguientePartido;
    });

    /* Para cada slot, camina hacia adelante hasta F1 */
    Object.keys(byId).forEach(startId => {
        const chain = [startId];
        let cur = startId;
        while (nextMatch[cur]) {
            cur = nextMatch[cur];
            chain.push(cur);
        }
        _pathCache[startId] = chain;
    });
}

/* ── HOVER en los slots ── */
function attachSlotHover() {
    document.querySelectorAll(".slot").forEach(slot => {
        const id = slot.id.replace("slot-", "");

        slot.addEventListener("mouseenter", () => {
            _hoveredSlot = id;
            paintHover(id);
        });
        slot.addEventListener("mouseleave", () => {
            _hoveredSlot = null;
            clearHover();
        });

        /* touch support */
        slot.addEventListener("touchstart", e => {
            e.stopPropagation();
            _hoveredSlot = id;
            paintHover(id);
        }, { passive: true });
    });

    /* toca fuera → limpia */
    document.getElementById("bracketViewport")?.addEventListener("touchstart", () => {
        if (_hoveredSlot) { _hoveredSlot = null; clearHover(); }
    }, { passive: true });
}

function paintHover(activeId) {
    const activePath = _pathCache[activeId] || [activeId];

    /* dim todos los slots menos el activo y su camino */
    document.querySelectorAll(".slot").forEach(slot => {
        const id = slot.id.replace("slot-", "");
        slot.style.transition = "opacity 0.25s, filter 0.25s";
        if (activePath.includes(id)) {
            slot.style.opacity = "1";
            slot.style.filter  = "none";
        } else {
            slot.style.opacity = "0.18";
            slot.style.filter  = "grayscale(1) brightness(0.5)";
        }
    });

    /* resalta líneas del camino */
    if (_svg) {
        _svg.querySelectorAll("path[data-b]").forEach(path => {
            const [from, to] = path.getAttribute("data-b").split("~~");
            const onPath = activePath.includes(from) && activePath.includes(to);
            path.setAttribute("stroke",       onPath ? "url(#winGrad)" : "rgba(34,197,94,0.08)");
            path.setAttribute("stroke-width", onPath ? "4" : "1.5");
            path.style.transition = "stroke 0.25s, stroke-width 0.25s";
            if (onPath) path.setAttribute("filter", "url(#glow)");
            else        path.removeAttribute("filter");
        });
    }
}

function clearHover() {
    document.querySelectorAll(".slot").forEach(slot => {
        slot.style.opacity = "1";
        slot.style.filter  = "none";
    });

    /* restaura líneas al estado de winner-auto */
    if (_svg) {
        _svg.querySelectorAll("path[data-b]").forEach(path => {
            const [from, to] = path.getAttribute("data-b").split("~~");
            const isWin = _winPath.includes(from) && _winPath.includes(to);
            path.setAttribute("stroke",       isWin ? "url(#winGrad)" : "rgba(34,197,94,0.28)");
            path.setAttribute("stroke-width", isWin ? "3.5" : "1.5");
            if (isWin) path.setAttribute("filter", "url(#glow)");
            else       path.removeAttribute("filter");
        });
    }
}

/* ── REDRAW LINES (reemplaza la función redrawLines existente) ── */
function redrawLines() {
    if (!_svg || !_board) return;
    _svg.querySelectorAll("path[data-b]").forEach(p => p.remove());

    const bRect = _board.getBoundingClientRect();

    /* Usamos un separador "~~" para el data-b para evitar
       colisiones con IDs tipo "QF1" que contienen "-" */

    PAIRS.forEach(([fromId, toId], i) => {
        const fEl = document.getElementById(`slot-${fromId}`);
        const tEl = document.getElementById(`slot-${toId}`);
        if (!fEl || !tEl) return;

        const fR = fEl.getBoundingClientRect();
        const tR = tEl.getBoundingClientRect();

        const x1  = (fR.right  - bRect.left) / _scale;
        const y1  = (fR.top + fR.height / 2 - bRect.top) / _scale;
        const x2  = (tR.left   - bRect.left) / _scale;
        const y2  = (tR.top + tR.height / 2 - bRect.top) / _scale;

        /* Elbow limpio: salida horizontal → bajada vertical → entrada horizontal */
        const elbowX = x1 + (x2 - x1) * 0.55;   // punto de quiebre
        const d = `M${x1},${y1} H${elbowX} V${y2} H${x2}`;

        const isWin = _winPath.includes(fromId) && _winPath.includes(toId);
        const path  = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("data-b",         `${fromId}~~${toId}`);
        path.setAttribute("d",              d);
        path.setAttribute("fill",           "none");
        path.setAttribute("stroke",         isWin ? "url(#winGrad)" : "rgba(34,197,94,0.28)");
        path.setAttribute("stroke-width",   isWin ? "3.5" : "1.5");
        path.setAttribute("stroke-linejoin","round");
        path.setAttribute("stroke-linecap", "round");
        if (isWin) path.setAttribute("filter", "url(#glow)");

        /* animación draw */
        const len = Math.abs(x2 - x1) + Math.abs(y2 - y1) + 40;
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;
        path.style.transition = `stroke-dashoffset 0.5s ease ${i * 12}ms`;
        _svg.appendChild(path);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            path.style.strokeDashoffset = "0";
        }));
    });
}

/* ── AUTO-HIGHLIGHT WINNER (reemplaza la existente) ── */
function autoHighlightWinner(byId) {
    buildPathCache(byId);

    /* Colecta slots donde hay ganador definido */
    const path = new Set();
    matchesFase2.forEach(m => {
        if (m.Ganador) {
            path.add(m.PartidoID);
            if (m.SiguientePartido) path.add(m.SiguientePartido);
        }
    });

    _winPath = [...path];
    redrawLines();      /* redibuja con winner ya definido */
    attachSlotHover();  /* activa hover después de que existan los slots */
}

/* ── HIGHLIGHT WINNER PÚBLICO ── */
function highlightWinner(pathIds) {
    _winPath = pathIds || [];
    redrawLines();
}

/* =========================
   INICIO
========================= */

document.addEventListener("DOMContentLoaded",()=>{
    loadGoogleSheet();
    setupButtons();
    startCountdown();
    setInterval(loadGoogleSheet,30000);

 // 🔒 BLOQUEO VISUAL DE FASE 2
    document.getElementById("fase2").classList.add("locked");
    
});
