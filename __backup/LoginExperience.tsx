// src/components/LoginExperience.tsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function LoginExperience() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      55,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 340;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0); // Transparent BG
    renderer.setSize(width, height);

    // Wireframe ShaderMaterial mit vertikalem Neon-Gradient
    const vertexShader = `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      varying vec3 vPosition;
      void main() {
        // vPosition.y von ca. -radius bis +radius → normalisieren
        float t = (vPosition.y + 150.0) / 300.0;
        // Farbverlauf: cyan → magenta
        vec3 colorA = vec3(0.0, 1.0, 0.84); // cyan
        vec3 colorB = vec3(1.0, 0.0, 1.0);  // magenta
        vec3 color = mix(colorA, colorB, t);

        // Glow: Helligkeit basierend auf Entfernung zum Rand
        float glow = 0.15 + 0.85 * pow(1.0 - abs(vPosition.y/150.0), 2.8);

        gl_FragColor = vec4(color * glow, 0.95);
      }
    `;

    const geometry = new THREE.SphereGeometry(150, 48, 36);

    // ShaderMaterial für Wireframe
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      wireframe: true,
      transparent: true,
    });

    // Mesh & Szene
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Optional: zusätzlicher "Glow"-Effekt mit leichtem Halo
    const glowGeometry = new THREE.SphereGeometry(155, 48, 36);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88fff9,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glowMesh); // als Kind, damit es mit rotiert

    // Animation Loop (Drehung)
    function animate() {
      sphere.rotation.x += 0.0027;
      sphere.rotation.y += 0.0019;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    // Mount
    const mount = mountRef.current!;
    mount.appendChild(renderer.domElement);

    // Responsive Resize
    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
