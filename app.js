// lostark_performance_comparator/app.js

// Global State
let lostArkDatabase = [];
let slots = [];
let nextSlotId = 1;
let globalAverages = {};
let cachedCpHash = null;

// Global Query State
let currentBoss = "Corvus Tul Rak";
let currentDifficulty = "Nightmare";
let currentPatch = "jun26";
let currentMetric = "udps";

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
});

function updateApiStatus(success, errorDetail = "") {
    const successBanner = document.getElementById('api-success-banner');
    const statusBanner = document.getElementById('api-status-banner');
    const errorDetailEl = document.getElementById('api-error-detail');
    
    if (success) {
        if (successBanner) successBanner.style.display = 'flex';
        if (statusBanner) statusBanner.style.display = 'none';
    } else {
        if (successBanner) successBanner.style.display = 'none';
        if (statusBanner) statusBanner.style.display = 'flex';
        if (errorDetailEl) errorDetailEl.textContent = errorDetail;
    }
}

async function loadDatabase() {
    const overlay = document.getElementById('db-loading-overlay');
    const loadingTextEl = overlay ? overlay.querySelector('.loading-text') : null;
    
    if (loadingTextEl) {
        loadingTextEl.textContent = "로스트아크 실시간 전투력 지표를 API에서 불러오고 있습니다...";
    }
    
    try {
        lostArkDatabase = await scrapeLiveStats(loadingTextEl);
        console.log("Database loaded in real-time from API. Records:", lostArkDatabase.length);
        updateApiStatus(true);
    } catch (e) {
        console.error("Failed to load live database from API, using local fallback database.js:", e);
        updateApiStatus(false, e.message);
        if (typeof fallbackDatabase !== 'undefined') {
            lostArkDatabase = JSON.parse(JSON.stringify(fallbackDatabase));
        } else {
            lostArkDatabase = [];
        }
    }
    
    // Hide overlay
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
    
    // 1. Calculate overall averages of class specs
    calculateGlobalAverages();
    
    // Append virtual global average item to database for "All All All" comparison target selection
    lostArkDatabase.push({
        type: 'global_avg',
        class_eng: 'All',
        class_kor: '전체',
        spec_eng: 'Overall Average',
        spec_kor: '전체 평균',
        values: globalAverages
    });
    
    // 2. Set up initial 2 slots
    addSlot();
    addSlot();
    
    // 3. Set up event listeners
    setupEventListeners();
}

// Calculate Overall Class Spec Averages
function calculateGlobalAverages() {
    // We average only type: 'spec' entries (base class engravings) to find game-wide base benchmarks
    const specs = lostArkDatabase.filter(item => item.type === 'spec');
    const count = specs.length;
    
    if (count === 0) {
        globalAverages = { ndps: 0, dps: 0, rdps: 0, udps: 0 };
        return;
    }
    
    globalAverages = {
        ndps: specs.reduce((sum, item) => sum + item.values.ndps, 0) / count,
        dps: specs.reduce((sum, item) => sum + item.values.dps, 0) / count,
        rdps: specs.reduce((sum, item) => sum + item.values.rdps, 0) / count,
        udps: specs.reduce((sum, item) => sum + item.values.udps, 0) / count
    };
}

// Resolve the final dbIndex from Class and Engraving selections
function updateSlotTarget(slot) {
    if (slot.classVal === 'all') {
        const target = lostArkDatabase.find(item => item.type === 'global_avg');
        if (target) {
            slot.dbIndex = lostArkDatabase.indexOf(target);
        } else {
            slot.dbIndex = null;
        }
    } else {
        const target = lostArkDatabase.find(item => item.type === 'spec' && item.class_kor === slot.classVal && item.spec_kor === slot.specVal);
        if (target) {
            slot.dbIndex = lostArkDatabase.indexOf(target);
        } else {
            slot.dbIndex = null;
        }
    }
    updateSlotDisplay(slot);
}

// Add a new comparison slot
function addSlot() {
    if (slots.length >= 4) return;
    
    const id = nextSlotId++;
    const slot = { id, classVal: 'all', specVal: 'all', dbIndex: null };
    slots.push(slot);
    
    const container = document.getElementById('slots-container');
    if (!container) return;
    
    const card = document.createElement('div');
    card.className = 'slot-card';
    card.id = `slot-card-${id}`;
    
    card.innerHTML = `
        <div class="slot-title-bar">
            <span class="slot-number" id="slot-number-${id}">대상 ${slots.length}</span>
            <button class="btn btn-danger btn-delete-slot" id="btn-delete-${id}">삭제</button>
        </div>
        <div class="slot-filters-stack">
            <div class="slot-filter-field">
                <label for="slot-class-${id}">직업 (Class)</label>
                <select id="slot-class-${id}">
                    <!-- Filled dynamically -->
                </select>
            </div>
            <div class="slot-filter-field">
                <label for="slot-spec-${id}">직업 각인 (Engraving)</label>
                <select id="slot-spec-${id}">
                    <option value="all">전체 (All)</option>
                </select>
            </div>
        </div>
        <div class="slot-selection-info" id="slot-info-${id}">
            선택된 대상이 없습니다.
        </div>
    `;
    
    container.appendChild(card);
    
    const classSelect = card.querySelector(`#slot-class-${id}`);
    const specSelect = card.querySelector(`#slot-spec-${id}`);
    const deleteBtn = card.querySelector(`#btn-delete-${id}`);
    
    deleteBtn.addEventListener('click', () => deleteSlot(id));
    
    // Populate Class select (excluding the virtual '전체' average item)
    const classes = [...new Set(lostArkDatabase.filter(item => item.class_kor !== '전체').map(item => item.class_kor))].sort();
    classSelect.innerHTML = '<option value="all">전체 (All)</option>';
    classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        classSelect.appendChild(opt);
    });
    
    // Class change handler
    classSelect.addEventListener('change', (e) => {
        slot.classVal = e.target.value;
        if (slot.classVal === 'all') {
            slot.specVal = 'all';
            specSelect.innerHTML = '<option value="all">전체 (All)</option>';
            updateSlotTarget(slot);
        } else {
            // Populate specs and default to first
            const specs = [...new Set(lostArkDatabase.filter(item => item.type === 'spec' && item.class_kor === slot.classVal).map(item => item.spec_kor))].sort();
            specSelect.innerHTML = '';
            specs.forEach(sp => {
                const opt = document.createElement('option');
                opt.value = sp;
                opt.textContent = sp;
                specSelect.appendChild(opt);
            });
            slot.specVal = specs[0];
            specSelect.value = slot.specVal;
            
            updateSlotTarget(slot);
        }
    });
    
    // Spec change handler
    specSelect.addEventListener('change', (e) => {
        slot.specVal = e.target.value;
        updateSlotTarget(slot);
    });
    
    updateAddButtonState();
    updateDeleteButtonsState();
    updateSlotTitles();
    updateSlotTarget(slot);
}

