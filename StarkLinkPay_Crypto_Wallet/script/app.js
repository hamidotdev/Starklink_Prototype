window.addEventListener("load", () => {
    const loaderContainer = document.getElementById("loader")
    const mainContainer = document.getElementById("main-content")
    setTimeout(()=> {
        loaderContainer.style.display = 'none'
        mainContainer.style.display = 'flex'
    }, 2500)
})

// const createWalletBtn = document.getElementById('createWallet')

// // function showPage(pageId) {

// //     document.getElementById(pageId).classList.add('active')
// // }

// createWalletBtn.addEventListener('click', function(){
//     const pages = document.querySelectorAll('.page')
//     pages.forEach(page => {
//         page.classList.remove('active')})

//     const dashboard = document.getElementById("dashboardContainer")
//     dashboard.classList.add('active')
// })






























class QRCodeGenerator {
    constructor() {
        this.modules = [];
        this.moduleCount = 0;
    }

    generate(text, size = 200) {
        // Generate QR matrix
        this.makeCode(text);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const cellSize = Math.floor(size / this.moduleCount);
        const canvasSize = cellSize * this.moduleCount;
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Draw QR code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        ctx.fillStyle = '#2c3e50';
        
        for (let row = 0; row < this.moduleCount; row++) {
            for (let col = 0; col < this.moduleCount; col++) {
                if (this.modules[row][col]) {
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
        }
        
        return canvas;
    }

    makeCode(text) {
        this.moduleCount = 21; // Version 1 QR code
        this.setupPositionProbePattern(0, 0);
        this.setupPositionProbePattern(this.moduleCount - 7, 0);
        this.setupPositionProbePattern(0, this.moduleCount - 7);
        this.setupPositionAdjustPattern();
        this.setupTimingPattern();
        this.setupTypeInfo();
        this.mapData(text);
    }

    setupPositionProbePattern(row, col) {
        if (!this.modules[row]) this.modules[row] = [];
        
        for (let r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r) continue;
            
            for (let c = -1; c <= 7; c++) {
                if (col + c <= -1 || this.moduleCount <= col + c) continue;
                
                if (!this.modules[row + r]) this.modules[row + r] = [];
                
                if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                    (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                    (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                    this.modules[row + r][col + c] = true;
                } else {
                    this.modules[row + r][col + c] = false;
                }
            }
        }
    }

    setupPositionAdjustPattern() {
        // No position adjust pattern for version 1
    }

    setupTimingPattern() {
        for (let r = 8; r < this.moduleCount - 8; r++) {
            if (!this.modules[r]) this.modules[r] = [];
            if (!this.modules[6]) this.modules[6] = [];
            
            this.modules[r][6] = (r % 2 == 0);
            this.modules[6][r] = (r % 2 == 0);
        }
    }

    setupTypeInfo() {
        // Simplified type info setup
        const data = 0x5412; // Error correction level M, mask pattern 0
        
        for (let i = 0; i < 15; i++) {
            const mod = ((data >> i) & 1) == 1;
            
            if (i < 6) {
                if (!this.modules[i]) this.modules[i] = [];
                this.modules[i][8] = mod;
            } else if (i < 8) {
                if (!this.modules[i + 1]) this.modules[i + 1] = [];
                this.modules[i + 1][8] = mod;
            } else {
                if (!this.modules[this.moduleCount - 15 + i]) this.modules[this.moduleCount - 15 + i] = [];
                this.modules[this.moduleCount - 15 + i][8] = mod;
            }
            
            if (i < 8) {
                if (!this.modules[8]) this.modules[8] = [];
                this.modules[8][this.moduleCount - i - 1] = mod;
            } else if (i < 9) {
                if (!this.modules[8]) this.modules[8] = [];
                this.modules[8][15 - i - 1 + 1] = mod;
            } else {
                if (!this.modules[8]) this.modules[8] = [];
                this.modules[8][15 - i - 1] = mod;
            }
        }
        
        // Dark module
        if (!this.modules[this.moduleCount - 8]) this.modules[this.moduleCount - 8] = [];
        this.modules[this.moduleCount - 8][8] = true;
    }

    mapData(text) {
        // Simplified data mapping - creates a basic pattern
        const bytes = this.stringToBytes(text);
        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        
        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col == 6) col--;
            
            while (true) {
                for (let c = 0; c < 2; c++) {
                    if (!this.modules[row]) this.modules[row] = [];
                    
                    if (this.modules[row][col - c] === undefined) {
                        let dark = false;
                        
                        if (byteIndex < bytes.length) {
                            dark = (((bytes[byteIndex] >>> bitIndex) & 1) == 1);
                        }
                        
                        if ((row + col - c) % 2 == 1) {
                            dark = !dark;
                        }
                        
                        this.modules[row][col - c] = dark;
                        bitIndex--;
                        
                        if (bitIndex == -1) {
                            byteIndex++;
                            bitIndex = 7;
                        }
                    }
                }
                
                row += inc;
                
                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }

    stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 128) {
                bytes.push(c);
            } else if (c < 2048) {
                bytes.push(192 | (c >> 6));
                bytes.push(128 | (c & 63));
            } else {
                bytes.push(224 | (c >> 12));
                bytes.push(128 | ((c >> 6) & 63));
                bytes.push(128 | (c & 63));
            }
        }
        return bytes;
    }
}


const qrGenerator = new QRCodeGenerator()