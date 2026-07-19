(() => {
    const CONFIG = {
        count: 70,
        mouseRadius: 150,
        mouseForce: 0.3,
        speed: 0.2
    };

    let canvas;
    let ctx;
    let W, H;
    let animation;
    let mouse = { x: -9999, y: -9999 };
    const elements = [];
    let palette = { color: [255, 255, 255], opacityMin: 0.04, opacityMax: 0.1 };

    function onMouseMove(e) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onMouseLeave() { mouse.x = -9999; mouse.y = -9999; }

    class ManjiNode {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.originX = this.x;
            this.originY = this.y;
            this.vx = (Math.random() - 0.5) * CONFIG.speed;
            this.vy = (Math.random() - 0.5) * CONFIG.speed;
            this.driftPhase = Math.random() * Math.PI * 2;
            this.driftFreq = 0.0005 + Math.random() * 0.0015;
            this.driftAmp = 0.05 + Math.random() * 0.05;
            this.size = 40 + Math.random() * 120;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.005;
            this.opacity = palette.opacityMin + Math.random() * (palette.opacityMax - palette.opacityMin);
        }

        update(time) {
            this.rotation += this.rotationSpeed;
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseRadius && dist > 0) {
                const force = ((CONFIG.mouseRadius - dist) / CONFIG.mouseRadius) * CONFIG.mouseForce;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }
            this.vx += Math.sin(time * this.driftFreq + this.driftPhase) * this.driftAmp;
            this.vy += Math.cos(time * this.driftFreq + this.driftPhase) * this.driftAmp;
            const ox = this.originX - this.x;
            const oy = this.originY - this.y;
            if (Math.abs(ox) > 50 || Math.abs(oy) > 50) {
                this.vx += ox * 0.001;
                this.vy += oy * 0.001;
            }
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;
            const speedSq = this.vx * this.vx + this.vy * this.vy;
            if (speedSq > CONFIG.speed * CONFIG.speed) {
                const speed = Math.sqrt(speedSq);
                this.vx = (this.vx / speed) * CONFIG.speed;
                this.vy = (this.vy / speed) * CONFIG.speed;
            }
            if (this.x < -100) { this.x = -100; this.vx *= -0.5; }
            if (this.x > W + 100) { this.x = W + 100; this.vx *= -0.5; }
            if (this.y < -100) { this.y = -100; this.vy *= -0.5; }
            if (this.y > H + 100) { this.y = H + 100; this.vy *= -0.5; }
        }

        draw() {
            const c = palette.color;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${this.opacity})`;
            ctx.lineWidth = 2.5;

            const arm = this.size * 0.35;
            const bend = this.size * 0.25;

            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(arm, 0);
                ctx.lineTo(arm, -bend);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }

    let lastW = 0, lastH = 0;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        const expectedW = newW * dpr;
        const expectedH = newH * dpr;
        if (newW === lastW && newH === lastH && canvas.width === expectedW && canvas.height === expectedH) return;
        lastW = newW;
        lastH = newH;
        const oldW = W || newW;
        const oldH = H || newH;
        W = newW;
        H = newH;
        canvas.width = expectedW;
        canvas.height = expectedH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const e of elements) {
            e.x = (e.x / oldW) * W;
            e.y = (e.y / oldH) * H;
            e.originX = (e.originX / oldW) * W;
            e.originY = (e.originY / oldH) * H;
        }
    }

    let timeCount = 0;

    function render() {
        timeCount++;
        ctx.clearRect(0, 0, W, H);

        for (const el of elements) {
            el.update(timeCount);
        }

        for (const el of elements) {
            el.draw();
        }

        animation = requestAnimationFrame(render);
    }

    window.buddhaBackground = {
        start(p) {
            if (animation) return;

            canvas = document.getElementById("bg-canvas");
            if (!canvas) return;

            if (p) palette = p;
            ctx = canvas.getContext("2d");

            elements.length = 0;
            W = window.innerWidth;
            H = window.innerHeight;

            for (let i = 0; i < CONFIG.count; i++) {
                elements.push(new ManjiNode());
            }

            resize();
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseleave", onMouseLeave);
            window.addEventListener("resize", resize);
            render();
        },

        stop() {
            if (animation) {
                cancelAnimationFrame(animation);
                animation = null;
            }
            lastW = 0;
            lastH = 0;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeave);
            window.removeEventListener("resize", resize);
        },

        updatePalette(p) {
            if (p) palette = p;
        },

        destroy() {
            this.stop();
            elements.length = 0;
        }
    };
})();