// Delete a slot
function deleteSlot(id) {
    if (slots.length <= 2) return;
    
    slots = slots.filter(s => s.id !== id);
    const card = document.getElementById(`slot-card-${id}`);
    if (card) card.remove();
    
    updateAddButtonState();
    updateDeleteButtonsState();
    updateSlotTitles();
}

// Update slot display labels (e.g. 대상 1, 대상 2) sequentially
function updateSlotTitles() {
    slots.forEach((slot, index) => {
        const titleEl = document.getElementById(`slot-number-${slot.id}`);
        if (titleEl) {
            titleEl.textContent = `대상 ${index + 1}`;
        }
    });
}

// Update add button enabled/disabled state
function updateAddButtonState() {
    const btnAdd = document.getElementById('btn-add-slot');
    if (!btnAdd) return;
    
    if (slots.length >= 4) {
        btnAdd.disabled = true;
        btnAdd.style.opacity = '0.5';
        btnAdd.style.cursor = 'not-allowed';
    } else {
        btnAdd.disabled = false;
        btnAdd.style.opacity = '1';
        btnAdd.style.cursor = 'pointer';
    }
}

// Hide delete buttons when only 2 slots are present
function updateDeleteButtonsState() {
    slots.forEach(slot => {
        const btnDelete = document.getElementById(`btn-delete-${slot.id}`);
        if (btnDelete) {
            if (slots.length <= 2) {
                btnDelete.style.display = 'none';
            } else {
                btnDelete.style.display = 'block';
            }
        }
    });
}

