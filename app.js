// lostark_performance_comparator/app.js

// Global State
let lostArkDatabase = [];
let slots = [];
let nextSlotId = 1;
let globalAverages = {};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
});

async function loadDatabase() {
    const overlay = document.getElementById('db-loading-overlay');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
        try {
            const resp = await fetch('/api/live-stats');
            if (resp.ok) {
                lostArkDatabase = await resp.json();
                console.log("Database loaded from API. Records:", lostArkDatabase.length);
            } else {
                throw new Error("HTTP " + resp.status);
            }
        } catch (e) {
            console.error("Failed to load live database from API, using local fallback database.js if available:", e);
            if (typeof fallbackDatabase !== 'undefined') {
                lostArkDatabase = fallbackDatabase;
            }
        }
    } else {
        console.log("Running on static production environment. Loading pre-rendered database.js.");
        if (typeof fallbackDatabase !== 'undefined') {
            lostArkDatabase = fallbackDatabase;
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
    
    // Cross matrix metric change
    document.getElementById('matrix-metric-select').addEventListener('change', () => {
        const activeTargets = getActiveTargets();
        renderCrossMatrix(activeTargets);
    });
    
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
        renderMetricCard(metricId, activeTargets);
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
    
    const metricId = document.getElementById('matrix-metric-select').value;
    
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
