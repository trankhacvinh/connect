document.addEventListener('DOMContentLoaded', () => {
    // --- CÀI ĐẶT TRÒ CHƠI ---
    const DEBUG_MODE = false;
    let GRID_WIDTH;  // ✅ THAY ĐỔI: Chuyển sang let
    let GRID_HEIGHT; // ✅ THAY ĐỔI: Chuyển sang let
    const ICONS = Array.from({ length: 20 }, (_, i) => `images/animal${i + 1}.png`);
    const TIME_PER_LEVEL = 300;
    const SHUFFLE_LIMIT = 2;
    const BGM_TRACKS = ['sounds/sbg1.mp3', 'sounds/sbg2.mp3', 'sounds/sbg3.mp3','sounds/sbg4.mp3','sounds/sbg5.mp3','sounds/sbg6.mp3','sounds/sbg7.mp3','sounds/sbg8.mp3'];
    const SAVE_KEY = 'pikaSaveGame';

    // --- LẤY CÁC PHẦN TỬ HTML ---
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const gameContainer = document.getElementById('game-container');
    const gameBoard = document.getElementById('game-board');
    const levelDisplay = document.getElementById('level');
    const scoreDisplay = document.getElementById('score');
    const timeBar = document.getElementById('time-bar');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const shufflesLeftDisplay = document.getElementById('shuffles-left');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalBtn = document.getElementById('modal-btn');
    const levelMechanicDisplay = document.getElementById('level-mechanic-display');
    const bgm = document.getElementById('bgm');
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const masterMuteBtn = document.getElementById('master-mute-btn');
    const debugToolbar = document.getElementById('debug-toolbar');
    const debugWinBtn = document.getElementById('debug-win-btn');
    const debugLoseBtn = document.getElementById('debug-lose-btn');
    const debugAddTimeBtn = document.getElementById('debug-add-time-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadGameContainer = document.getElementById('load-game-container');
    const saveInfoDisplay = document.getElementById('save-info');
    const saveToast = document.getElementById('save-toast');


    // --- BIẾN TRẠNG THÁI GAME ---
    let grid = [];
    let level = 1;
    let score = 0;
    let shufflesLeft = SHUFFLE_LIMIT;
    let firstSelection = null;
    let timerInterval;
    let timeLeft = TIME_PER_LEVEL;
    let isPaused = false;
    let remainingPairs = 0;
    let isBgmMuted = false;
    let isMasterMuted = false;
    let hasInteracted = false;
    let currentBgmIndex = 0;
    let toastTimeout;


    // --- ✅ THAY ĐỔI: CẬP NHẬT CẤU HÌNH MÀN CHƠI ---
    const levelConfigs = [
        { gravity: 'none', description: 'Cổ điển: Các khối đứng yên.' },
        { gravity: 'down', description: 'Trọng lực: Các khối sẽ rơi xuống dưới.' },
        { gravity: 'up', description: 'Phản trọng lực: Các khối sẽ bị đẩy lên trên.' },
        { gravity: 'left', description: 'Gió Tây: Các khối sẽ dồn về bên trái.' },
        { gravity: 'right', description: 'Gió Đông: Các khối sẽ dồn về bên phải.' },
        { gravity: 'center-in-horizontal', description: 'Hút vào: Các khối dồn vào giữa theo chiều ngang.' },
        { gravity: 'center-out-horizontal', description: 'Đẩy ra: Các khối bị đẩy ra hai bên theo chiều ngang.' },
        { gravity: 'compress-vertical', description: 'Nén xuống: Toàn bộ các khối bị dồn xuống dưới cùng.' },
        { gravity: 'split-vertical', description: 'Tách đôi: Nửa trên dồn lên, nửa dưới dồn xuống.' },
        { gravity: 'split-horizontal', description: 'Rẽ đôi: Nửa trái dồn trái, nửa phải dồn phải.' },
        { gravity: 'quadrant-push', description: 'Góc phần tư: Các khối dồn về 4 góc.' },
    ];

    // --- ÂM THANH ---
    const sounds = {
        select: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination(),
        match: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
        noMatch: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination(),
        win: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 1 } }).toDestination(),
        lose: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, decay: 1, sustain: 0, release: 1 } }).toDestination(),
        shuffle: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 } }).toDestination()
    };
    function playSound(soundKey, ...args) {
        if (!isMasterMuted) {
            sounds[soundKey].triggerAttackRelease(...args);
        }
    }
    function setGridForDevice() {
        // Dùng window.innerWidth để kiểm tra chiều rộng màn hình.
        // Mốc 768px là một breakpoint phổ biến cho mobile/tablet.
        if (window.innerWidth <= 768) {
            // Thiết lập cho Mobile
            GRID_WIDTH = 15;
            GRID_HEIGHT = 6;
        } else {
            // Thiết lập cho Desktop
            GRID_WIDTH = 30;
            GRID_HEIGHT = 13;
        }
    }
    setGridForDevice();
    // --- CÁC HÀM LƯU/TẢI GAME ---
    function showSaveToast(message, duration = 2000) {
        clearTimeout(toastTimeout);
        saveToast.textContent = message;
        saveToast.classList.remove('hidden', 'saving');
        if (message.includes('Đang')) {
            saveToast.classList.add('saving');
        }
        saveToast.classList.add('show');
        toastTimeout = setTimeout(() => {
            saveToast.classList.remove('show');
        }, duration);
    }

    function saveGame() {
        showSaveToast('Đang lưu...', 500);
        const gameState = {
            level, score, timeLeft, shufflesLeft, grid, remainingPairs,
            saveTimestamp: new Date().toISOString(),
        };
        setTimeout(() => {
            localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
            showSaveToast('Đã lưu!');
        }, 500);
    }

    function loadGame() {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (!savedData) return;
        const gameState = JSON.parse(savedData);
        level = gameState.level;
        score = gameState.score;
        timeLeft = gameState.timeLeft;
        shufflesLeft = gameState.shufflesLeft;
        grid = gameState.grid;
        remainingPairs = gameState.remainingPairs;
        startScreen.classList.add('not-start');
        gameContainer.classList.remove('not-start');
        hasInteracted = true;
        playBGM();
        isPaused = false;
        firstSelection = null;
        const currentLevelConfig = levelConfigs[(level - 1) % levelConfigs.length];
        levelMechanicDisplay.textContent = `Màn ${level}: ${currentLevelConfig.description}`;
        renderGrid();
        updateUI();
        startTimer();
    }

    function deleteSave() {
        localStorage.removeItem(SAVE_KEY);
        loadGameContainer.classList.add('hidden');
    }

    function checkForSavedGame() {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (savedData) {
            const gameState = JSON.parse(savedData);
            const saveDate = new Date(gameState.saveTimestamp);
            const formattedDate = `${saveDate.toLocaleDateString('vi-VN')} ${saveDate.toLocaleTimeString('vi-VN')}`;
            saveInfoDisplay.textContent = `Lưu lúc: ${formattedDate} | Màn: ${gameState.level} | Điểm: ${gameState.score}`;
            loadGameContainer.classList.remove('hidden');
        }
    }

    // --- KHỞI TẠO GAME ---
    function initGame() {
        playBGM();
        isPaused = false;
        firstSelection = null;
        timeLeft = TIME_PER_LEVEL;
        shufflesLeft = SHUFFLE_LIMIT;
        const currentLevelConfig = levelConfigs[(level - 1) % levelConfigs.length];
        levelMechanicDisplay.textContent = `Màn ${level}: ${currentLevelConfig.description}`;
        createGrid();
        renderGrid();
        updateUI();
        checkAndShuffleIfStuck();
        startTimer();
    }

    function startNewLevel() {
        isPaused = false;
        firstSelection = null;
        timeLeft = TIME_PER_LEVEL;
        shufflesLeft = SHUFFLE_LIMIT;
        const currentLevelConfig = levelConfigs[(level - 1) % levelConfigs.length];
        levelMechanicDisplay.textContent = `Màn ${level}: ${currentLevelConfig.description}`;
        createGrid();
        renderGrid();
        updateUI();
        checkAndShuffleIfStuck();
        startTimer();
    }

    // --- TẠO LƯỚI CHƠI ---
    function createGrid() {
        const numPairs = (GRID_WIDTH * GRID_HEIGHT) / 2;
        remainingPairs = numPairs;
        let iconsToPlace = [];
        for (let i = 0; i < numPairs; i++) {
            const icon = ICONS[i % ICONS.length];
            iconsToPlace.push(icon, icon);
        }
        for (let i = iconsToPlace.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [iconsToPlace[i], iconsToPlace[j]] = [iconsToPlace[j], iconsToPlace[i]];
        }
        grid = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                row.push(iconsToPlace.pop());
            }
            grid.push(row);
        }
    }

    // --- HIỂN THỊ LƯỚI LÊN GIAO DIỆN ---
    function renderGrid() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${GRID_HEIGHT}, 1fr)`;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                if (grid[y][x] === null) {
                    cell.classList.add('hidden');
                } else {
                    const img = document.createElement('img');
                    img.src = grid[y][x];
                    img.alt = "Animal Icon";
                    cell.appendChild(img);
                    cell.addEventListener('click', handleCellClick);
                }
                gameBoard.appendChild(cell);
            }
        }
    }

    // --- XỬ LÝ CLICK VÀO Ô ---
    function handleCellClick(event) {
        if (isPaused) return;
        const cell = event.currentTarget;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        if (grid[y][x] === null) return;
        playSound('select', 'C5', '8n');
        cell.classList.add('selected');
        if (!firstSelection) {
            firstSelection = { x, y, cell };
        } else {
            if (firstSelection.x === x && firstSelection.y === y) {
                firstSelection.cell.classList.remove('selected');
                firstSelection = null;
                return;
            }
            isPaused = true;
            const secondSelection = { x, y, cell };
            if (grid[y][x] === grid[firstSelection.y][firstSelection.x] && findPath(firstSelection, secondSelection)) {
                handleMatch(firstSelection, secondSelection);
            } else {
                handleNoMatch(firstSelection, secondSelection);
            }
        }
    }

    // --- XỬ LÝ KHI NỐI THÀNH CÔNG ---
    function handleMatch(sel1, sel2) {
        playSound('match', 'G5', '8n', Tone.now() + 0.1);
        score += Math.max(10, Math.floor(timeLeft / 10));
        setTimeout(() => {
            grid[sel1.y][sel1.x] = null;
            grid[sel2.y][sel2.x] = null;
            remainingPairs--;
            firstSelection = null;
            applyGravity();
            renderGrid();
            if (remainingPairs === 0) {
                gameOver(true);
            } else {
                saveGame();
                checkAndShuffleIfStuck();
                isPaused = false;
            }
            updateUI();
        }, 300);
    }

    // --- XỬ LÝ KHI NỐI THẤT BẠI ---
    function handleNoMatch(sel1, sel2) {
        playSound('noMatch', 'C3', '8n');
        setTimeout(() => {
            sel1.cell.classList.remove('selected');
            sel2.cell.classList.remove('selected');
            firstSelection = null;
            isPaused = false;
        }, 500);
    }

    // --- THUẬT TOÁN TÌM ĐƯỜNG ĐI (BFS) ---
    function findPath(start, end) {
        const paddedGrid = [];
        const H = GRID_HEIGHT + 2;
        const W = GRID_WIDTH + 2;
        for (let i = 0; i < H; i++) {
            paddedGrid.push(new Array(W).fill(false));
        }
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] !== null) {
                    paddedGrid[y + 1][x + 1] = true;
                }
            }
        }
        paddedGrid[start.y + 1][start.x + 1] = false;
        paddedGrid[end.y + 1][end.x + 1] = false;
        const queue = [[{ x: start.x + 1, y: start.y + 1 }, [], 0]];
        const visited = new Set();
        const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
        while (queue.length > 0) {
            const [currentPos, path, turns] = queue.shift();
            const key = `${currentPos.x},${currentPos.y}`;
            if (visited.has(key)) continue;
            visited.add(key);
            const newPath = [...path, currentPos];
            if (currentPos.x === end.x + 1 && currentPos.y === end.y + 1) {
                drawPath(newPath);
                return true;
            }
            if (turns > 2) continue;
            for (const dir of directions) {
                let nextX = currentPos.x + dir.x;
                let nextY = currentPos.y + dir.y;
                let newTurns = turns;
                if (path.length > 0) {
                    const prevPos = path[path.length - 1];
                    const prevDirX = currentPos.x - prevPos.x;
                    const prevDirY = currentPos.y - prevPos.y;
                    if (dir.x !== prevDirX || dir.y !== prevDirY) {
                        newTurns++;
                    }
                }
                if (newTurns > 2) continue;
                while (nextX >= 0 && nextX < W && nextY >= 0 && nextY < H) {
                    if (paddedGrid[nextY][nextX]) break;
                    const nextPos = { x: nextX, y: nextY };
                    if (!visited.has(`${nextX},${nextY}`)) {
                        queue.push([nextPos, newPath, newTurns]);
                    }
                    nextX += dir.x;
                    nextY += dir.y;
                }
            }
        }
        return false;
    }

    // --- VẼ ĐƯỜNG NỐI ---
    function drawPath(path) {
        let canvas = document.getElementById('path-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'path-canvas';
            gameBoard.appendChild(canvas);
        }
        const rect = gameBoard.getBoundingClientRect();
        const cellRect = gameBoard.querySelector('.cell:not(.hidden)')?.getBoundingClientRect();
        if (!cellRect) return;
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        const cellWidth = cellRect.width;
        const cellHeight = cellRect.height;
        const gap = 4;
        ctx.beginPath();
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const x = (point.x - 1) * (cellWidth + gap) + cellWidth / 2 + 5;
            const y = (point.y - 1) * (cellHeight + gap) + cellHeight / 2 + 5;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 300);
    }

    // --- ✅ THAY ĐỔI: CẬP NHẬT HÀM ÁP DỤNG GRAVITY ---
    function applyGravity() {
        const config = levelConfigs[(level - 1) % levelConfigs.length];
        if (config.gravity === 'none') return;

        switch (config.gravity) {
            case 'down':
                for (let x = 0; x < GRID_WIDTH; x++) {
                    let emptyRow = GRID_HEIGHT - 1;
                    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
                        if (grid[y][x] !== null) {
                            [grid[y][x], grid[emptyRow][x]] = [grid[emptyRow][x], grid[y][x]];
                            emptyRow--;
                        }
                    }
                }
                break;
            case 'up':
                for (let x = 0; x < GRID_WIDTH; x++) {
                    let emptyRow = 0;
                    for (let y = 0; y < GRID_HEIGHT; y++) {
                        if (grid[y][x] !== null) {
                            [grid[y][x], grid[emptyRow][x]] = [grid[emptyRow][x], grid[y][x]];
                            emptyRow++;
                        }
                    }
                }
                break;
            case 'left':
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    let emptyCol = 0;
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        if (grid[y][x] !== null) {
                            [grid[y][x], grid[y][emptyCol]] = [grid[y][emptyCol], grid[y][x]];
                            emptyCol++;
                        }
                    }
                }
                break;
            case 'right':
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    let emptyCol = GRID_WIDTH - 1;
                    for (let x = GRID_WIDTH - 1; x >= 0; x--) {
                        if (grid[y][x] !== null) {
                            [grid[y][x], grid[y][emptyCol]] = [grid[y][emptyCol], grid[y][x]];
                            emptyCol--;
                        }
                    }
                }
                break;
            case 'center-in-horizontal':
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    const rowItems = grid[y].filter(item => item !== null);
                    const newRow = new Array(GRID_WIDTH).fill(null);
                    const startIdx = Math.floor((GRID_WIDTH - rowItems.length) / 2);
                    for (let i = 0; i < rowItems.length; i++) {
                        newRow[startIdx + i] = rowItems[i];
                    }
                    grid[y] = newRow;
                }
                break;
            case 'center-out-horizontal':
                 for (let y = 0; y < GRID_HEIGHT; y++) {
                    const rowItems = grid[y].filter(item => item !== null);
                    const newRow = new Array(GRID_WIDTH).fill(null);
                    const half = Math.ceil(rowItems.length / 2);
                    const leftItems = rowItems.slice(0, half);
                    const rightItems = rowItems.slice(half);

                    for (let i = 0; i < leftItems.length; i++) {
                        newRow[i] = leftItems[i];
                    }
                    for (let i = 0; i < rightItems.length; i++) {
                        newRow[GRID_WIDTH - rightItems.length + i] = rightItems[i];
                    }
                    grid[y] = newRow;
                }
                break;
            case 'compress-vertical':
                {
                    const allItems = grid.flat().filter(item => item !== null);
                    grid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
                    let currentX = 0;
                    let currentY = GRID_HEIGHT - 1;
                    for(const item of allItems) {
                        grid[currentY][currentX] = item;
                        currentX++;
                        if (currentX >= GRID_WIDTH) {
                            currentX = 0;
                            currentY--;
                        }
                        if (currentY < 0) break;
                    }
                }
                break;
            case 'split-vertical':
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const colItems = [];
                    for (let y = 0; y < GRID_HEIGHT; y++) {
                        if (grid[y][x] !== null) {
                            colItems.push(grid[y][x]);
                        }
                    }
                    const midPoint = Math.ceil(colItems.length / 2);
                    const topItems = colItems.slice(0, midPoint);
                    const bottomItems = colItems.slice(midPoint);
                    
                    for (let y = 0; y < GRID_HEIGHT; y++) grid[y][x] = null;

                    for (let i = 0; i < topItems.length; i++) {
                        grid[i][x] = topItems[i];
                    }
                    for (let i = 0; i < bottomItems.length; i++) {
                        grid[GRID_HEIGHT - bottomItems.length + i][x] = bottomItems[i];
                    }
                }
                break;
            case 'split-horizontal':
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    const rowItems = grid[y].filter(item => item !== null);
                    const midPoint = Math.ceil(rowItems.length / 2);
                    const leftItems = rowItems.slice(0, midPoint);
                    const rightItems = rowItems.slice(midPoint);

                    grid[y] = new Array(GRID_WIDTH).fill(null);

                    for (let i = 0; i < leftItems.length; i++) {
                        grid[y][i] = leftItems[i];
                    }
                    for (let i = 0; i < rightItems.length; i++) {
                        grid[y][GRID_WIDTH - rightItems.length + i] = rightItems[i];
                    }
                }
                break;
            case 'quadrant-push':
                {
                    const midX = Math.floor(GRID_WIDTH / 2);
                    const midY = Math.floor(GRID_HEIGHT / 2);
                    const quadrants = {
                        tl: [], tr: [], bl: [], br: []
                    };

                    for (let y = 0; y < GRID_HEIGHT; y++) {
                        for (let x = 0; x < GRID_WIDTH; x++) {
                            if (grid[y][x] !== null) {
                                if (y < midY && x < midX) quadrants.tl.push(grid[y][x]);
                                else if (y < midY && x >= midX) quadrants.tr.push(grid[y][x]);
                                else if (y >= midY && x < midX) quadrants.bl.push(grid[y][x]);
                                else quadrants.br.push(grid[y][x]);
                            }
                        }
                    }

                    grid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));

                    let tl_idx = 0, tr_idx = 0, bl_idx = 0, br_idx = 0;

                    // Top-Left
                    for (let y = 0; y < midY; y++) for (let x = 0; x < midX; x++) if(tl_idx < quadrants.tl.length) grid[y][x] = quadrants.tl[tl_idx++];
                    // Top-Right
                    for (let y = 0; y < midY; y++) for (let x = GRID_WIDTH - 1; x >= midX; x--) if(tr_idx < quadrants.tr.length) grid[y][x] = quadrants.tr[tr_idx++];
                    // Bottom-Left
                    for (let y = GRID_HEIGHT - 1; y >= midY; y--) for (let x = 0; x < midX; x++) if(bl_idx < quadrants.bl.length) grid[y][x] = quadrants.bl[bl_idx++];
                    // Bottom-Right
                    for (let y = GRID_HEIGHT - 1; y >= midY; y--) for (let x = GRID_WIDTH - 1; x >= midX; x--) if(br_idx < quadrants.br.length) grid[y][x] = quadrants.br[br_idx++];
                }
                break;
        }
    }

    // --- XỬ LÝ XÁO TRỘN ---
    function handleShuffle() {
        if (shufflesLeft <= 0 || isPaused) return;
        playSound('shuffle', '2n');
        shufflesLeft--;
        let remainingIcons = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] !== null) {
                    remainingIcons.push(grid[y][x]);
                }
            }
        }
        for (let i = remainingIcons.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingIcons[i], remainingIcons[j]] = [remainingIcons[j], remainingIcons[i]];
        }
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (grid[y][x] !== null) {
                    grid[y][x] = remainingIcons.pop();
                }
            }
        }
        firstSelection = null;
        renderGrid();
        updateUI();
        checkAndShuffleIfStuck();
    }

    // --- KIỂM TRA XEM CÓ BỊ BÍ NƯỚC KHÔNG ---
    function checkAndShuffleIfStuck() {
        if (isStuck()) {
            setTimeout(() => {
                showTemporaryMessage("Không còn nước đi nào! Tự động xáo trộn.");
                handleShuffle();
            }, 500);
        }
    }

    function isStuck() {
        const positions = {};
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const icon = grid[y][x];
                if (icon !== null) {
                    if (!positions[icon]) positions[icon] = [];
                    positions[icon].push({ x, y });
                }
            }
        }
        for (const icon in positions) {
            const iconPositions = positions[icon];
            for (let i = 0; i < iconPositions.length; i++) {
                for (let j = i + 1; j < iconPositions.length; j++) {
                    if (findPath(iconPositions[i], iconPositions[j])) {
                        const canvas = document.getElementById('path-canvas');
                        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // --- HIỂN THỊ THÔNG BÁO TẠM THỜI ---
    function showTemporaryMessage(message) {
        modalTitle.textContent = "Thông báo";
        modalText.textContent = message;
        modalBtn.classList.add('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('hidden');
            modalBtn.classList.remove('hidden');
        }, 2000);
    }

    // --- BỘ ĐẾM THỜI GIAN ---
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (isPaused) return;
            timeLeft--;
            const widthPercentage = (timeLeft / TIME_PER_LEVEL) * 100;
            timeBar.style.width = `${widthPercentage}%`;
            if (timeLeft <= 0) {
                gameOver(false);
            }
        }, 1000);
    }

    // --- CẬP NHẬT GIAO DIỆN ---
    function updateUI() {
        levelDisplay.textContent = level;
        scoreDisplay.textContent = score;
        shufflesLeftDisplay.textContent = `(${shufflesLeft})`;
        shuffleBtn.disabled = shufflesLeft <= 0;
    }

    // --- XỬ LÝ ÂM THANH ---
    function playBGM() {
        if (hasInteracted && !isBgmMuted && !isMasterMuted) {
            bgm.src = BGM_TRACKS[currentBgmIndex];
            bgm.play().catch(e => console.log("Trình duyệt chặn tự động phát âm thanh."));
        }
    }

    function playNextTrack() {
        currentBgmIndex = (currentBgmIndex + 1) % BGM_TRACKS.length;
        playBGM();
    }

    function updateSoundControls() {
        if (isMasterMuted || isBgmMuted) {
            bgm.pause();
        } else {
            playBGM();
        }
        bgmToggleBtn.textContent = isBgmMuted || isMasterMuted ? '🎵❌' : '🎵';
        masterMuteBtn.textContent = isMasterMuted ? '🔇' : '🔊';
    }

    // --- KẾT THÚC GAME ---
    function gameOver(isWin) {
        clearInterval(timerInterval);
        isPaused = true;
        modal.classList.remove('hidden');
        deleteSave();
        if (isWin) {
            playSound('win', 'C6', '1n');
            modalTitle.textContent = `🎉 Chúc mừng! 🎉`;
            const bonusScore = Math.floor(timeLeft * 10);
            score += bonusScore;
            modalText.textContent = `Bạn đã hoàn thành màn ${level}. Điểm: ${score} (+${bonusScore} điểm thời gian)`;
            modalBtn.textContent = 'Chơi màn tiếp theo';
            modalBtn.onclick = () => {
                level++;
                modal.classList.add('hidden');
                startNewLevel();
            };
        } else {
            playSound('lose', 'C2', '1n');
            modalTitle.textContent = `😭 Hết giờ! 😭`;
            modalText.textContent = `Bạn đã thua ở màn ${level}. Tổng điểm: ${score}`;
            modalBtn.textContent = 'Chơi lại';
            modalBtn.onclick = () => {
                score = 0;
                level = 1;
                modal.classList.add('hidden');
                initGame();
            };
        }
    }

    // --- THÊM EVENT LISTENER ---
    startBtn.addEventListener('click', () => {
        deleteSave();
        score = 0;
        level = 1;
        startScreen.classList.add('not-start');
        gameContainer.classList.remove('not-start');
        hasInteracted = true;
        initGame();
    });
    saveBtn.addEventListener('click', saveGame);
    loadBtn.addEventListener('click', loadGame);
    shuffleBtn.addEventListener('click', handleShuffle);
    bgm.addEventListener('ended', playNextTrack);
    bgmToggleBtn.addEventListener('click', () => {
        isBgmMuted = !isBgmMuted;
        updateSoundControls();
    });
    masterMuteBtn.addEventListener('click', () => {
        isMasterMuted = !isMasterMuted;
        updateSoundControls();
    });
    window.addEventListener('resize', () => {
        let canvas = document.getElementById('path-canvas');
        if (canvas) {
            const rect = gameBoard.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    });

    // --- DEBUG EVENT LISTENERS ---
    if (DEBUG_MODE) {
        debugToolbar.classList.add('visible');
        debugWinBtn.addEventListener('click', () => gameOver(true));
        debugLoseBtn.addEventListener('click', () => gameOver(false));
        debugAddTimeBtn.addEventListener('click', () => {
            timeLeft = Math.min(timeLeft + 30, TIME_PER_LEVEL);
            const widthPercentage = (timeLeft / TIME_PER_LEVEL) * 100;
            timeBar.style.width = `${widthPercentage}%`;
        });
    }

    // --- BẮT ĐẦU TRÒ CHƠI ---
    if (DEBUG_MODE) {
       debugToolbar.classList.add('visible');
    }
    checkForSavedGame();
});