// Update slot information panel (spec name, class, individual metrics)
function updateSlotDisplay(slot) {
    const infoEl = document.getElementById(`slot-info-${slot.id}`);
    if (!infoEl) return;
    
    if (slot.dbIndex === null || isNaN(slot.dbIndex) || slot.dbIndex === -1) {
        infoEl.innerHTML = '<span style="color: var(--text-muted)">비교 대상이 불완전하거나 선택되지 않았습니다.</span>';
        return;
    }
    
    const data = lostArkDatabase[slot.dbIndex];
    if (!data) {
        infoEl.innerHTML = '<span style="color: var(--accent-red)">데이터 오류</span>';
        return;
    }
    
    const prefix = data.type === 'spec' ? '직업각인' : (data.type === 'global_avg' ? '전체평균' : '아크그리드');
    infoEl.innerHTML = `
        <strong>${data.class_kor}</strong> (${prefix})<br>
        <span style="color: var(--text-muted)">세팅:</span> ${data.spec_kor}<br>
        <span style="color: var(--text-muted)">지표 (n/DPS/r/u):</span> 
        <span style="font-family: var(--font-heading); font-weight: 600;">
            ${formatNumber(data.values.ndps)} / ${formatNumber(data.values.dps)} / ${formatNumber(data.values.rdps)} / ${formatNumber(data.values.udps)}
        </span>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Add slot button
    document.getElementById('btn-add-slot').addEventListener('click', addSlot);
    
    // View Results (Setup page -> Results page)
    document.getElementById('btn-view-results').addEventListener('click', () => {
        const activeTargets = getActiveTargets();
        if (activeTargets.length < 2) {
            alert('비교할 대상을 2개 이상 선택해 주세요.');
            return;
        }
        
        // Switch Views
        document.getElementById('view-setup').style.display = 'none';
        document.getElementById('view-results').style.display = 'block';
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Calculate and Render Results
        calculateAndRender();
    });
    
    // Back to Setup (Results page -> Setup page)
    document.getElementById('btn-back-to-setup').addEventListener('click', () => {
        document.getElementById('view-results').style.display = 'none';
        document.getElementById('view-setup').style.display = 'block';
        window.scrollTo(0, 0);
    });

    // Initialize Global Settings Selects
    const bossSelect = document.getElementById('global-boss-select');
    const diffSelect = document.getElementById('global-difficulty-select');
    const patchSelect = document.getElementById('global-patch-select');
    const metricSelect = document.getElementById('global-metric-select');
    
    if (bossSelect && diffSelect && patchSelect && metricSelect) {
        // 1. Populate Boss Options
        bossSelect.innerHTML = "";
        RAID_METADATA.forEach(raid => {
            const group = document.createElement('optgroup');
            group.label = raid.name;
            raid.bosses.forEach(boss => {
                const opt = document.createElement('option');
                opt.value = boss.apiName;
                opt.textContent = boss.displayName;
                if (boss.apiName === currentBoss) {
                    opt.selected = true;
                }
                group.appendChild(opt);
            });
            bossSelect.appendChild(group);
        });

        // 2. Populate Difficulty Options based on initial Boss
        updateDifficultyOptions();

        // 3. Set initial patch select value
        patchSelect.value = currentPatch;

        // 4. Set initial metric select value
        metricSelect.value = currentMetric;

        // 5. Add Change Listeners
        bossSelect.addEventListener('change', () => {
            currentBoss = bossSelect.value;
            updateDifficultyOptions();
            currentDifficulty = diffSelect.value;
            reloadDatabase();
        });

        diffSelect.addEventListener('change', () => {
            currentDifficulty = diffSelect.value;
            reloadDatabase();
        });

        patchSelect.addEventListener('change', () => {
            currentPatch = patchSelect.value;
            reloadDatabase();
        });

        metricSelect.addEventListener('change', () => {
            currentMetric = metricSelect.value;
            
            // Recalculate/update views as needed
            const activeTargets = getActiveTargets();
            if (activeTargets.length >= 2) {
                calculateAndRender();
            }
            
            const viewRankings = document.getElementById('view-rankings');
            if (viewRankings && viewRankings.style.display === 'block') {
                renderRankingsTable();
            }
        });
    }

    // Initialize Tab Navigation
    const btnComp = document.getElementById('nav-btn-comparator');
    const btnRank = document.getElementById('nav-btn-rankings');
    const viewSetup = document.getElementById('view-setup');
    const viewResults = document.getElementById('view-results');
    const viewRankings = document.getElementById('view-rankings');

    if (btnComp && btnRank && viewSetup && viewResults && viewRankings) {
        btnComp.addEventListener('click', () => {
            btnComp.classList.add('active');
            btnRank.classList.remove('active');
            viewRankings.style.display = 'none';
            if (viewResults.style.display === 'block') {
                viewSetup.style.display = 'none';
            } else {
                viewSetup.style.display = 'block';
            }
        });

        btnRank.addEventListener('click', () => {
            btnRank.classList.add('active');
            btnComp.classList.remove('active');
            viewSetup.style.display = 'none';
            viewResults.style.display = 'none';
            viewRankings.style.display = 'block';
            renderRankingsTable();
        });
    }
}

// Get active valid targets
function getActiveTargets() {
    const active = [];
    slots.forEach((slot, index) => {
        if (slot.dbIndex !== null && !isNaN(slot.dbIndex) && slot.dbIndex !== -1) {
            const data = lostArkDatabase[slot.dbIndex];
            if (data) {
                active.push({
                    slotIndex: index,
                    slotId: slot.id,
                    ...data
                });
            }
        }
    });
    return active;
}

// Perform calculations and update DOM elements
function calculateAndRender() {
    const activeTargets = getActiveTargets();
    
    if (activeTargets.length < 2) return;
    
    const metrics = ['ndps', 'dps', 'rdps', 'udps'];
    metrics.forEach(metricId => {
        const card = document.getElementById(`card-${metricId}`);
        if (card) {
            if (metricId === currentMetric) {
                card.style.display = 'block';
                renderMetricCard(metricId, activeTargets);
            } else {
                card.style.display = 'none';
            }
        }
    });
    
    renderCrossMatrix(activeTargets);
    generateAnalysisSummary(activeTargets);
}

// Generate short labels for targets (e.g. 소서리스·점화)
function getSlotLabel(item, index) {
    if (!item) return `대상 ${index + 1}`;
    if (item.type === 'global_avg') return '전체 평균';
    return `${item.class_kor}·${item.spec_kor}`;
}

// Render specific metric card (SVG chart & Table) comparing to overall averages
function renderMetricCard(metricId, activeTargets) {
    const card = document.getElementById(`card-${metricId}`);
    if (!card) return;
    
    const chartContainer = card.querySelector('.chart-container');
    const tbody = card.querySelector('tbody');
    
    const avgVal = globalAverages[metricId];
    
    let tableHtml = '';
    
    // Draw SVG
    const maxVal = Math.max(...activeTargets.map(t => t.values[metricId]));
    const N = activeTargets.length;
    const rowHeight = 36;
    const totalHeight = N * rowHeight + 20; // extra space for bottom label
    
    // Setup chart boundaries
    const chartMax = Math.max(maxVal, avgVal) * 1.10;
    const avgX = 170 + (avgVal / chartMax) * 280;
    
    let svgHtml = `<svg class="chart-svg" viewBox="0 0 580 ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">`;
    
    activeTargets.forEach((target, idx) => {
        const val = target.values[metricId];
        const mult = val / avgVal;
        const diffPercent = ((mult - 1) * 100).toFixed(1);
        
        // Multiplier Formatting (compared to global average)
        const prefix = mult >= 1.0 ? '+' : '';
        const multText = `${mult.toFixed(2)}x (${prefix}${diffPercent}%)`;
        const multClass = mult >= 1.0 ? 'multiplier-up' : 'multiplier-down';
        
        tableHtml += `
            <tr>
                <td>
                    <span class="row-slot-label">
                        <span class="color-dot color-dot-${target.slotIndex}"></span>
                        ${getSlotLabel(target, target.slotIndex)}
                    </span>
                </td>
                <td class="cell-val">${formatNumber(val)}</td>
                <td class="cell-multiplier ${multClass}">${multText}</td>
            </tr>
        `;
        
        const barWidth = chartMax > 0 ? (val / chartMax) * 280 : 0;
        const y = 8 + idx * rowHeight;
        
        const svgLabel = getSlotLabel(target, target.slotIndex);
        const svgMultText = `${mult.toFixed(2)}x`;
        
        svgHtml += `
            <g>
                <!-- Target name label -->
                <text x="10" y="${y + 12}" class="chart-text-name" fill="var(--text-secondary)" font-size="11px" font-family="var(--font-body)">${svgLabel}</text>
                
                <!-- Background track -->
                <rect x="170" y="${y}" width="280" height="16" class="chart-bar-bg" fill="rgba(255,255,255,0.03)" rx="6" />
                
                <!-- Colored Animating Bar -->
                <rect x="170" y="${y}" width="${barWidth}" height="16" class="chart-bar chart-bar-${target.slotIndex}" rx="6">
                    <animate attributeName="width" from="0" to="${barWidth}" dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0 1" />
                </rect>
                
                <!-- Value indicators -->
                <text x="465" y="${y + 12}" class="chart-text-val" fill="var(--text-main)" font-size="12px" font-family="var(--font-heading)" font-weight="600">${formatNumber(val)} (${svgMultText})</text>
            </g>
        `;
    });
    
    // Draw the overall average benchmark line & text
    svgHtml += `
        <!-- Global Average Line -->
        <line x1="${avgX}" y1="5" x2="${avgX}" y2="${totalHeight - 18}" stroke="rgba(255, 255, 255, 0.22)" stroke-dasharray="3 3" stroke-width="1.5" />
        <text x="${avgX}" y="${totalHeight - 4}" fill="rgba(255, 255, 255, 0.45)" font-size="9px" font-family="var(--font-body)" text-anchor="middle">전체 평균 (${formatNumber(avgVal)})</text>
    `;
    
    svgHtml += `</svg>`;
    
    chartContainer.innerHTML = svgHtml;
    tbody.innerHTML = tableHtml;
}

// Render 1:1 cross matrix (comparing active targets against each other)
function renderCrossMatrix(selectedTargets) {
    const matrixContainer = document.getElementById('matrix-container');
    if (!matrixContainer) return;
    
    const metricId = currentMetric;
    
    let html = `
        <table class="matrix-table-cross">
            <thead>
                <tr>
                    <th>세로 ↘ 가로 ➡</th>
    `;
    
    selectedTargets.forEach(target => {
        const labelText = getSlotLabel(target, target.slotIndex);
        html += `<th title="${target.class_kor} ${target.spec_kor}">${labelText}</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    selectedTargets.forEach(targetRow => {
        const rowVal = targetRow.values[metricId];
        const rowLabel = getSlotLabel(targetRow, targetRow.slotIndex);
        
        html += `
            <tr>
                <td class="matrix-label-cell" title="${rowLabel}">${rowLabel}</td>
        `;
        
        selectedTargets.forEach(targetCol => {
            const colVal = targetCol.values[metricId];
            
            if (targetRow.slotIndex === targetCol.slotIndex) {
                html += `<td class="matrix-val-cell matrix-val-self">1.00x</td>`;
            } else {
                const ratio = rowVal / colVal;
                let cellClass = '';
                if (ratio > 1.005) {
                    cellClass = 'matrix-val-higher';
                } else if (ratio < 0.995) {
                    cellClass = 'matrix-val-lower';
                } else {
                    cellClass = 'matrix-val-self';
                }
                const colLabel = getSlotLabel(targetCol, targetCol.slotIndex);
                html += `<td class="matrix-val-cell ${cellClass}" title="세로(${rowLabel})가 가로(${colLabel})보다 ${ratio.toFixed(2)}배">${ratio.toFixed(2)}x</td>`;
            }
        });
        
        html += `</tr>`;
    });
    
    html += `
            </tbody>
        </table>
        <div class="matrix-legend">
            <div class="matrix-legend-item">
                <span class="color-dot" style="background-color: var(--accent-emerald)"></span>
                <span>세로가 가로보다 강함 (&gt;1.00x)</span>
            </div>
            <div class="matrix-legend-item">
                <span class="color-dot" style="background-color: var(--accent-red)"></span>
                <span>세로가 가로보다 약함 (&lt;1.00x)</span>
            </div>
        </div>
    `;
    
    matrixContainer.innerHTML = html;
}

