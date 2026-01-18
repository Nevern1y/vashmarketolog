"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
    id: number;
    x: number[];
    y: number[];
    duration: number;
    delay: number;
    left: string;
    top: string;
}

export const Particles = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <>
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute w-2 h-2 bg-primary/50 rounded-full"
                    animate={{
                        x: particle.x,
                        y: particle.y,
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                    }}
                    style={{
                        left: particle.left,
                        top: particle.top,
                    }}
                />
            ))}
        </>
    );
};
