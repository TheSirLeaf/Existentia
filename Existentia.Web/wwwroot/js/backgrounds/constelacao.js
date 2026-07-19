class Constelacao {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = Object.assign({
            count: 80,
            speed: 0.3,
            radius: 1.5,
            connectionDistance: 150,
            lineWidth: 0.6,
            color: '#7c6fcc',
            mouseRadius: 120,
            mouseForce: 0.4,
            repulsive: true,
            originForce: 0.002,
            maxConnections: 3,
        }, config);
        this.config.connectionDistanceSq = this.config.connectionDistance * this.config.connectionDistance;

        this.points = [];
        this.overlay = null;
        this.mouse = { x: -9999, y: -9999 };
        this.animationId = null;
        this.running = false;
        this.time = 0;

        this.resize();
        this.initPoints();
        this.initOverlay();
        this.bindEvents();
    }

    initPoints() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (let i = 0; i < this.config.count; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            this.points.push({
                x: x,
                y: y,
                originX: x,
                originY: y,
                vx: (Math.random() - 0.5) * this.config.speed,
                vy: (Math.random() - 0.5) * this.config.speed,
                driftPhase: Math.random() * Math.PI * 2,
                driftFreq: 0.0005 + Math.random() * 0.0015,
                driftAmp: 0.05 + Math.random() * 0.05,
            });
        }
    }

    initOverlay() {
        if (!this.config.overlay) return;
        var preset = (typeof CONSTELACAO_PRESETS !== 'undefined') ? CONSTELACAO_PRESETS[this.config.overlay] : null;
        if (!preset) return;

        if (preset.type === '3d') {
            this.initOverlay3D(preset);
        } else if (preset.points) {
            this.initOverlay2D(preset);
        }
    }

    initOverlay2D(preset) {
        var offX = preset.offsetX || 0.5;
        var offY = preset.offsetY || 0.5;
        var sc = preset.scale || 0.35;
        var w = window.innerWidth;
        var h = window.innerHeight;

        this.overlay = {
            type: '2d',
            points: [],
            color: preset.color || '#e8a040',
            radius: preset.radius || 2,
            lineWidth: preset.lineWidth || 0.8,
            connectionDistance: (preset.connectionDistance || 0.07) * w,
            connectionDistanceSq: Math.pow((preset.connectionDistance || 0.07) * w, 2),
            maxConnections: preset.maxConnections || 4,
            highlights: preset.highlights || null,
        };

        for (var i = 0; i < preset.points.length; i++) {
            var p = preset.points[i];
            var x = (p.x * sc + offX) * w;
            var y = (p.y * sc + offY) * h;
            this.overlay.points.push({
                x: x, y: y,
                originX: x, originY: y,
                vx: 0, vy: 0,
                driftPhase: Math.random() * Math.PI * 2,
                driftFreq: 0.0002 + Math.random() * 0.0005,
                driftAmp: 0.005 + Math.random() * 0.005,
            });
        }
    }

    initOverlay3D(preset) {
        this.overlay = {
            type: '3d',
            points3d: preset.points3d || [],
            edges: preset.edges || [],
            points2d: [],
            color: preset.color || '#7c6fcc',
            radius: preset.radius || 1.5,
            lineWidth: preset.lineWidth || 0.5,
            offsetX: preset.offsetX || 0.5,
            offsetY: preset.offsetY || 0.5,
            scale: preset.scale || 0.12,
            perspective: preset.perspective || 800,
            rotationSpeedX: preset.rotationSpeedX || 0.004,
            rotationSpeedY: preset.rotationSpeedY || 0.006,
            rotX: 0,
            rotY: 0,
        };

        for (var i = 0; i < this.overlay.points3d.length; i++) {
            this.overlay.points2d.push({ x: 0, y: 0 });
        }
    }

    updateOverlay() {
        if (!this.overlay) return;

        if (this.overlay.type === '3d') {
            this.updateOverlay3D();
        } else {
            this.updateOverlay2D();
        }
    }

    updateOverlay2D() {
        var t = this.time;
        for (var i = 0; i < this.overlay.points.length; i++) {
            var p = this.overlay.points[i];
            p.vx += Math.sin(t * p.driftFreq + p.driftPhase) * p.driftAmp;
            p.vy += Math.cos(t * p.driftFreq + p.driftPhase) * p.driftAmp;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            var ox = p.originX - p.x;
            var oy = p.originY - p.y;
            if (Math.abs(ox) > 0.5 || Math.abs(oy) > 0.5) {
                p.vx += ox * 0.01;
                p.vy += oy * 0.01;
            }
        }
    }

    updateOverlay3D() {
        var ov = this.overlay;
        ov.rotX += ov.rotationSpeedX;
        ov.rotY += ov.rotationSpeedY;

        var cosX = Math.cos(ov.rotX), sinX = Math.sin(ov.rotX);
        var cosY = Math.cos(ov.rotY), sinY = Math.sin(ov.rotY);
        var w = window.innerWidth;
        var h = window.innerHeight;
        var cx = ov.offsetX * w;
        var cy = ov.offsetY * h;
        var s = ov.scale * Math.min(w, h);
        var persp = ov.perspective;

        for (var i = 0; i < ov.points3d.length; i++) {
            var p = ov.points3d[i];
            var x1 = p.x * cosY - p.z * sinY;
            var z1 = p.x * sinY + p.z * cosY;
            var y1 = p.y;
            var y2 = y1 * cosX - z1 * sinX;
            var z2 = y1 * sinX + z1 * cosX;
            var scale2d = persp / (persp + z2);
            ov.points2d[i].x = cx + x1 * s * scale2d;
            ov.points2d[i].y = cy + y2 * s * scale2d;
        }
    }

    drawOverlay() {
        if (!this.overlay) return;

        if (this.overlay.type === '3d') {
            this.drawOverlay3D();
        } else {
            this.drawOverlay2D();
        }
    }

    drawOverlay2D() {
        var ctx = this.ctx;
        var ov = this.overlay;
        var pts = ov.points;
        var connDistSq = ov.connectionDistanceSq;
        var drawn = new Set();

        for (var i = 0; i < pts.length; i++) {
            var a = pts[i];
            var neighbors = [];
            for (var j = 0; j < pts.length; j++) {
                if (i === j) continue;
                var b = pts[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var distSq = dx * dx + dy * dy;
                if (distSq < connDistSq) {
                    var dist = Math.sqrt(distSq);
                    neighbors.push({ idx: j, dist: dist });
                }
            }
            neighbors.sort(function (a, b) { return a.dist - b.dist; });
            var connected = 0;
            for (var k = 0; k < neighbors.length; k++) {
                var n = neighbors[k];
                var key = i < n.idx ? i + '-' + n.idx : n.idx + '-' + i;
                if (drawn.has(key)) continue;
                drawn.add(key);
                connected++;
                var b = pts[n.idx];
                var opacity = (1 - n.dist / ov.connectionDistance) * 0.5;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = ov.color;
                ctx.globalAlpha = opacity;
                ctx.lineWidth = ov.lineWidth;
                ctx.stroke();
                if (connected >= ov.maxConnections) break;
            }
        }
        ctx.globalAlpha = 1;

        for (var i = 0; i < pts.length; i++) {
            var p = pts[i];
            var hl = ov.highlights;
            var radius = ov.radius;
            var color = ov.color;
            if (hl) {
                for (var h = 0; h < hl.length; h++) {
                    if (hl[h].idx === i) {
                        radius = hl[h].radius;
                        color = hl[h].color;
                        break;
                    }
                }
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    drawOverlay3D() {
        var ctx = this.ctx;
        var ov = this.overlay;
        var pts = ov.points2d;

        ctx.shadowBlur = 8;
        ctx.shadowColor = ov.color;

        for (var e = 0; e < ov.edges.length; e++) {
            var i = ov.edges[e][0];
            var j = ov.edges[e][1];
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = ov.color;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = ov.lineWidth * 4;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        for (var i = 0; i < pts.length; i++) {
            ctx.beginPath();
            ctx.arc(pts[i].x, pts[i].y, ov.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = ov.color;
            ctx.globalAlpha = 0.25;
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
    }

    bindEvents() {
        this._onResize = () => this.resize();
        this._onMouseMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
        this._onMouseLeave = () => { this.mouse.x = -9999; this.mouse.y = -9999; };
        window.addEventListener('resize', this._onResize);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseleave', this._onMouseLeave);
    }

    unbindEvents() {
        window.removeEventListener('resize', this._onResize);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseleave', this._onMouseLeave);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const expectedW = w * dpr;
        const expectedH = h * dpr;
        if (w === this._lastW && h === this._lastH && this.canvas.width === expectedW && this.canvas.height === expectedH) return;
        this._lastW = w;
        this._lastH = h;
        const oldW = this.canvas.width / dpr || w;
        const oldH = this.canvas.height / dpr || h;
        this.canvas.width = expectedW;
        this.canvas.height = expectedH;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        for (const p of this.points) {
            p.x = (p.x / oldW) * w;
            p.y = (p.y / oldH) * h;
            p.originX = (p.originX / oldW) * w;
            p.originY = (p.originY / oldH) * h;
        }

        if (this.overlay) {
            if (this.overlay.type === '2d') {
                for (const p of this.overlay.points) {
                    p.x = (p.x / oldW) * w;
                    p.y = (p.y / oldH) * h;
                    p.originX = (p.originX / oldW) * w;
                    p.originY = (p.originY / oldH) * h;
                }
                this.overlay.connectionDistance = (this.overlay.connectionDistance / oldW) * w;
                this.overlay.connectionDistanceSq = this.overlay.connectionDistance * this.overlay.connectionDistance;
            }
        }
    }

    update() {
        const cfg = this.config;
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.time++;

        for (const p of this.points) {
            const t = this.time;
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cfg.mouseRadius && dist > 0) {
                const force = ((cfg.mouseRadius - dist) / cfg.mouseRadius) * cfg.mouseForce;
                if (cfg.repulsive) {
                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;
                } else {
                    p.vx -= (dx / dist) * force;
                    p.vy -= (dy / dist) * force;
                }
            }

            p.vx += Math.sin(t * p.driftFreq + p.driftPhase) * p.driftAmp;
            p.vy += Math.cos(t * p.driftFreq + p.driftPhase) * p.driftAmp;

            const ox = p.originX - p.x;
            const oy = p.originY - p.y;
            if (Math.abs(ox) > 1 || Math.abs(oy) > 1) {
                p.vx += ox * cfg.originForce;
                p.vy += oy * cfg.originForce;
            }

            p.x += p.vx;
            p.y += p.vy;

            p.vx *= 0.98;
            p.vy *= 0.98;

            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > cfg.speed) {
                p.vx = (p.vx / speed) * cfg.speed;
                p.vy = (p.vy / speed) * cfg.speed;
            }

                if (p.x < -50) { p.x = -50; p.vx *= -0.5; }
            if (p.x > w + 50) { p.x = w + 50; p.vx *= -0.5; }
            if (p.y < -50) { p.y = -50; p.vy *= -0.5; }
            if (p.y > h + 50) { p.y = h + 50; p.vy *= -0.5; }
        }

        this.updateOverlay();
    }

    draw() {
        const ctx = this.ctx;
        const cfg = this.config;
        const w = window.innerWidth;
        const h = window.innerHeight;

        ctx.clearRect(0, 0, w, h);

        const connDistSq = cfg.connectionDistanceSq;
        const drawn = new Set();

        for (let i = 0; i < this.points.length; i++) {
            const a = this.points[i];
            const neighbors = [];

            for (let j = 0; j < this.points.length; j++) {
                if (i === j) continue;
                const b = this.points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < connDistSq) {
                    var dist = Math.sqrt(distSq);
                    neighbors.push({ idx: j, dist: dist });
                }
            }

            neighbors.sort((a, b) => a.dist - b.dist);

            let connected = 0;
            for (const n of neighbors) {
                const key = i < n.idx ? i + '-' + n.idx : n.idx + '-' + i;
                if (drawn.has(key)) continue;

                drawn.add(key);
                connected++;

                const b = this.points[n.idx];
                const opacity = (1 - n.dist / cfg.connectionDistance) * 0.5;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = cfg.color;
                ctx.globalAlpha = opacity;
                ctx.lineWidth = cfg.lineWidth;
                ctx.stroke();

                if (connected >= cfg.maxConnections) break;
            }
        }
        ctx.globalAlpha = 1;

        for (const p of this.points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, cfg.radius, 0, Math.PI * 2);
            ctx.fillStyle = cfg.color;
            ctx.fill();
        }

        this.drawOverlay();
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    start() {
        this.running = true;
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

window.constelacaoBackground = {
    _instance: null,

    start(canvas, palette) {
        if (this._instance) return;
        var cfg = palette ? { color: palette.color } : {};
        this._instance = new Constelacao(canvas, cfg);
        this._instance._lastW = 0;
        this._instance._lastH = 0;
        this._instance.start();
    },

    stop() {
        if (this._instance) {
            this._instance.unbindEvents();
            this._instance.stop();
            this._instance = null;
        }
    },

    updatePalette(p) {
        if (this._instance && p) {
            this._instance.config.color = p.color;
        }
    }
};