// Generate dynamic text summary
function generateAnalysisSummary(selectedTargets) {
    const contentEl = document.getElementById('analysis-content');
    if (!contentEl) return;
    
    const sortedByUdps = [...selectedTargets].sort((a, b) => b.values.udps - a.values.udps);
    const strongest = sortedByUdps[0];
    const weakest = sortedByUdps[sortedByUdps.length - 1];
    
    const strongestLabel = getSlotLabel(strongest, strongest.slotIndex);
    const weakestLabel = getSlotLabel(weakest, weakest.slotIndex);
    
    const udpsRatio = strongest.values.udps / weakest.values.udps;
    const dpsRatio = strongest.values.dps / weakest.values.dps;
    const rdpsRatio = strongest.values.rdps / weakest.values.rdps;
    
    // Compare strongest against overall spec average
    const strongToAvgUdps = strongest.values.udps / globalAverages.udps;
    
    let html = '';
    
    // Paragraph 1: Compared to overall average and target-to-target comparison
    html += `
        <div class="analysis-p">
            선택된 세팅 중 가장 강력한 세팅은 <strong>uDPS</strong> 기준 <span class="analysis-highlight">${strongestLabel}</span>이며, 이는 게임 내 전체 직종 스펙 평균 대비 
            <span class="analysis-diff-up">${strongToAvgUdps.toFixed(2)}배</span> (+${((strongToAvgUdps - 1)*100).toFixed(1)}%)에 달하는 성능을 뽐내고 있습니다.
        </div>
    `;
    
    // Paragraph 2: Direct comparative gaps
    html += `
        <div class="analysis-p" style="margin-top: 0.8rem;">
            비교 대상 내 최고 성능 세팅과 최저 성능 세팅(<span class="analysis-highlight">${weakestLabel}</span>)의 격차는 
            <strong>uDPS</strong> 기준 <span class="analysis-diff-up">${udpsRatio.toFixed(2)}배</span>, 
            <strong>Raw DPS</strong> 기준 <span class="analysis-diff-up">${dpsRatio.toFixed(2)}배</span>, 
            <strong>rDPS</strong> 기준 <span class="analysis-diff-up">${rdpsRatio.toFixed(2)}배</span> 수준으로 벌어집니다.
        </div>
    `;
    
    // Paragraph 3: Contextual advice
    html += `<div class="analysis-p" style="margin-top: 0.8rem;">`;
    if (strongest.class_kor === '소서리스' && weakest.class_kor === '소서리스') {
        html += `
            💡 소서리스의 각인(점화 vs 환류) 설정에 따라 전체 평균 대비 격차가 크게 벌어지는 것을 알 수 있습니다. 
            특히 딜 포텐셜이 높은 세팅과 시너지 세팅 간의 선택이 중요합니다.
        `;
    } else {
        html += `
            💡 대다수의 고성능 직업 각인 세팅은 전체 평균선(점선 표시)을 크게 상회하며, 
            세팅 완성도나 저조한 시너지 세팅의 경우 평균선 이하에 위치하여 딜 포텐셜의 격차를 나타내기도 합니다.
        `;
    }
    html += `</div>`;
    
    contentEl.innerHTML = html;
}

