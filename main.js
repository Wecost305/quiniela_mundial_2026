// =================================================================================
// === QUINIELA MUNDIAL 2026 - CÓDIGO JAVASCRIPT MAESTRO, FINAL Y VERIFICADO      ===
// =================================================================================

// --- CONFIGURACIÓN GLOBAL ---
const STORAGE_KEY = 'quinielaMundial2026_data_v2'; // v2 para evitar conflictos con datos viejos
const TEAMS_DATA = {};
let isLoading = false;
let currentUserId = null; // ¡NUEVO! Guardará el ID del usuario de la URL.
let storageKey = 'quinielaMundial2026_data'; // Clave base, la haremos única.

function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('user'); // Busca el parámetro ?user=...
}

const BRACKET_MAP = {
    // =====================================
    // FIFA World Cup 26™ (48 equipos)
    // Round of 32 (M73-M88)  -> usamos ids 16-1..16-16
    // Round of 16 (M89-M96)  -> usamos ids 8-1..8-8
    // QF (M97-M100)          -> usamos ids 4-1..4-4
    // SF (M101-M102)         -> usamos ids 2-1..2-2
    // 3rd place (M103)       -> id 3-1
    // Final (M104)           -> id 1-1
    // =====================================

    // --- Round of 32 -> Round of 16 (según Art. 12.7 del reglamento)
    // M89: W74 vs W77  => (16-2) vs (16-5)
    '16-2':  { winnerTo: { match: '8-1', pos: 'home' } },
    '16-5':  { winnerTo: { match: '8-1', pos: 'away' } },

    // M90: W73 vs W75  => (16-1) vs (16-3)
    '16-1':  { winnerTo: { match: '8-2', pos: 'home' } },
    '16-3':  { winnerTo: { match: '8-2', pos: 'away' } },

    // M91: W76 vs W78  => (16-4) vs (16-6)
    '16-4':  { winnerTo: { match: '8-3', pos: 'home' } },
    '16-6':  { winnerTo: { match: '8-3', pos: 'away' } },

    // M92: W79 vs W80  => (16-7) vs (16-8)
    '16-7':  { winnerTo: { match: '8-4', pos: 'home' } },
    '16-8':  { winnerTo: { match: '8-4', pos: 'away' } },

    // M93: W83 vs W84  => (16-11) vs (16-12)
    '16-11': { winnerTo: { match: '8-5', pos: 'home' } },
    '16-12': { winnerTo: { match: '8-5', pos: 'away' } },

    // M94: W81 vs W82  => (16-9) vs (16-10)
    '16-9':  { winnerTo: { match: '8-6', pos: 'home' } },
    '16-10': { winnerTo: { match: '8-6', pos: 'away' } },

    // M95: W86 vs W88  => (16-14) vs (16-16)
    '16-14': { winnerTo: { match: '8-7', pos: 'home' } },
    '16-16': { winnerTo: { match: '8-7', pos: 'away' } },

    // M96: W85 vs W87  => (16-13) vs (16-15)
    '16-13': { winnerTo: { match: '8-8', pos: 'home' } },
    '16-15': { winnerTo: { match: '8-8', pos: 'away' } },

    // --- Round of 16 -> Quarter-finals (según Art. 12.8)
    // M97: W89 vs W90
    '8-1': { winnerTo: { match: '4-1', pos: 'home' } },
    '8-2': { winnerTo: { match: '4-1', pos: 'away' } },

    // M99: W91 vs W92
    '8-3': { winnerTo: { match: '4-2', pos: 'home' } },
    '8-4': { winnerTo: { match: '4-2', pos: 'away' } },

    // M98: W93 vs W94
    '8-5': { winnerTo: { match: '4-3', pos: 'home' } },
    '8-6': { winnerTo: { match: '4-3', pos: 'away' } },

    // M100: W95 vs W96
    '8-7': { winnerTo: { match: '4-4', pos: 'home' } },
    '8-8': { winnerTo: { match: '4-4', pos: 'away' } },

    // --- Quarter-finals -> Semi-finals (según Art. 12.9)
    // SF1 (M101): W97 vs W98
    '4-1': { winnerTo: { match: '2-1', pos: 'home' } },
    '4-3': { winnerTo: { match: '2-1', pos: 'away' } },

    // SF2 (M102): W99 vs W100
    '4-2': { winnerTo: { match: '2-2', pos: 'home' } },
    '4-4': { winnerTo: { match: '2-2', pos: 'away' } },

    // --- Semi-finals -> Final + 3rd place (según Art. 12.10)
    '2-1': { winnerTo: { match: '1-1', pos: 'home' }, loserTo: { match: '3-1', pos: 'home' } },
    '2-2': { winnerTo: { match: '1-1', pos: 'away' }, loserTo: { match: '3-1', pos: 'away' } },

    // --- Final -> Champion
    '1-1': { winnerTo: { match: 'champion', pos: null } },

    // --- 3rd place doesn't advance
    '3-1': {}
};


