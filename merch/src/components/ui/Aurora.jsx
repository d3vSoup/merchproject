// src/components/ui/Aurora.jsx
import React, { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import "./Aurora.css";

const VERT_WEBGL2 = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;
const VERT_WEBGL1 = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Simple, robust aurora-style fragment shader (WebGL2)
const FRAG_WEBGL2 = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
out vec4 fragColor;
float rand(vec2 co){ return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.1;
  float n = rand(uv * 100.0 + t);
  float ramp = smoothstep(0.15, 0.8, uv.y + (n - 0.5) * uAmplitude * 0.18);
  vec3 col = mix(uColorStops[0], uColorStops[1], ramp);
  col = mix(col, uColorStops[2], ramp * 0.5);
  float alpha = ramp * uBlend;
  fragColor = vec4(col * alpha, alpha);
}
`;

// WebGL1-compatible version (uses gl_FragColor)
const FRAG_WEBGL1 = `
precision highp float;
uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
float rand(vec2 co){ return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.1;
  float n = rand(uv * 100.0 + t);
  float ramp = smoothstep(0.15, 0.8, uv.y + (n - 0.5) * uAmplitude * 0.18);
  vec3 col = mix(uColorStops[0], uColorStops[1], ramp);
  col = mix(col, uColorStops[2], ramp * 0.5);
  float alpha = ramp * uBlend;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export default function Aurora({
  colorStops = ["#5227FF", "#7cff67", "#5227FF"],
  amplitude = 1.0,
  blend = 0.75,
  speed = 1.0,
  height = 420,
  className = "",
}) {
  const ctnRef = useRef(null);
  const programRef = useRef(null);
  const rafRef = useRef(0);
  const propsRef = useRef({ colorStops, amplitude, blend, speed });
  propsRef.current = { colorStops, amplitude, blend, speed };
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn || reducedMotion) return;

    const renderer = new Renderer({ alpha: true, antialias: true, premultipliedAlpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    const vertexSrc = isWebGL2 ? VERT_WEBGL2 : VERT_WEBGL1;
    const fragSrc = isWebGL2 ? FRAG_WEBGL2 : FRAG_WEBGL1;

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: vertexSrc,
      fragment: fragSrc,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    programRef.current = program;
    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    gl.canvas.style.position = "absolute";
    gl.canvas.style.inset = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none";
    gl.canvas.setAttribute("aria-hidden", "true");

    function resize() {
      const w = ctn.offsetWidth;
      const h = ctn.offsetHeight;
      renderer.setSize(w, h);
      if (program) program.uniforms.uResolution.value = [w, h];
    }
    window.addEventListener("resize", resize);

    let time = 0;
    const loop = (t) => {
      rafRef.current = requestAnimationFrame(loop);
      const { speed: s = 1 } = propsRef.current;
      time += 0.016 * s;
      if (program) {
        program.uniforms.uTime.value = time;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? amplitude;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        program.uniforms.uColorStops.value = (propsRef.current.colorStops ?? colorStops).map((hex) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
      }
      renderer.render({ scene: mesh });
    };

    resize();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (reducedMotion) return null;

  const style = {
    position: "absolute",
    inset: 0,
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
    pointerEvents: "none",
    zIndex: 0,
  };

  return <div ref={ctnRef} className={`aurora-container ${className}`} style={style} />;
}