// Helper: Format integers
function formatNumber(num) {
    return Math.round(num).toLocaleString();
}

// ==========================================
// REAL-TIME CLIENT-SIDE API SCRAPER LOGIC
// ==========================================

const CLASS_MAP = {
    "Aeromancer": "기상술사", "Arcanist": "아르카나", "Artillerist": "블래스터",
    "Artist": "도화가", "Bard": "바드", "Berserker": "버서커", "Breaker": "브레이커",
    "Deadeye": "데빌헌터", "Deathblade": "블레이드", "Destroyer": "디스트로이어",
    "Glaivier": "창술사", "Guardianknight": "가디언나이트", "Gunlancer": "워로드",
    "Gunslinger": "건슬링어", "Machinist": "스카우터", "Paladin": "홀리나이트",
    "Reaper": "리퍼", "Scrapper": "인파이터", "Shadowhunter": "데모닉",
    "Sharpshooter": "호크아이", "Slayer": "슬레이어", "Sorceress": "소서리스",
    "Souleater": "소울이터", "Soulfist": "기공사", "Striker": "스트라이커",
    "Summoner": "서머너", "Valkyrie": "발키리", "Wardancer": "배틀마스터",
    "Wildsoul": "와일드소울"
};

const SPEC_MAP = {
    "Drizzle": "이슬비", "Wind Fury": "질풍노도", "Grace of the Empress": "황후의 은총",
    "Order of the Emperor": "황제의 칙령", "Barrage Enhancement": "포격 강화",
    "Firepower Enhancement": "화력 강화", "Recurrence": "회귀", "True Courage": "진실된 용기",
    "Berserker Technique": "광전사의 비기", "Mayhem": "광기", "Asura's Path": "수라결",
    "Brawl King Storm": "권왕태세", "Enhanced Weapon": "강화 무기", "Pistoleer": "핸드거너",
    "Remaining Energy": "잔재된 기운", "Surge": "버스트", "Gravity Training": "중력 수련",
    "Rage Hammer": "분노의 망치", "Control": "절제", "Pinnacle": "절정",
    "Dreadful Roar": "끔찍한 포효", "Hellfire Successor": "업화의 계승자", "Combat Readiness": "전투 태세",
    "Lone Knight": "고독한 기사", "Peacemaker": "피스메이커", "Time to Hunt": "사냥의 시간",
    "Arthetinean Skill": "아르데타인의 기술", "Evolutionary Legacy": "진화의 유산",
    "Judgment": "심판자", "Hunger": "갈증", "Lunar Voice": "달의 소리", "Shock Training": "충격 단련",
    "Ultimate Skill: Taijutsu": "극의: 체술", "Demonic Impulse": "멈출 수 없는 충동",
    "Perfect Suppression": "완벽한 억제", "Death Strike": "죽음의 습격", "Loyal Companion": "두 번째 동료",
    "Predator": "포식자", "Punisher": "처단자", "Igniter": "점화", "Reflux": "환류",
    "Full Moon Harvester": "만월의 집행자", "Night's Edge": "그믐의 경계", "Energy Overflow": "세맥타통",
    "Robust Spirit": "역천지체", "Deathblow": "일격필살", "Esoteric Flurry": "오의난무",
    "Communication Overflow": "넘치는 교감", "Master Summoner": "상급 소환사", "Shining Knight": "빛의 기사",
    "Esoteric Skill Enhancement": "오의 강화", "First Intention": "초심", "Ferality": "야성",
    "Phantom Beast Awakening": "환수 각성"
};

const SUPPORT_SPECS = new Set(["Blessed Aura", "Desperate Salvation", "Full Bloom", "Liberator", "Princess"]);

