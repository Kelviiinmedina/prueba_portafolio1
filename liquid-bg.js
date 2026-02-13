
// TouchTexture class handles the distortion map based on mouse movement
class TouchTexture {
    constructor() {
        this.size = 64;
        this.width = this.height = this.size;
        this.maxAge = 64;
        this.radius = 0.25 * this.size;
        this.speed = 1 / this.maxAge;
        this.trail = [];
        this.last = null;
        this.initTexture();
    }

    initTexture() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.texture = new THREE.Texture(this.canvas);
    }

    update() {
        this.clear();
        let speed = this.speed;
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const point = this.trail[i];
            let f = point.force * speed * (1 - point.age / this.maxAge);
            point.x += point.vx * f;
            point.y += point.vy * f;
            point.age++;
            if (point.age > this.maxAge) {
                this.trail.splice(i, 1);
            } else {
                this.drawPoint(point);
            }
        }
        this.texture.needsUpdate = true;
    }

    clear() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addTouch(point) {
        let force = 0;
        let vx = 0;
        let vy = 0;
        const last = this.last;
        if (last) {
            const dx = point.x - last.x;
            const dy = point.y - last.y;
            if (dx === 0 && dy === 0) return;
            const dd = dx * dx + dy * dy;
            let d = Math.sqrt(dd);
            vx = dx / d;
            vy = dy / d;
            force = Math.min(dd * 20000, 2.0);
        }
        this.last = { x: point.x, y: point.y };
        this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
    }

    drawPoint(point) {
        const pos = {
            x: point.x * this.width,
            y: (1 - point.y) * this.height
        };

        let intensity = 1;
        if (point.age < this.maxAge * 0.3) {
            intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
        } else {
            const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
            intensity = -t * (t - 2);
        }
        intensity *= point.force;

        const radius = this.radius;
        let color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255
            }, ${intensity * 255}`;
        let offset = this.size * 5;
        this.ctx.shadowOffsetX = offset;
        this.ctx.shadowOffsetY = offset;
        this.ctx.shadowBlur = radius * 1;
        this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

        this.ctx.beginPath();
        this.ctx.fillStyle = "rgba(255,0,0,1)";
        this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

class GradientBackground {
    constructor(app) {
        this.app = app;
        this.mesh = null;
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            // Fixed scheme colors for CV: Red Accents + Dark Base
            uColor1: { value: new THREE.Vector3(0.62, 0.13, 0.03) }, // #9F2207 - Deep Red
            uColor2: { value: new THREE.Vector3(0.01, 0.01, 0.02) }, // Near Black
            uColor3: { value: new THREE.Vector3(0.72, 0.16, 0.03) }, // Slightly lighter red
            uColor4: { value: new THREE.Vector3(0.05, 0.02, 0.01) }, // Very dark warm
            uColor5: { value: new THREE.Vector3(0.62, 0.13, 0.03) },
            uColor6: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
            uSpeed: { value: 0.8 },
            uIntensity: { value: 1.5 },
            uTouchTexture: { value: null },
            uGrainIntensity: { value: 0.05 },
            uZoom: { value: 1.0 },
            uDarkNavy: { value: new THREE.Vector3(0.0, 0.0, 0.0) }, // Pure black base for CV
            uGradientSize: { value: 0.6 },
            uGradientCount: { value: 8.0 },
            uColor1Weight: { value: 0.7 },
            uColor2Weight: { value: 1.2 }
        };
    }

    init() {
        const viewSize = this.app.getViewSize();
        const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
            varying vec2 vUv;
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              vUv = uv;
            }
          `,
            fragmentShader: `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            uniform vec3 uColor5;
            uniform vec3 uColor6;
            uniform float uSpeed;
            uniform float uIntensity;
            uniform sampler2D uTouchTexture;
            uniform float uGrainIntensity;
            uniform vec3 uDarkNavy;
            uniform float uGradientSize;
            uniform float uGradientCount;
            uniform float uColor1Weight;
            uniform float uColor2Weight;
            
            varying vec2 vUv;
            
            float grain(vec2 uv, float time) {
              vec2 grainUv = uv * uResolution * 0.5;
              float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
              return grainValue * 2.0 - 1.0;
            }
            
            vec3 getGradientColor(vec2 uv, float time) {
              float gradientRadius = uGradientSize;
              
              vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
              vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
              vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
              vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
              
              float dist1 = length(uv - center1);
              float dist2 = length(uv - center2);
              float dist3 = length(uv - center3);
              float dist4 = length(uv - center4);
              
              float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
              float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
              float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
              float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
              
              vec3 color = vec3(0.0);
              color += uColor1 * influence1 * (0.6 + 0.4 * sin(time * uSpeed)) * uColor1Weight;
              color += uColor2 * influence2 * (0.6 + 0.4 * cos(time * uSpeed * 1.2)) * uColor2Weight;
              color += uColor3 * influence3 * (0.6 + 0.4 * sin(time * uSpeed * 0.8)) * uColor1Weight;
              color += uColor4 * influence4 * (0.6 + 0.4 * cos(time * uSpeed * 1.3)) * uColor2Weight;
              
              color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
              float brightness = length(color);
              color = mix(uDarkNavy, color, max(brightness * 1.2, 0.1));
              
              return color;
            }
            
            void main() {
              vec2 uv = vUv;
              vec4 touchTex = texture2D(uTouchTexture, uv);
              float vx = -(touchTex.r * 2.0 - 1.0);
              float vy = -(touchTex.g * 2.0 - 1.0);
              float intensity = touchTex.b;
              
              uv.x += vx * 0.15 * intensity;
              uv.y += vy * 0.15 * intensity;
              
              vec3 color = getGradientColor(uv, uTime);
              color += grain(uv, uTime) * uGrainIntensity;
              
              gl_FragColor = vec4(color, 1.0);
            }
          `
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.app.scene.add(this.mesh);
    }

    update(delta) {
        this.uniforms.uTime.value += delta;
    }

    onResize() {
        const viewSize = this.app.getViewSize();
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
        }
        this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
}

class LiquidApp {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const canvas = this.renderer.domElement;
        canvas.id = "liquid-bg-canvas";
        document.body.prepend(canvas);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();

        this.touchTexture = new TouchTexture();
        this.gradientBackground = new GradientBackground(this);
        this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;

        this.init();
    }

    init() {
        this.gradientBackground.init();
        this.tick();

        window.addEventListener("resize", () => this.onResize());
        window.addEventListener("mousemove", (e) => this.onMouseMove(e));
        window.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    }

    onMouseMove(e) {
        const mouse = {
            x: e.clientX / window.innerWidth,
            y: 1 - e.clientY / window.innerHeight
        };
        this.touchTexture.addTouch(mouse);
    }

    onTouchMove(e) {
        const touch = e.touches[0];
        this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    getViewSize() {
        const fovInRadians = (this.camera.fov * Math.PI) / 180;
        const height = Math.abs(this.camera.position.z * Math.tan(fovInRadians / 2) * 2);
        return { width: height * this.camera.aspect, height };
    }

    tick() {
        const delta = this.clock.getDelta();
        this.touchTexture.update();
        this.gradientBackground.update(delta);
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.tick());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.gradientBackground.onResize();
    }
}

// Initialize on CV page only
if (document.body.classList.contains('cv-page')) {
    new LiquidApp();
}
