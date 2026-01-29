"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    z: number;
    speed: number;
    color: string;
    connections: number[];
}

export const BlockDAGVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let frameCount = 0;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const createParticle = (depth: number): Particle => {
            // Create particles in a tunnel-like distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 800; // Spread out from center

            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: depth,
                speed: 2 + Math.random() * 3, // Variable speed for parallax
                color: Math.random() > 0.8 ? "#70C7BA" : "#49D9D9", // Kaspa Turquoise variations
                connections: [], // Will link to previous particles randomly
            };
        };

        // Initialize particles
        for (let i = 0; i < 200; i++) {
            particles.push(createParticle(Math.random() * 2000));
        }

        // Sort by Z for proper rendering order (painter's algorithmish)
        particles.sort((a, b) => b.z - a.z);

        const draw = () => {
            // Dark cyber background with trail effect
            ctx.fillStyle = "rgba(10, 10, 15, 0.3)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const fov = 300; // Field of view

            frameCount++;

            // Update and Draw Particles
            particles.forEach((p, index) => {
                // Move particle towards camera
                p.z -= p.speed * 2;

                // Reset if passed camera
                if (p.z <= 1) {
                    const newP = createParticle(2000);
                    particles[index] = newP;
                    p = newP;
                }

                // Project 3D to 2D
                const scale = fov / p.z;
                const screenX = cx + p.x * scale;
                const screenY = cy + p.y * scale;

                // Draw Connections (Pseudo-DAG edges)
                // Check a few neighbors to draw lines to
                if (p.z < 1800) { // Don't draw lines too far back
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(73, 217, 217, ${p.z < 500 ? 0.3 : 0.05})`; // Fade distant lines
                    ctx.lineWidth = 1 * scale;

                    // Connect to nearby index particles for consistent-ish localized connections
                    // This is a cheap way to simulate DAG edges without O(N^2) distance checks
                    const neighbor = particles[(index + 1) % particles.length];
                    if (neighbor && neighbor.z > p.z && neighbor.z - p.z < 500) {
                        const nScale = fov / neighbor.z;
                        const nX = cx + neighbor.x * nScale;
                        const nY = cy + neighbor.y * nScale;
                        ctx.moveTo(screenX, screenY);
                        ctx.lineTo(nX, nY);
                    }
                    ctx.stroke();
                }

                // Draw Particle (Block)
                const size = Math.max(1, 10 * scale);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.min(1, (2000 - p.z) / 500); // Fade in from distance

                // Hexagon shape
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const theta = (i * Math.PI) / 3;
                    ctx.lineTo(
                        screenX + size * Math.cos(theta),
                        screenY + size * Math.sin(theta)
                    );
                }
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });

            // Speed up effect occasionally
            if (frameCount % 600 === 0) {
                particles.forEach(p => p.speed += 5);
                setTimeout(() => particles.forEach(p => p.speed -= 5), 1000); // Burst of speed
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 bg-black"
        />
    );
};