// --- INICIO DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    currentUserId = getUserIdFromUrl();

    if (!currentUserId) {
        // Si no hay ?user=... en la URL, mostramos un error.
        document.body.innerHTML = `<h1 style="text-align: center; margin-top: 50px; font-family: var(--font-main);">Error: Link inválido. Se requiere un identificador de usuario.</h1>`;
        return;
    }

    // Creamos una clave de almacenamiento única para este usuario.
    storageKey = `quinielaMundial2026_${currentUserId}`;

    // Preparamos los datos de los equipos
    groupsData.forEach(group => {
        group.codes.forEach((code, index) => {
            TEAMS_DATA[code] = { name: group.teams[index], flag: group.flags[index] };
        });
    });

    // Generamos el HTML base
    generateGroupsHTML();
    hideSplash(6000);
    generateBracketHTML();
    initializeEventListeners();

    // Cargamos el estado del usuario
    loadStateFromStorage();

    // Verificamos si el usuario ya tiene un nombre guardado
    const savedState = JSON.parse(localStorage.getItem(storageKey));
    if (savedState && savedState.userName) {
        document.getElementById('user-name-display').textContent = `Quiniela de: ${savedState.userName}`;
    } else {
        // Si no hay nombre, mostramos el modal para que lo ingrese.
        document.getElementById('name-modal').style.display = 'flex';
    }
});

