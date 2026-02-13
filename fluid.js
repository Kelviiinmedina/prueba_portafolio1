/**
 * fluid.js - High-End GLSL Fluid Distortion
 * Implementation following the technical roadmap for "Liquid Plastic" effect.
 */

(function () {
    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    let width, height;
    let textTexture;
    let mouse = { x: 0.5, y: 0.5, lerpX: 0.5, lerpY: 0.5 };
    const startTime = Date.now();

    // --- SHADERS ---

    const vertexShaderSrc = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            vUv.y = 1.0 - vUv.y;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSrc = `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uText;
        uniform vec2 uMouse;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uPadding;

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 a0 = x - floor(x + 0.5);
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            // Map vUv to the padded area of the texture
            vec2 uv = vUv * (1.0 - uPadding * 2.0) + uPadding;
            
            // Interaction
            float aspect = uResolution.x / uResolution.y;
            vec2 aspectUv = vec2(vUv.x * aspect, vUv.y);
            vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);
            float dist = distance(aspectUv, aspectMouse);
            float interaction = smoothstep(0.45, 0.0, dist);

            // Organic Noise (Perlin-ish)
            float n = snoise(vUv * 3.0 + vec2(uTime * 0.1, uTime * 0.05));
            float n2 = snoise(vUv * 6.0 - vec2(uTime * 0.08, uTime * 0.12));
            
            // Plastic Displacement Logic
            vec2 displacement = vec2(n, n2) * interaction * 0.08;
            
            // Text Sampling with Chromatic Aberration
            float texR = texture2D(uText, uv + displacement * 1.4).r;
            float texG = texture2D(uText, uv + displacement * 1.0).g;
            float texB = texture2D(uText, uv + displacement * 0.6).b;
            
            float alpha = max(texR, max(texG, texB));
            
            // Color Mapping: Blue -> Orange -> White
            vec3 blue = vec3(0.0, 0.3, 1.0);
            vec3 orange = vec3(1.0, 0.6, 0.0);
            vec3 white = vec3(1.0, 1.0, 1.0);
            
            vec3 liquidColor = mix(blue, orange, (n + 1.0) * 0.5);
            vec3 finalTextColor = mix(white, liquidColor, interaction);
            
            // Highlights & Specular (Text Only)
            float spec = smoothstep(0.7, 0.98, snoise(vUv * 8.0 + displacement * 10.0 + vec2(uTime * 0.2)));
            vec3 finalColor = vec3(texR, texG, texB) * finalTextColor;
            finalColor += spec * alpha * interaction * 0.7;

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    // --- GL SETUP ---

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uText = gl.getUniformLocation(program, 'uText');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uRes = gl.getUniformLocation(program, 'uResolution');
    const uPad = gl.getUniformLocation(program, 'uPadding');

    // --- CAPTURE ---

    let padX = 0, padY = 0;

    function capture() {
        const el = document.querySelector('.cv-name');
        if (!el) return;

        const off = document.createElement('canvas');
        const ctx = off.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const hero = document.querySelector('.cv-hero');
        const hRect = hero.getBoundingClientRect();
        const tRect = el.getBoundingClientRect();

        // Use a massive bleed to ensure no clipping during distortion
        const bleed = 400;

        // Texture size must cover the entire hero area + bleed
        const totalW = hRect.width + bleed * 2;
        const totalH = hRect.height + bleed * 2;

        padX = bleed / totalW;
        padY = bleed / totalH;

        off.width = totalW * dpr;
        off.height = totalH * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, totalW, totalH);

        // Drawing coordinates relative to the oversized canvas
        // We want the text to appear at its original position relative to hRect
        const s = window.getComputedStyle(el);
        ctx.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = s.letterSpacing;

        const lines = el.innerHTML.split('<br>');
        // Offset everything by bleed
        const startX = (tRect.left - hRect.left) + bleed;
        let currentY = (tRect.top - hRect.top) + bleed;
        const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.1;

        lines.forEach(line => {
            const txt = line.replace(/<[^>]*>?/gm, '').trim();
            ctx.fillText(txt, startX, currentY);
            currentY += lh;
        });

        if (textTexture) gl.deleteTexture(textTexture);
        textTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        el.style.opacity = '0';
    }

    function resize() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        if (document.fonts) document.fonts.ready.then(capture);
        else setTimeout(capture, 500);
    }

    window.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        const nextX = (e.clientX - r.left) / (r.width || 1);
        const nextY = (e.clientY - r.top) / (r.height || 1);

        if (!isNaN(nextX) && !isNaN(nextY)) {
            mouse.targetX = nextX;
            mouse.targetY = nextY;
        }
    });

    function loop() {
        // Ensure we have valid values
        if (isNaN(mouse.lerpX)) mouse.lerpX = 0.5;
        if (isNaN(mouse.lerpY)) mouse.lerpY = 0.5;
        if (isNaN(mouse.targetX)) mouse.targetX = 0.5;
        if (isNaN(mouse.targetY)) mouse.targetY = 0.5;

        mouse.lerpX += (mouse.targetX - mouse.lerpX) * 0.08;
        mouse.lerpY += (mouse.targetY - mouse.lerpY) * 0.08;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uMouse, mouse.lerpX, mouse.lerpY);
        gl.uniform1f(uTime, (Date.now() - startTime) / 1000);
        gl.uniform2f(uRes, width, height);
        gl.uniform2f(uPad, padX, padY);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textTexture);
        gl.uniform1i(uText, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    resize();
    loop();
})();
