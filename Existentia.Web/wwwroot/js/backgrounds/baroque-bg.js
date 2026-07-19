(() => {
    const NODE_COUNT = 50;
    const CONNECTION_DIST = 300;

    let canvas, ctx, W, H;
    let animation = null;
    let nodes = [];
    let timeCount = 0;
    let palette = { trail: [20, 14, 8, 0.06], connection: [46, 111, 64], initial: '#000000' };

    class BaroqueNode {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = 0.15 + Math.random() * 0.35;
            this.time = Math.random() * 100;
            this.timeSpeed = 0.004 + Math.random() * 0.008;
        }

        update() {
            this.time += this.timeSpeed;
            this.x += Math.cos(this.angle + Math.sin(this.time)) * this.speed;
            this.y += Math.sin(this.angle + Math.cos(this.time)) * this.speed;
            if (this.x < -100) this.x = W + 100;
            if (this.x > W + 100) this.x = -100;
            if (this.y < -100) this.y = H + 100;
            if (this.y > H + 100) this.y = -100;
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
        W = newW;
        H = newH;
        canvas.width = expectedW;
        canvas.height = expectedH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render() {
        timeCount++;
        const t = palette.trail;
        ctx.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},${t[3]})`;
        ctx.fillRect(0, 0, W, H);

        for (const n of nodes) n.update();

        const conn = palette.connection;
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.3;
                    ctx.strokeStyle = `rgba(${conn[0]},${conn[1]},${conn[2]},${alpha})`;
                    ctx.lineWidth = (1 - dist / CONNECTION_DIST) * 1.8;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    const cpx = (a.x + b.x) / 2 + Math.sin(a.time + b.time) * 50;
                    const cpy = (a.y + b.y) / 2 + Math.cos(a.time - b.time) * 50;
                    ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        animation = requestAnimationFrame(render);
    }

    window.baroqueBackground = {
        start(p) {
            if (animation) return;

            canvas = document.getElementById("bg-canvas");
            if (!canvas) return;

            if (p) palette = p;
            ctx = canvas.getContext("2d");

            nodes.length = 0;
            W = window.innerWidth;
            H = window.innerHeight;
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes.push(new BaroqueNode());
            }

            resize();
            ctx.fillStyle = palette.initial;
            ctx.fillRect(0, 0, W, H);

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
            window.removeEventListener("resize", resize);
        },

        updatePalette(p) {
            if (p) palette = p;
        }
    };
})();