// --- GENERACIÓN DE HTML ---
function generateGroupsHTML() {
    const container = document.getElementById('groups-container');
    container.innerHTML = groupsData.map(group => `
        <div class="group-card" id="group-${group.id}" data-group-id="${group.id}">
            <div class="group-header" style="background-image: linear-gradient(45deg, ${group.color1}, ${group.color2});">
                <span>GRUPO ${group.id}</span>
                <button class="reset-group-btn" title="Limpiar marcadores del grupo">&#x21bb;</button>
            </div>
            <div class="group-matches">
                ${[[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]].map(([i, j]) => {
        const team1 = group.codes[i], team2 = group.codes[j];
        return `
                    <div class="match-grid" data-team1="${team1}" data-team2="${team2}">
                        <span class="team-name local">
  ${TEAMS_DATA[team1].name}
  <span class="team-flag">${TEAMS_DATA[team1].flag}</span>
</span>

<input type="number" min="0" class="score-input">
<span class="match-separator">-</span>
<input type="number" min="0" class="score-input">

<span class="team-name visitor">
  <span class="team-flag">${TEAMS_DATA[team2].flag}</span>
  ${TEAMS_DATA[team2].name}
</span>
                    </div>`;
    }).join('')}
            </div>
            <table class="standings-table">
                <thead><tr><th>Eq</th><th>Pts</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th></tr></thead>
                <tbody>
                    ${group.codes.map(code => `<tr data-team-code="${code}"><td>${TEAMS_DATA[code].flag} ${code}</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `).join('');
}

function generateBracketHTML() {
    const container = document.getElementById('bracket-container');
    if (!container) return;

    // Nueva estructura: dos alas (izquierda y derecha) y una columna central para la final
    container.innerHTML = `
        <div class="bracket-wing left-wing">
            <div class="bracket-round r32">
                ${Array.from({ length: 8 }, (_, i) => `
                    <div class="match-container" data-match-id="16-${i + 1}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round r16">
                ${Array.from({ length: 4 }, (_, i) => `
                    <div class="match-container" data-match-id="8-${i + 1}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round r8">
                ${Array.from({ length: 2 }, (_, i) => `
                    <div class="match-container" data-match-id="4-${i + 1}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round sf">
                <div class="match-container" data-match-id="2-1">
                    <div class="team-pill placeholder" data-team-pos="home"></div>
                    <div class="team-pill placeholder" data-team-pos="away"></div>
                </div>
            </div>
        </div>

        <div class="bracket-center-final">
                <!-- ============================================ -->
        <!-- === ¡AQUÍ VA EL NUEVO ÍCONO DEL TROFEO! === -->
        <!-- ============================================ -->
        <div class="trophy-container">
            <img src="images/copa-mundial.png" alt="Copa del Mundo" class="trophy-image">
        </div>
        <!-- ============================================ -->
        <!-- ===          FIN DEL ÍCONO               === -->
        <!-- ============================================ -->
            <div class="final-match-wrapper">
                <h3 class="final-title">FINAL</h3>
                <div class="match-container" data-match-id="1-1">
                    <div class="team-pill placeholder" data-team-pos="home"></div>
                    <div class="team-pill placeholder" data-team-pos="away"></div>
                </div>
                <div class="champion-wrapper">
                    <h3 class="champion-title">¡CAMPEÓN!</h3>
                    <div class="team-pill placeholder champion-pill" data-match-id="champion"></div>
                </div>
            </div>
            <div class="third-place-match-wrapper">
                <h3 class="final-title">Tercer Lugar</h3>
                <div class="match-container" data-match-id="3-1">
                    <div class="team-pill placeholder" data-team-pos="home"></div>
                    <div class="team-pill placeholder" data-team-pos="away"></div>
                </div>
            </div>
        </div>

        <div class="bracket-wing right-wing">
            <div class="bracket-round r32">
                ${Array.from({ length: 8 }, (_, i) => `
                    <div class="match-container" data-match-id="16-${i + 9}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round r16">
                ${Array.from({ length: 4 }, (_, i) => `
                    <div class="match-container" data-match-id="8-${i + 5}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round r8">
                ${Array.from({ length: 2 }, (_, i) => `
                    <div class="match-container" data-match-id="4-${i + 3}">
                        <div class="team-pill placeholder" data-team-pos="home"></div>
                        <div class="team-pill placeholder" data-team-pos="away"></div>
                    </div>
                `).join('')}
            </div>
            <div class="bracket-round sf">
                <div class="match-container" data-match-id="2-2">
                    <div class="team-pill placeholder" data-team-pos="home"></div>
                    <div class="team-pill placeholder" data-team-pos="away"></div>
                </div>
            </div>
        </div>
    `;

    addScrollIndicatorToBracket();
}


function addScrollIndicatorToBracket() {
    const bracketContainer = document.getElementById('bracket-container');
    if (!bracketContainer) return;

    // Comprobar si ya existe un indicador para no duplicarlo
    if (bracketContainer.querySelector('.scroll-indicator')) {
        return;
    }

    // Crear el elemento del indicador
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '‹‹ Desliza para ver todas las rondas ››';

    // Añadirlo al contenedor del bracket
    bracketContainer.appendChild(indicator);

    // Ocultar el indicador una vez que el usuario empieza a deslizar
    bracketContainer.addEventListener('scroll', () => {
        indicator.style.opacity = '0';
        // Opcional: eliminarlo después de la transición para limpiar el DOM
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 500);
    }, { once: true }); // { once: true } hace que el evento se dispare solo una vez
}


// --- LÓGICA DE EVENTOS ---
function initializeEventListeners() {
    // ... (listener de la fase de grupos, sin cambios) ...
    document.getElementById('groups-container').addEventListener('input', (e) => {
        if (e.target.classList.contains('score-input')) {
            validateMatchInputs(e.target.closest('.match-grid'));
            updateAllCalculations();
        }
    });
    document.getElementById('groups-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('reset-group-btn')) {
            const card = e.target.closest('.group-card');
            card.querySelectorAll('.score-input').forEach(input => {
                input.value = '';
                input.classList.remove('input-invalid');
            });
            updateAllCalculations();
        }
    });

    // --- ¡NUEVO Y SIMPLIFICADO LISTENER PARA EL BRACKET! ---
    document.getElementById('bracket-container').addEventListener('input', (e) => {
        if (e.target.classList.contains('score')) {
            // Cuando se cambia un marcador, llamamos a la función que valida y avanza
            handleBracketScoreChange(e.target.closest('.match-container'));
        }
    });
    // ¡NUEVO LISTENER para el formulario de nombre!
    document.getElementById('name-form').addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue
        const userNameInput = document.getElementById('user-name-input');
        const userName = userNameInput.value.trim();

        if (userName) {
            document.getElementById('user-name-display').textContent = `Quiniela de: ${userName}`;

            // Guardamos el nombre junto con el resto de los datos
            const currentState = JSON.parse(localStorage.getItem(storageKey)) || {};
            currentState.userName = userName;
            localStorage.setItem(storageKey, JSON.stringify(currentState));

            document.getElementById('name-modal').style.display = 'none'; // Ocultamos el modal
        }
    });
}

function handleBracketScoreChange(matchContainer) {
    const [homeScoreInput, awayScoreInput] = matchContainer.querySelectorAll('.score');

    // Si ambos campos tienen un valor, procedemos a validar
    if (homeScoreInput.value !== '' && awayScoreInput.value !== '') {
        const homeScore = parseInt(homeScoreInput.value, 10);
        const awayScore = parseInt(awayScoreInput.value, 10);

        // Limpiamos cualquier resaltado de error previo
        homeScoreInput.classList.remove('tie-score');
        awayScoreInput.classList.remove('tie-score');

        if (homeScore === awayScore) {
            // ¡EMPATE! Marcamos los campos como inválidos y no hacemos nada más.
            homeScoreInput.classList.add('tie-score');
            awayScoreInput.classList.add('tie-score');
            // Detenemos el avance del ganador.
            return;
        } else {
            // El resultado es válido (no es empate), avanzamos al ganador.
            advanceWinner(matchContainer);
        }
    }
    // Guardamos el estado en cualquier cambio
    saveStateToStorage();
}


// --- VERSIÓN SIMPLIFICADA DE advanceWinner ---
function advanceWinner(matchContainer) {
    const [homePill, awayPill] = matchContainer.querySelectorAll('.team-pill');
    const homeCode = homePill.dataset.teamCode;
    const awayCode = awayPill.dataset.teamCode;

    const homeScore = parseInt(matchContainer.querySelector('[data-team-pos="home"] .score').value, 10);
    const awayScore = parseInt(matchContainer.querySelector('[data-team-pos="away"] .score').value, 10);

    // Esta condición ahora es simple: solo hay ganador si los marcadores son diferentes.
    let winnerCode, loserCode;
    if (homeScore > awayScore) {
        winnerCode = homeCode;
        loserCode = awayCode;
    } else { // No puede ser empate por la validación previa
        winnerCode = awayCode;
        loserCode = homeCode;
    }

    homePill.classList.toggle('loser', winnerCode === awayCode);
    awayPill.classList.toggle('loser', winnerCode === homeCode);

    const destination = BRACKET_MAP[matchContainer.dataset.matchId];
    if (destination?.winnerTo) {
        updateNextMatch(destination.winnerTo.match, destination.winnerTo.pos, winnerCode);
    }
    if (destination?.loserTo) {
        updateNextMatch(destination.loserTo.match, destination.loserTo.pos, loserCode);
    }
}

// --- LÓGICA DE CÁLCULO Y ACTUALIZACIÓN ---
function updateAllCalculations() {
    // Recalcular standings de cada grupo
    const finishedGroups = new Set();
    groupsData.forEach(group => {
        const isFinished = updateGroupStandings(document.getElementById(`group-${group.id}`));
        if (isFinished) finishedGroups.add(group.id);
    });

    // Calcular clasificados (soporta avance parcial)
    const qualified = getQualifiedTeams({ finishedGroups });

    // Actualizar tabla de terceros SIEMPRE (muestra provisional si faltan grupos)
    updateThirdPlaceTable(qualified);

    // Poblar bracket con lo que ya se pueda (y placeholders donde falte)
    populateBracketFIFA(qualified);

    // Estadísticas globales
    updateGlobalStats();

    saveStateToStorage();
}

function updateGroupStandings(groupCard) {
    const stats = getGroupStats(groupCard);
    const sortedCodes = sortTeamsInGroup(stats);
    const tableBody = groupCard.querySelector('tbody');
    let isFinished = true;
    sortedCodes.forEach((code, index) => {
        const row = tableBody.querySelector(`tr[data-team-code="${code}"]`);
        const s = stats[code];
        row.innerHTML = `<td>${TEAMS_DATA[code].flag} ${code}</td><td>${s.Pts}</td><td>${s.PJ}</td><td>${s.G}</td><td>${s.E}</td><td>${s.P}</td><td>${s.GF}</td><td>${s.GC}</td>`;
        row.className = '';
        if (index < 2) row.classList.add(index === 0 ? 'pos-first' : 'pos-second');
        if (s.PJ < 3) isFinished = false;
    });
    sortedCodes.forEach(code => tableBody.appendChild(tableBody.querySelector(`tr[data-team-code="${code}"]`)));
    return isFinished;
}

function updateThirdPlaceTable(qualified) {
    const tableBody = document.getElementById('third-place-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Nota: el ranking de terceros solo es definitivo cuando terminaron los 12 grupos.
    qualified.thirdPlaceData.forEach((team, index) => {
        const diff = team.GF - team.GC;
        const row = document.createElement('tr');

        // Marcamos en verde a los 8 mejores terceros (provisional si aún faltan grupos)
        row.className = index < 8 ? 'qualified' : 'not-qualified';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${TEAMS_DATA[team.code]?.flag ?? '🏳️'} ${TEAMS_DATA[team.code]?.name ?? team.code}</td>
            <td>${team.Pts}</td>
            <td>${team.PJ}</td>
            <td>${team.GF}</td>
            <td>${team.GC}</td>
            <td>${diff > 0 ? '+' : ''}${diff}</td>
        `;
        tableBody.appendChild(row);
    });
}


// (advanceWinner duplicado eliminado: se usa la versión validada de arriba)


function updateNextMatch(nextMatchId, position, teamCode) {
    const nextMatchEl = document.querySelector(`[data-match-id="${nextMatchId}"]`);
    if (!nextMatchEl) return;

    // --- Lógica para el CAMPEÓN (se muestra completo) ---
    if (nextMatchId === 'champion') {
        nextMatchEl.classList.remove('placeholder');
        // Mostramos bandera y nombre completo
        nextMatchEl.innerHTML = `<span class="flag">${TEAMS_DATA[teamCode].flag}</span><span class="code">${TEAMS_DATA[teamCode].name}</span>`;
        return;
    }

    const targetPill = nextMatchEl.querySelector(`.team-pill[data-team-pos="${position}"]`);
    if (targetPill) {
        targetPill.classList.remove('placeholder');
        targetPill.dataset.teamCode = teamCode;
        // ¡CAMBIO CLAVE! Mostramos solo la bandera y el nombre completo. El score se añadirá después.
        targetPill.innerHTML = `<span class="flag">${TEAMS_DATA[teamCode].flag}</span><span class="code">${TEAMS_DATA[teamCode].name}</span>`;
    }

    // --- Lógica para añadir los inputs de score ---
    // Verificamos si ambos equipos del partido ya están definidos.
    const homePill = nextMatchEl.querySelector('.team-pill[data-team-pos="home"]');
    const awayPill = nextMatchEl.querySelector('.team-pill[data-team-pos="away"]');

    // Si ambos oponentes están listos, añadimos los campos de marcador a las dos píldoras.
    if (homePill && !homePill.classList.contains('placeholder') && awayPill && !awayPill.classList.contains('placeholder')) {
        if (!homePill.querySelector('.score')) {
            homePill.innerHTML += `<input type="number" min="0" class="score">`;
        }
        if (!awayPill.querySelector('.score')) {
            awayPill.innerHTML += `<input type="number" min="0" class="score">`;
        }
    }
}

// --- FUNCIONES AUXILIARES ---
function getGroupStats(groupCard) {
    const stats = {};
    groupCard.querySelectorAll('tbody tr').forEach(row => {
        stats[row.dataset.teamCode] = { Pts: 0, PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0 };
    });
    groupCard.querySelectorAll('.match-grid').forEach(match => {
        const [score1Str, score2Str] = Array.from(match.querySelectorAll('.score-input')).map(i => i.value);
        if (score1Str === '' || score2Str === '') return;
        const score1 = parseInt(score1Str, 10), score2 = parseInt(score2Str, 10);
        const team1 = match.dataset.team1, team2 = match.dataset.team2;
        stats[team1].PJ++; stats[team2].PJ++;
        stats[team1].GF += score1; stats[team2].GF += score2;
        stats[team1].GC += score2; stats[team2].GC += score1;
        if (score1 > score2) { stats[team1].Pts += 3; stats[team1].G++; stats[team2].P++; }
        else if (score2 > score1) { stats[team2].Pts += 3; stats[team2].G++; stats[team1].P++; }
        else { stats[team1].Pts++; stats[team2].Pts++; stats[team1].E++; stats[team2].E++; }
    });
    return stats;
}

function sortTeamsInGroup(stats) {
    return Object.keys(stats).sort((a, b) => {
        if (stats[b].Pts !== stats[a].Pts) return stats[b].Pts - stats[a].Pts;
        const diffB = stats[b].GF - stats[b].GC, diffA = stats[a].GF - stats[a].GC;
        if (diffB !== diffA) return diffB - diffA;
        if (stats[b].GF !== stats[a].GF) return stats[b].GF - stats[a].GF;
        return 0;
    });
}

function getQualifiedTeams({ finishedGroups } = {}) {
    const qualified = { first: {}, second: {}, thirdByGroup: {}, finishedGroups: finishedGroups ?? new Set() };
    const thirdPlaceData = [];

    groupsData.forEach(group => {
        const groupCard = document.getElementById(`group-${group.id}`);
        const stats = getGroupStats(groupCard);
        const sortedCodes = sortTeamsInGroup(stats);

        const groupFinished = sortedCodes.length === 4 && stats[sortedCodes[0]].PJ === 3;
        if (groupFinished) {
            qualified.first[group.id] = sortedCodes[0];
            qualified.second[group.id] = sortedCodes[1];
            qualified.thirdByGroup[group.id] = sortedCodes[2];
            thirdPlaceData.push({ code: sortedCodes[2], group: group.id, ...stats[sortedCodes[2]] });
        }
    });

    // Ranking de terceros (provisional si no han terminado todos los grupos)
    thirdPlaceData.sort((a, b) => {
        if (b.Pts !== a.Pts) return b.Pts - a.Pts;
        const diffB = b.GF - b.GC, diffA = a.GF - a.GC;
        if (diffB !== diffA) return diffB - diffA;
        return b.GF - a.GF;
    });

    qualified.thirds = thirdPlaceData.slice(0, 8).map(t => t.code);
    qualified.thirdGroups = thirdPlaceData.slice(0, 8).map(t => t.group);
    qualified.thirdPlaceData = thirdPlaceData;

    // true cuando ya tenemos 12 terceros (terminaron los 12 grupos)
    qualified.allGroupsFinished = thirdPlaceData.length === 12;

    return qualified;
}


function populateBracketFIFA(qualified) {
    // Siempre limpiamos todo el bracket (para que recalcular no deje basura)
    clearBracket();

    // --------------------------------------------------
    // 1) Sembrado oficial Round of 32 (Art. 12.6)
    // --------------------------------------------------

    // Helper: set a real team
    const setTeam = (matchId, pos, code) => {
        if (!code) return;
        updateNextMatch(matchId, pos, code);
    };

    // Helper: set a placeholder "Mejor 3º ..." (si aún no se puede resolver)
    const setThirdPlaceholder = (matchId, pos, label) => {
        const pseudoCode = `TBD_${label}`;
        if (!TEAMS_DATA[pseudoCode]) {
            TEAMS_DATA[pseudoCode] = { name: `Mejor 3º (${label})`, flag: '⏳' };
        }
        updateNextMatch(matchId, pos, pseudoCode);
    };

    // --- Matches fijos (runner-up / winner)
    // (16-1)  M73: 2A vs 2B
    setTeam('16-1', 'home', qualified.second['A']);
    setTeam('16-1', 'away', qualified.second['B']);

    // (16-3)  M75: 1F vs 2C
    setTeam('16-3', 'home', qualified.first['F']);
    setTeam('16-3', 'away', qualified.second['C']);

    // (16-4)  M76: 1C vs 2F
    setTeam('16-4', 'home', qualified.first['C']);
    setTeam('16-4', 'away', qualified.second['F']);

    // (16-6)  M78: 2E vs 2I
    setTeam('16-6', 'home', qualified.second['E']);
    setTeam('16-6', 'away', qualified.second['I']);

    // (16-11) M83: 2K vs 2L
    setTeam('16-11', 'home', qualified.second['K']);
    setTeam('16-11', 'away', qualified.second['L']);

    // (16-12) M84: 1H vs 2J
    setTeam('16-12', 'home', qualified.first['H']);
    setTeam('16-12', 'away', qualified.second['J']);

    // (16-14) M86: 1J vs 2H
    setTeam('16-14', 'home', qualified.first['J']);
    setTeam('16-14', 'away', qualified.second['H']);

    // (16-16) M88: 2D vs 2G
    setTeam('16-16', 'home', qualified.second['D']);
    setTeam('16-16', 'away', qualified.second['G']);

    // --- Matches que dependen de los 8 mejores terceros (Art. 12.6 + Annexe C)
    // Si todavía no se puede resolver (porque faltan grupos o no está la tabla de Annexe C), mostramos placeholder.

    // (16-2)  M74: 1E vs (mejor 3º de ABCDF)
    setTeam('16-2', 'home', qualified.first['E']);
    setThirdPlaceholder('16-2', 'away', 'ABCDF');

    // (16-5)  M77: 1I vs (mejor 3º de CDFGH)
    setTeam('16-5', 'home', qualified.first['I']);
    setThirdPlaceholder('16-5', 'away', 'CDFGH');

    // (16-7)  M79: 1A vs (mejor 3º de CEFHI)
    setTeam('16-7', 'home', qualified.first['A']);
    setThirdPlaceholder('16-7', 'away', 'CEFHI');

    // (16-8)  M80: 1L vs (mejor 3º de EHIJK)
    setTeam('16-8', 'home', qualified.first['L']);
    setThirdPlaceholder('16-8', 'away', 'EHIJK');

    // (16-9)  M81: 1D vs (mejor 3º de BEFIJ)
    setTeam('16-9', 'home', qualified.first['D']);
    setThirdPlaceholder('16-9', 'away', 'BEFIJ');

    // (16-10) M82: 1G vs (mejor 3º de AEHIJ)
    setTeam('16-10', 'home', qualified.first['G']);
    setThirdPlaceholder('16-10', 'away', 'AEHIJ');

    // (16-13) M85: 1B vs (mejor 3º de EFGIJ)
    setTeam('16-13', 'home', qualified.first['B']);
    setThirdPlaceholder('16-13', 'away', 'EFGIJ');

    // (16-15) M87: 1K vs (mejor 3º de DEIJL)
    setTeam('16-15', 'home', qualified.first['K']);
    setThirdPlaceholder('16-15', 'away', 'DEIJL');

    // --------------------------------------------------
    // 2) Intentar resolver placeholders usando Annexe C
    // --------------------------------------------------
    // Si tienes el mapeo completo (495 combinaciones), aquí es donde se asignan los terceros reales.
    // Ver función resolveThirdOpponentsFromAnnexC().
    resolveThirdOpponentsFromAnnexC(qualified);
}

// --- Tabla Annexe C (FIFA) ---
// IMPORTANTE:
//  - Annexe C tiene 495 combinaciones. Cada combinación depende de QUÉ 8 grupos aportan un 3er lugar que clasifica.
//  - Si quieres que el sistema sea 100% oficial, necesitas cargar ese mapeo aquí.
//  - Estructura esperada: clave = string con 8 letras ordenadas (ej: 'CEFGHIJK')
//    valor = { A:'E', B:'J', D:'I', E:'F', G:'H', I:'G', K:'L', L:'K' }  // indica qué grupo (3E, 3J...) enfrenta a 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
const ANNEX_C_MAP = {
    // EJEMPLO (NO COMPLETO): cuando los terceros clasificados vienen de E,F,G,H,I,J,K,L
    // key: 'EFGHIJKL'
    // (Ejemplo tomado del reglamento, Option 1)
    'EFGHIJKL': { A: 'E', B: 'J', D: 'I', E: 'F', G: 'H', I: 'G', K: 'L', L: 'K' }
};

function resolveThirdOpponentsFromAnnexC(qualified) {
    // Solo cuando terminó la fase de grupos completa.
    if (!qualified.allGroupsFinished) return;

    // Necesitamos que ya existan los 8 grupos que aportan tercero clasificado.
    const thirdGroups = (qualified.thirdGroups || []).slice().sort().join('');
    if (thirdGroups.length !== 8) return;

    const mapping = ANNEX_C_MAP[thirdGroups];
    if (!mapping) {
        // No hay mapping cargado: nos quedamos con placeholders.
        console.warn('[Annexe C] Falta el mapping para la combinación:', thirdGroups);
        return;
    }

    // Para cada ganador de grupo que enfrenta a un tercero, reemplazamos el placeholder por el tercero real.
    const thirdTeam = (groupLetter) => qualified.thirdByGroup[groupLetter];

    // 1A vs 3?
    if (mapping.A) updateNextMatch('16-7', 'away', thirdTeam(mapping.A));
    // 1B vs 3?
    if (mapping.B) updateNextMatch('16-13', 'away', thirdTeam(mapping.B));
    // 1D vs 3?
    if (mapping.D) updateNextMatch('16-9', 'away', thirdTeam(mapping.D));
    // 1E vs 3?
    if (mapping.E) updateNextMatch('16-2', 'away', thirdTeam(mapping.E));
    // 1G vs 3?
    if (mapping.G) updateNextMatch('16-10', 'away', thirdTeam(mapping.G));
    // 1I vs 3?
    if (mapping.I) updateNextMatch('16-5', 'away', thirdTeam(mapping.I));
    // 1K vs 3?
    if (mapping.K) updateNextMatch('16-15', 'away', thirdTeam(mapping.K));
    // 1L vs 3?
    if (mapping.L) updateNextMatch('16-8', 'away', thirdTeam(mapping.L));
}

// --- Compat: mantenemos el nombre antiguo por si lo llamaba alguna parte ---
function populateBracket(qualified) {
    return populateBracketFIFA(qualified);
}


function clearBracket() {
    document.querySelectorAll('.bracket-container-topdown .match-container').forEach(match => {
        // Limpiar estados visuales
        match.querySelectorAll('.team-pill').forEach(pill => {
            pill.classList.remove('loser');
            if (!pill.classList.contains('placeholder')) {
                pill.classList.add('placeholder');
                pill.innerHTML = '';
                delete pill.dataset.teamCode;
            } else {
                pill.innerHTML = '';
                delete pill.dataset.teamCode;
            }
            const scoreInput = pill.querySelector('.score');
            if (scoreInput) scoreInput.remove();
        });
    });

    // Limpiar campeón
    const champ = document.querySelector('[data-match-id="champion"]');
    if (champ) {
        champ.classList.add('placeholder');
        champ.innerHTML = '';
        delete champ.dataset.teamCode;
    }
}


function validateMatchInputs(matchRow) {
    const [input1, input2] = matchRow.querySelectorAll('.score-input');
    input1.classList.toggle('input-invalid', input1.value === '' && input2.value !== '');
    input2.classList.toggle('input-invalid', input1.value !== '' && input2.value === '');
}

// --- LÓGICA DE ALMACENAMIENTO ---
function saveStateToStorage() {
    // Si estamos en medio de la carga inicial, no guardamos nada para evitar sobrescribir.
    if (isLoading) return;

    // Obtenemos el estado actual para no perder el nombre de usuario.
    const currentState = JSON.parse(localStorage.getItem(storageKey)) || {};

    // Creamos el objeto que contendrá toda la información a guardar.
    const newState = {
        userName: currentState.userName, // Mantenemos el nombre de usuario existente.
        groups: {},
        bracket: {}
    };

    // 1. Guardar marcadores de la fase de grupos
    document.querySelectorAll('.group-card').forEach(card => {
        const groupId = card.dataset.groupId;
        newState.groups[groupId] = {};
        card.querySelectorAll('.match-grid').forEach(match => {
            const matchKey = `${match.dataset.team1}-${match.dataset.team2}`;
            const scores = Array.from(match.querySelectorAll('.score-input')).map(i => i.value);
            // Guardamos solo si hay datos para no llenar el storage de vacíos
            if (scores[0] !== '' || scores[1] !== '') {
                newState.groups[groupId][matchKey] = scores;
            }
        });
    });

    // 2. Guardar marcadores de la fase eliminatoria (bracket)
    document.querySelectorAll('.bracket-container-topdown .match-container').forEach(match => {
        const matchId = match.dataset.matchId;
        const scoreInputs = match.querySelectorAll('.score');

        // Solo procedemos si el partido tiene inputs de marcador
        if (scoreInputs.length === 2) {
            const scores = [scoreInputs[0].value, scoreInputs[1].value];
            if (scores[0] !== '' || scores[1] !== '') {
                newState.bracket[matchId] = scores;
            }
        }
    });

    // 3. Guardar el objeto completo en localStorage usando la clave ÚNICA del usuario.
    localStorage.setItem(storageKey, JSON.stringify(newState));
}

function loadStateFromStorage() {
    isLoading = true; // --- Activamos la bandera de carga ---

    const savedState = JSON.parse(localStorage.getItem(storageKey));

    // Cargar marcadores de grupos
    if (savedState && savedState.groups) {
        document.querySelectorAll('.group-card').forEach(card => {
            const groupId = card.dataset.groupId;
            if (savedState.groups[groupId]) {
                card.querySelectorAll('.match-grid').forEach(match => {
                    const matchKey = `${match.dataset.team1}-${match.dataset.team2}`;
                    if (savedState.groups[groupId][matchKey]) {
                        const [score1, score2] = savedState.groups[groupId][matchKey];
                        const inputs = match.querySelectorAll('.score-input');
                        inputs[0].value = score1;
                        inputs[1].value = score2;
                    }
                });
            }
        });
    }

    // Recalcula grupos y puebla el bracket con los equipos iniciales
    updateAllCalculations();

    // Cargar marcadores del bracket
    if (savedState && savedState.bracket) {
        const roundOrder = ['16-', '8-', '4-', '2-', '3-', '1-'];
        roundOrder.forEach(prefix => {
            Object.keys(savedState.bracket).forEach(matchId => {
                if (matchId.startsWith(prefix)) {
                    const matchEl = document.querySelector(`.match-container[data-match-id="${matchId}"]`);
                    if (matchEl) {
                        const scores = savedState.bracket[matchId];
                        const inputs = matchEl.querySelectorAll('.score');

                        // Asegurarse de que los inputs existan antes de asignarles valor
                        if (inputs.length === 2 && scores && scores.length === 2) {
                            inputs[0].value = scores[0];
                            inputs[1].value = scores[1];

                            // Una vez puestos los marcadores, validamos y avanzamos
                            const homeScore = parseInt(scores[0], 10);
                            const awayScore = parseInt(scores[1], 10);

                            if (!isNaN(homeScore) && !isNaN(awayScore) && homeScore !== awayScore) {
                                // Si hay un resultado válido, avanzamos al ganador.
                                // Llamamos a advanceWinner directamente para evitar bucles.
                                advanceWinner(matchEl);
                            } else if (!isNaN(homeScore) && !isNaN(awayScore) && homeScore === awayScore) {
                                // Si es un empate, solo marcamos el error visualmente.
                                inputs[0].classList.add('tie-score');
                                inputs[1].classList.add('tie-score');
                            }
                        }
                    }
                }
            });
        });
    }

    isLoading = false; // --- Desactivamos la bandera de carga al finalizar ---
}

// ==================================================
// === LÓGICA PARA ESTADÍSTICAS GLOBALES ===
// ==================================================

function getAllMatchesData() {
    const allMatches = [];
    // Recopilar partidos de fase de grupos
    document.querySelectorAll('.group-card .match-grid').forEach(matchEl => {
        const [score1Input, score2Input] = matchEl.querySelectorAll('.score-input');
        if (score1Input.value !== '' && score2Input.value !== '') {
            allMatches.push({
                team1: matchEl.dataset.team1,
                team2: matchEl.dataset.team2,
                score1: parseInt(score1Input.value, 10),
                score2: parseInt(score2Input.value, 10),
            });
        }
    });
    // Recopilar partidos de fase eliminatoria
    document.querySelectorAll('.bracket-container-topdown .match-container').forEach(matchEl => {
        const [score1Input, score2Input] = matchEl.querySelectorAll('.score');
        const homePill = matchEl.querySelector('[data-team-pos="home"]');
        const awayPill = matchEl.querySelector('[data-team-pos="away"]');
        if (score1Input && score2Input && score1Input.value !== '' && score2Input.value !== '' && homePill.dataset.teamCode && awayPill.dataset.teamCode) {
            allMatches.push({
                team1: homePill.dataset.teamCode,
                team2: awayPill.dataset.teamCode,
                score1: parseInt(score1Input.value, 10),
                score2: parseInt(score2Input.value, 10),
            });
        }
    });
    return allMatches;
}

function updateGlobalStats() {
    const allMatches = getAllMatchesData();
    const teamStats = {};

    // Inicializar estadísticas para todos los equipos
    Object.keys(TEAMS_DATA).forEach(code => {
        teamStats[code] = { GF: 0, GC: 0 };
    });

    // Calcular GF y GC para cada equipo
    allMatches.forEach(match => {
        teamStats[match.team1].GF += match.score1;
        teamStats[match.team1].GC += match.score2;
        teamStats[match.team2].GF += match.score2;
        teamStats[match.team2].GC += match.score1;
    });

    // 1. Máximos Goleadores
    const sortedByGF = Object.entries(teamStats).sort(([, a], [, b]) => b.GF - a.GF);
    const topScorersBody = document.getElementById('stats-top-scorers');
    topScorersBody.innerHTML = sortedByGF.slice(0, 5).map(([code, stats]) => `
        <tr>
            <td class="team-info">${TEAMS_DATA[code].flag} ${TEAMS_DATA[code].name}</td>
            <td class="stat-value">${stats.GF}</td>
        </tr>
    `).join('');

    // 2. Mejores Defensas (menos goles recibidos)
    const sortedByGC = Object.entries(teamStats).sort(([, a], [, b]) => a.GC - b.GC);
    const bestDefenseBody = document.getElementById('stats-best-defense');
    bestDefenseBody.innerHTML = sortedByGC.slice(0, 5).map(([code, stats]) => `
        <tr>
            <td class="team-info">${TEAMS_DATA[code].flag} ${TEAMS_DATA[code].name}</td>
            <td class="stat-value">${stats.GC}</td>
        </tr>
    `).join('');

    // 3. Partidos con más goles
    allMatches.sort((a, b) => (b.score1 + b.score2) - (a.score1 + a.score2));
    const topMatchesBody = document.getElementById('stats-top-matches');
    topMatchesBody.innerHTML = allMatches.slice(0, 5).map(match => `
        <tr>
            <td>
                <div class="team-info">${TEAMS_DATA[match.team1].flag} ${match.team1} ${match.score1} - ${match.score2} ${match.team2} ${TEAMS_DATA[match.team2].flag}</div>
                <div class="match-details">${TEAMS_DATA[match.team1].name} vs ${TEAMS_DATA[match.team2].name}</div>
            </td>
            <td class="stat-value">${match.score1 + match.score2}</td>
        </tr>
    `).join('');
}

function hideSplash(durationMs = 6000){
  const splash = document.getElementById('splash');
  if(!splash) return;

  // Asegura que se pinte el splash primero
  requestAnimationFrame(() => {
    setTimeout(() => {
      splash.classList.add('is-hidden');
      // Remover del DOM después del fade (0.35s aprox + margen)
      setTimeout(() => splash.remove(), 800);
    }, durationMs);
  });
}