/**
 * Ashfall Background — Implementação Three.js Shader
 * Adaptado do arquivo original ashfall.zip para a arquitetura Existentia.
 */
(() => {
    let camera, scene, renderer, uniforms, mesh;
    let texture;
    let running = false;
    let canvas = null;

    const vertexShader = `
        void main() {
            gl_Position = vec4( position, 1.0 );
        }
    `;

    const fragmentShader = `
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform sampler2D u_noise;
        
        #define PI 3.141592653589793
        #define TAU 6.
        
        const float multiplier = 15.5;
        const float zoomSpeed = 10.;
        const int layers = 10;
        const int octaves = 5;

        vec2 hash2(vec2 p) {
            vec2 o = texture2D( u_noise, (p+0.5)/256.0, -100.0 ).xy;
            return o;
        }
        
        mat2 rotate2d(float _angle){
            return mat2(cos(_angle),sin(_angle),
                        -sin(_angle),cos(_angle));
        }
        
        vec3 hsb2rgb( in vec3 c ){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                     6.0)-3.0)-1.0,
                             0.0,
                             1.0 );
            rgb = rgb*rgb*(3.0-2.0*rgb);
            return c.z * mix( vec3(1.0), rgb, c.y);
        }
        
        float hash(vec2 p) {
            float o = texture2D( u_noise, (p+0.5)/256.0, -100.0 ).x;
            return o;
        }

        float noise(vec2 uv) {
            vec2 id = floor(uv);
            vec2 subuv = fract(uv);
            vec2 u = subuv * subuv * (3. - 2. * subuv);
            float a = hash(id);
            float b = hash(id + vec2(1., 0.));
            float c = hash(id + vec2(0., 1.));
            float d = hash(id + vec2(1., 1.));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(in vec2 uv) {
            float s = .0;
            float m = .0;
            float a = .5;
            for(int i = 0; i < octaves; i++) {
                s += a * noise(uv);
                m += a;
                a *= .5;
                uv *= 2.;
            }
            return s / m;
        }
        
        vec3 domain(vec2 z){
            return vec3(hsb2rgb(vec3(atan(z.y,z.x)/TAU,1.,1.)));
        }

        vec3 render(vec2 uv, float scale) {
            vec2 id = floor(uv);
            vec2 subuv = fract(uv);
            vec2 rand = hash2(id);
            float bokeh = abs(scale) * 1.;
            float particle = 0.;
            
            if(length(rand) > 1.3) {
                vec2 pos = subuv-.5;
                float field = length(pos);
                particle = smoothstep(.3, 0., field);
                particle += smoothstep(.4 * bokeh, 0.34 * bokeh, field);
            }
            return vec3(particle*2.);
        }
        
        vec3 renderLayer(int layer, int layers, vec2 uv, inout float opacity, float n) {
            float scale = mod((u_time + zoomSpeed / float(layers) * float(layer)) / zoomSpeed, -1.);
            uv *= 20.; 
            uv *= scale*scale;
            uv = rotate2d(u_time / 10.) * uv;
            uv += vec2(25. + sin(u_time*.1)) * float(layer);

            vec3 pass = render(uv * multiplier, scale) * .2;
            opacity = 1. + scale;
            float _opacity = opacity;
            float endOpacity = smoothstep(0., 0.4, scale * -1.);
            opacity += endOpacity;

            return pass * _opacity * endOpacity;
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy);
            if(u_resolution.y < u_resolution.x) {
                uv /= u_resolution.y;
            } else {
                uv /= u_resolution.x;
            }

            float n = fbm((uv + vec2(sin(u_time*.1), u_time*.1)) * 2. - 2.);
            vec3 colour = n * mix(vec3(0., .5, 1.5)*-1.5, clamp(vec3(1., .5, .25)*2., 0., 1.), n);

            float opacity = 1.;
            float opacity_sum = 1.;

            for(int i = 1; i <= layers; i++) {
                colour -= renderLayer(i, layers, uv, opacity, n);
                opacity_sum += opacity;
            }

            colour /= opacity_sum;
            gl_FragColor = vec4(clamp(colour * 20., 0., 1.), 1.0);
        }
    `;

    function init() {
        if (!canvas) return;

        camera = new THREE.Camera();
        camera.position.z = 1;
        scene = new THREE.Scene();

        const geometry = new THREE.PlaneBufferGeometry(2, 2);
        uniforms = {
            u_time: { type: "f", value: 1.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2() },
            u_noise: { type: "t", value: texture },
            u_mouse: { type: "v2", value: new THREE.Vector2() }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
        material.extensions.derivatives = true;

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        
        onResize();
    }

    function onResize() {
        if (!renderer || !uniforms) return;
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        uniforms.u_resolution.value.x = canvas.width;
        uniforms.u_resolution.value.y = canvas.height;
    }

    function animate(delta) {
        if (!running) return;
        requestAnimationFrame(animate);
        
        uniforms.u_time.value = -10000 + delta * 0.0005;
        renderer.render(scene, camera);
    }

    function onPointerMove(e) {
        if (!uniforms) return;
        let ratio = window.innerHeight / window.innerWidth;
        uniforms.u_mouse.value.x = (e.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
        uniforms.u_mouse.value.y = (e.pageY - window.innerHeight / 2) / window.innerHeight * -1;
    }

    window.ashfallBackground = {
        start: function(c, palette) {
            if (running) return;
            canvas = c;
            running = true;

            const startEffect = () => {
                init();
                window.addEventListener('resize', onResize);
                document.addEventListener('pointermove', onPointerMove);
                requestAnimationFrame(animate);
            };

            if (!texture) {
                const loader = new THREE.TextureLoader();
                loader.load('img/noise.png', (tex) => {
                    texture = tex;
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    startEffect();
                });
            } else {
                startEffect();
            }
        },
        stop: function() {
            running = false;
            window.removeEventListener('resize', onResize);
            document.removeEventListener('pointermove', onPointerMove);
            if (renderer) {
                renderer.dispose();
                renderer = null;
            }
            if (scene) {
                scene.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                scene = null;
            }
            canvas = null;
        },
        updatePalette: function(palette) {
            // Ashfall usa cores fixas no shader original, 
            // mas poderíamos injetar cores da paleta aqui se necessário.
        }
    };
})();