const CORS_PROXIES = [
    url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

async function fetchWithProxy(url) {
    let lastError = null;
    for (const getProxyUrl of CORS_PROXIES) {
        try {
            const pUrl = getProxyUrl(url);
            const resp = await fetch(pUrl);
            if (resp.ok) {
                return await resp.text();
            }
            lastError = new Error(`HTTP ${resp.status} on ${pUrl}`);
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error("All proxies failed");
}

async function fetchJsonWithProxy(url) {
    let lastError = null;
    for (const getProxyUrl of CORS_PROXIES) {
        try {
            const pUrl = getProxyUrl(url);
            const resp = await fetch(pUrl);
            if (resp.ok) {
                return await resp.json();
            }
            lastError = new Error(`HTTP ${resp.status} on ${pUrl}`);
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError || new Error("All proxies failed");
}

function deserialize(dataStr) {
    const arr = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    const memo = {};
    
    function resolve(idx) {
        if (idx in memo) {
            return memo[idx];
        }
        const val = arr[idx];
        if (val === null || val === undefined) {
            memo[idx] = val;
            return val;
        }
        if (Array.isArray(val)) {
            const resolvedList = [];
            memo[idx] = resolvedList;
            for (const item of val) {
                if (typeof item === 'number' && Number.isInteger(item)) {
                    resolvedList.push(resolve(item));
                } else {
                    resolvedList.push(item);
                }
            }
            return resolvedList;
        } else if (typeof val === 'object') {
            const resolvedDict = {};
            memo[idx] = resolvedDict;
            for (const [k, v] of Object.entries(val)) {
                if (typeof v === 'number' && Number.isInteger(v)) {
                    resolvedDict[k] = resolve(v);
                } else {
                    resolvedDict[k] = v;
                }
            }
            return resolvedDict;
        } else {
            memo[idx] = val;
            return val;
        }
    }
    return resolve(0);
}

function getRelativePayload(boss, difficulty, dpsType, patch) {
    const arr = [
        ["__skrao", 1],
        {
            "boss": 2,
            "difficulty": 3,
            "dpsType": 4,
            "patch": 5
        },
        boss,
        difficulty,
        dpsType,
        patch
    ];
    const jsonStr = JSON.stringify(arr);
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return b64.replace(/=+$/, "");
}

async function scrapeLiveStats(loadingTextEl) {
    const updateStatus = (text) => {
        if (loadingTextEl) {
            loadingTextEl.textContent = text;
        }
        console.log(text);
    };

    let cpHash = cachedCpHash;
    if (!cpHash) {
        updateStatus("로스트아크 바이블 페이지 분석 중...");
        const html = await fetchWithProxy("https://lostark.bible/stats/combat-power");
        
        updateStatus("SvelteKit 모듈 정보 추출 중...");
        const appJsMatch = html.match(/["']([^"']*(?:_app\/immutable\/entry\/app\.[a-zA-Z0-9_.-]+\.js))["']/);
        if (!appJsMatch) throw new Error("Could not find app.js script path in HTML");
        const appJsRelative = appJsMatch[1];
        const appJsClean = appJsRelative.startsWith("../") ? appJsRelative.substring(3) : appJsRelative.startsWith("/") ? appJsRelative.substring(1) : appJsRelative;
        const appJsUrl = `https://lostark.bible/${appJsClean}`;
        
        const appJsText = await fetchWithProxy(appJsUrl);
        
        // Extract all node files
        const importRegex = /\bimport\(\s*[`'"]\.\.\/([^`'"]+\.js)[`'"]\s*\)/g;
        const nodeFiles = [];
        let match;
        while ((match = importRegex.exec(appJsText)) !== null) {
            nodeFiles.push(match[1]);
        }
        
        // Find route nodes
        const cpRouteMatch = appJsText.match(/"\/stats\/combat-power"\s*:\s*\[\s*-?(\d+)/);
        const genericRouteMatch = appJsText.match(/"\/stats\/generic"\s*:\s*\[\s*-?(\d+)/);
        
        const candidateNodes = [];
        if (cpRouteMatch) {
            const idx = parseInt(cpRouteMatch[1]);
            if (nodeFiles[idx]) candidateNodes.push({ index: idx, file: nodeFiles[idx] });
        }
        if (genericRouteMatch) {
            const idx = parseInt(genericRouteMatch[1]);
            if (nodeFiles[idx]) candidateNodes.push({ index: idx, file: nodeFiles[idx] });
        }
        
        if (candidateNodes.length === 0) {
            for (let i = 50; i < Math.min(nodeFiles.length, 65); i++) {
                candidateNodes.push({ index: i, file: nodeFiles[i] });
            }
        }
        
        updateStatus("API 통신 토큰 수집 중...");
        for (const node of candidateNodes) {
            const nodeUrl = `https://lostark.bible/_app/immutable/${node.file}`;
            try {
                const nodeText = await fetchWithProxy(nodeUrl);
                const hashMatch = nodeText.match(/\b([a-zA-Z0-9]{7})\/combatPowerDPSSearch\b/);
                if (hashMatch) {
                    cpHash = hashMatch[1];
                    break;
                }
            } catch (e) {
                console.warn(`Error scanning node ${node.index}:`, e);
            }
        }
        
        if (!cpHash) throw new Error("Could not find combatPowerDPSSearch build hash");
        cachedCpHash = cpHash;
    }
    
    updateStatus("실시간 직종 성능 데이터 병렬 요청 중...");
    const dpsTypes = ["ndps", "dps", "rdps", "udps"];
    const liveResults = {};
    
    const fetchPromises = dpsTypes.map(async (dpsType) => {
        const payload = getRelativePayload(currentBoss, currentDifficulty, dpsType, currentPatch);
        const url = `https://lostark.bible/_app/remote/${cpHash}/combatPowerDPSSearch?payload=${payload}`;
        try {
            const json = await fetchJsonWithProxy(url);
            if (json && json.result) {
                liveResults[dpsType] = deserialize(json.result);
            }
        } catch (e) {
            console.error(`Error fetching ${dpsType}:`, e);
        }
    });
    
    await Promise.all(fetchPromises);
    
    const baseType = liveResults["ndps"] ? "ndps" : Object.keys(liveResults)[0];
    if (!baseType || !liveResults[baseType]) {
        throw new Error("No live stats records fetched successfully");
    }
    
    updateStatus("실시간 지표 매핑 및 분석 데이터 병합 중...");
    const specsDb = {};
    
    for (const entry of liveResults[baseType]) {
        const spec = entry.spec;
        if (SUPPORT_SPECS.has(spec)) continue;
        const className = entry.class;
        const key = `${className}-${spec}`;
        
        specsDb[key] = {
            type: "spec",
            class_eng: className,
            class_kor: CLASS_MAP[className] || className,
            spec_eng: spec,
            spec_kor: SPEC_MAP[spec] || spec,
            values: {
                ndps: 0,
                dps: 0,
                rdps: 0,
                udps: 0
            }
        };
    }
    
    for (const dpsType of dpsTypes) {
        if (!liveResults[dpsType]) continue;
        for (const entry of liveResults[dpsType]) {
            const spec = entry.spec;
            const className = entry.class;
            const key = `${className}-${spec}`;
            
            if (specsDb[key]) {
                specsDb[key].values[dpsType] = Math.round(entry.avg || 0);
            }
        }
    }
    
    // Fallback missing udps (approximate to 0.545 * dps)
    for (const key of Object.keys(specsDb)) {
        const specData = specsDb[key];
        if (specData.values.udps === 0 && specData.values.dps > 0) {
            specData.values.udps = Math.round(specData.values.dps * 0.545);
        }
    }
    
    const databaseList = Object.values(specsDb);
    if (databaseList.length === 0) {
        throw new Error("Live database is empty");
    }
    return databaseList;
}

// ==========================================
// RAID METADATA & RELOAD DATABASE LOGIC
// ==========================================

const RAID_METADATA = [
    {
        name: "Serca (세르카)",
        bosses: [
            { apiName: "Corvus Tul Rak", displayName: "세르카 2관문 (코르부스 툴 락)", difficulties: ["Nightmare", "Hard", "Normal"] },
            { apiName: "Witch of Agony, Serca", displayName: "세르카 1관문 (고통의 마녀 세르카)", difficulties: ["Hard", "Normal"] }
        ]
    },
    {
        name: "Kazeros (카제로스)",
        bosses: [
            { apiName: "Death Incarnate Kazeros", displayName: "카제로스 2관문 (죽음의 화신 카제로스)", difficulties: ["Hard", "Normal"] },
            { apiName: "Abyss Lord Kazeros", displayName: "카제로스 1관문 (심연의 군주 카제로스)", difficulties: ["The First", "Hard", "Normal"] }
        ]
    },
    {
        name: "Armoche (아르모헤)",
        bosses: [
            { apiName: "Armoche, Sentinel of the Abyss", displayName: "아르모헤 2관문 (심연의 파수꾼 아르모헤)", difficulties: ["Hard", "Normal"] },
            { apiName: "Brelshaza, Ember in the Ashes", displayName: "아르모헤 1관문 (잿더미 속의 아브렐슈드)", difficulties: ["Hard", "Normal"] }
        ]
    },
    {
        name: "Mordum (모르둠)",
        bosses: [
            { apiName: "Mordum, the Abyssal Punisher", displayName: "모르둠 3관문 (심연의 형벌자 모르둠)", difficulties: ["Hard", "Normal"] },
            { apiName: "Blossoming Fear, Naitreya", displayName: "모르둠 2관문 (피어나는 공포 나이트레야)", difficulties: ["Hard", "Normal"] },
            { apiName: "Infernas", displayName: "모르둠 1관문 (인페르나스)", difficulties: ["Hard", "Normal"] }
        ]
    },
    {
        name: "Brelshaza (2막 아브렐슈드)",
        bosses: [
            { apiName: "Phantom Manifester Brelshaza", displayName: "아브렐슈드 2관문 (환영의 화신 아브렐슈드)", difficulties: ["Hard", "Normal"] },
            { apiName: "Narok the Butcher", displayName: "아브렐슈드 1관문 (도살자 나록)", difficulties: ["Hard", "Normal"] }
        ]
    },
    {
        name: "Aegir (1막 에기르)",
        bosses: [
            { apiName: "Aegir, the Oppressor", displayName: "에기르 2관문 (압도자 에기르)", difficulties: ["Hard", "Normal"] },
            { apiName: "Akkan, Lord of Death", displayName: "에기르 1관문 (죽음의 군주 일리아칸)", difficulties: ["Hard", "Normal"] }
        ]
    },
    {
        name: "Behemoth (베히모스)",
        bosses: [
            { apiName: "Behemoth, Cruel Storm Slayer", displayName: "베히모스 2관문 (잔혹한 폭풍 학살자 베히모스)", difficulties: ["Normal"] },
            { apiName: "Behemoth, the Storm Commander", displayName: "베히모스 1관문 (폭풍 사령관 베히모스)", difficulties: ["Normal"] }
        ]
    },
    {
        name: "Horizon Cathedral (지평선 성당)",
        bosses: [
            { apiName: "Arcenos, Vanguard of Fanaticism", displayName: "지평선 성당 G2 (광신의 선봉장)", difficulties: ["Level 3", "Level 2", "Level 1"] },
            { apiName: "Archbishop Arcenos", displayName: "지평선 성당 G1 (대주교 아르세노스)", difficulties: ["Level 3", "Level 2", "Level 1"] }
        ]
    },
    {
        name: "Thaemine (카멘)",
        bosses: [
            { apiName: "Thaemine, Conqueror of Stars", displayName: "카멘 G4 (별을 정복한 카멘)", difficulties: ["Extreme Hard", "Extreme Normal"] }
        ]
    },
    {
        name: "Tarkal (타르칼)",
        bosses: [
            { apiName: "Flame of Darkness, Tarkal", displayName: "타르칼 G1 (어둠의 불꽃)", difficulties: ["Hard", "Normal"] }
        ]
    }
];

function updateDifficultyOptions() {
    const bossSelect = document.getElementById('global-boss-select');
    const diffSelect = document.getElementById('global-difficulty-select');
    if (!bossSelect || !diffSelect) return;
    
    const selectedBossName = bossSelect.value;
    let foundBoss = null;
    for (const raid of RAID_METADATA) {
        foundBoss = raid.bosses.find(b => b.apiName === selectedBossName);
        if (foundBoss) break;
    }
    
    if (!foundBoss) return;
    
    diffSelect.innerHTML = "";
    foundBoss.difficulties.forEach(diff => {
        const opt = document.createElement('option');
        opt.value = diff;
        opt.textContent = diff;
        if (diff === currentDifficulty) {
            opt.selected = true;
        }
        diffSelect.appendChild(opt);
    });
    
    if (!foundBoss.difficulties.includes(currentDifficulty)) {
        currentDifficulty = foundBoss.difficulties[0];
        diffSelect.value = currentDifficulty;
    }
}

async function reloadDatabase() {
    const overlay = document.getElementById('db-loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
    const loadingTextEl = overlay ? overlay.querySelector('.loading-text') : null;
    if (loadingTextEl) {
        loadingTextEl.textContent = "레이드 필터 변경에 따라 실시간 데이터를 다시 불러오고 있습니다...";
    }
    
    try {
        lostArkDatabase = await scrapeLiveStats(loadingTextEl);
        console.log("Database reloaded in real-time from API. Records:", lostArkDatabase.length);
        updateApiStatus(true);
    } catch (e) {
        console.error("Failed to reload live database from API, using local fallback database.js:", e);
        updateApiStatus(false, e.message);
        if (typeof fallbackDatabase !== 'undefined') {
            lostArkDatabase = JSON.parse(JSON.stringify(fallbackDatabase));
        } else {
            lostArkDatabase = [];
        }
    }
    
    // Hide overlay
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
    
    // 1. Calculate overall averages of class specs
    calculateGlobalAverages();
    
    // Remove old virtual global avg item and append new one
    lostArkDatabase = lostArkDatabase.filter(item => item.type !== 'global_avg');
    lostArkDatabase.push({
        type: 'global_avg',
        class_eng: 'All',
        class_kor: '전체',
        spec_eng: 'Overall Average',
        spec_kor: '전체 평균',
        values: globalAverages
    });
    
    // 2. Update active targets and drop-downs for all slots
    slots.forEach(slot => {
        const classSelect = document.getElementById(`slot-class-${slot.id}`);
        const specSelect = document.getElementById(`slot-spec-${slot.id}`);
        
        if (classSelect && specSelect) {
            const prevClass = slot.classVal;
            const prevSpec = slot.specVal;
            
            const classes = [...new Set(lostArkDatabase.filter(item => item.class_kor !== '전체').map(item => item.class_kor))].sort();
            classSelect.innerHTML = '<option value="all">전체 (All)</option>';
            classes.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.textContent = cls;
                if (cls === prevClass) opt.selected = true;
                classSelect.appendChild(opt);
            });
            
            if (prevClass !== 'all') {
                const specs = [...new Set(lostArkDatabase.filter(item => item.type === 'spec' && item.class_kor === prevClass).map(item => item.spec_kor))].sort();
                specSelect.innerHTML = '';
                specs.forEach(sp => {
                    const opt = document.createElement('option');
                    opt.value = sp;
                    opt.textContent = sp;
                    if (sp === prevSpec) opt.selected = true;
                    specSelect.appendChild(opt);
                });
            }
        }
        updateSlotTarget(slot);
    });

    // 3. If rankings view is currently active, update the ranking table content
    const viewRankings = document.getElementById('view-rankings');
    if (viewRankings && viewRankings.style.display === 'block') {
        renderRankingsTable();
    }
}

function renderRankingsTable() {
    const tableBody = document.getElementById('rankings-table-body');
    if (!tableBody) return;
    const rankingMetric = currentMetric;

    // Filter out virtual global averages and only sort base engravings (type: 'spec')
    const specs = lostArkDatabase.filter(item => item.type === 'spec');
    
    // Sort by selected metric descending
    specs.sort((a, b) => (b.values[rankingMetric] || 0) - (a.values[rankingMetric] || 0));
    
    // Get overall average for multiplier comparison
    const avgVal = globalAverages[rankingMetric] || 1;

    let html = "";
    specs.forEach((item, idx) => {
        const rank = idx + 1;
        const val = item.values[rankingMetric] || 0;
        const mult = val / avgVal;
        const diffPercent = ((mult - 1) * 100).toFixed(1);
        const prefix = mult >= 1.0 ? '+' : '';
        const multText = `${mult.toFixed(2)}x (${prefix}${diffPercent}%)`;
        const multClass = mult >= 1.0 ? 'multiplier-up' : 'multiplier-down';

        let rowClass = "";
        if (rank === 1) rowClass = "rank-1";
        else if (rank === 2) rowClass = "rank-2";
        else if (rank === 3) rowClass = "rank-3";

        // Build metric values
        const udpsText = formatNumber(item.values.udps || 0);
        const ndpsText = formatNumber(item.values.ndps || 0);
        const dpsText = formatNumber(item.values.dps || 0);
        const rdpsText = formatNumber(item.values.rdps || 0);

        html += `
            <tr class="${rowClass}">
                <td style="text-align: center; padding: 0.8rem;"><span class="rank-badge">${rank}</span></td>
                <td style="padding: 0.8rem; font-weight: 500; font-family: var(--font-heading);">${item.class_kor}</td>
                <td style="padding: 0.8rem; color: var(--text-secondary);">${item.spec_kor}</td>
                <td style="padding: 0.8rem; text-align: right; font-family: var(--font-heading); font-weight: 600; ${rankingMetric === 'udps' ? 'color: var(--accent-purple); font-size: 1.05rem;' : ''}">${udpsText}</td>
                <td style="padding: 0.8rem; text-align: right; font-family: var(--font-heading); font-weight: 600; ${rankingMetric === 'ndps' ? 'color: var(--accent-purple); font-size: 1.05rem;' : ''}">${ndpsText}</td>
                <td style="padding: 0.8rem; text-align: right; font-family: var(--font-heading); font-weight: 600; ${rankingMetric === 'dps' ? 'color: var(--accent-purple); font-size: 1.05rem;' : ''}">${dpsText}</td>
                <td style="padding: 0.8rem; text-align: right; font-family: var(--font-heading); font-weight: 600; ${rankingMetric === 'rdps' ? 'color: var(--accent-purple); font-size: 1.05rem;' : ''}">${rdpsText}</td>
                <td style="padding: 0.8rem; text-align: right; font-family: var(--font-heading); font-weight: 600;" class="${multClass}">${multText}</td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
}
