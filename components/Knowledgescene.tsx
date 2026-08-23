import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface KnowledgeSceneProps {
  scrollProgress: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
}

interface OrbitRing {
  id: number;
  radius: number;
  rotation: number;
  speed: number;
  tilt: number;
  particles: number;
}

export function KnowledgeScene({ scrollProgress }: KnowledgeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 30, damping: 20 });

  const rotateX = useTransform(smoothMouseY, [-1, 1], [15, -15]);
  const rotateY = useTransform(smoothMouseX, [-1, 1], [-15, 15]);

  // Floating particles in the background
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.4
    }));
  }, []);

  // Orbit rings
  const orbitRings = useMemo<OrbitRing[]>(() => [
  { id: 0, radius: 120, rotation: 0, speed: 0.3, tilt: 75, particles: 12 },
  { id: 1, radius: 180, rotation: 60, speed: -0.2, tilt: 60, particles: 16 },
  { id: 2, radius: 240, rotation: 120, speed: 0.15, tilt: 45, particles: 20 }],
  []);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setTime((t) => t + 0.016);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
      mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const eased = 1 - Math.pow(1 - Math.min(1, scrollProgress * 2), 3);

  return (
    <div data-ev-id="ev_e7555b7281"
    ref={containerRef}
    className="absolute inset-0 overflow-hidden">

      {/* Ambient glow */}
      <div data-ev-id="ev_9db6164ff9"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 rounded-full"
      style={{
        background: `radial-gradient(circle, rgba(59, 130, 246, ${0.08 + eased * 0.07}) 0%, rgba(139, 92, 246, ${0.04 + eased * 0.03}) 40%, transparent 70%)`,
        filter: 'blur(60px)'
      }} />


      {/* Background particles */}
      {particles.map((particle) => {
        const yOffset = time * particle.speed * 20 % 100;
        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${(particle.y + yOffset) % 100}%`,
              opacity: particle.opacity * (0.5 + eased * 0.5)
            }} />);


      })}

      {/* Main 3D Scene */}
      <div data-ev-id="ev_501d7f11e0" className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1200 }}>
        <motion.div
          className="relative w-125 h-125"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d'
          }}>

          {/* Central core */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: 'preserve-3d' }}>

            {/* Glowing core sphere */}
            <motion.div
              className="relative w-20 h-20 rounded-full"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(59, 130, 246, 0.6) 50%, transparent 70%)',
                boxShadow: `
                  0 0 60px rgba(59, 130, 246, 0.5),
                  0 0 120px rgba(59, 130, 246, 0.3),
                  0 0 180px rgba(139, 92, 246, 0.2)
                `
              }} />

            
            {/* Inner pulse ring */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut'
              }} />

          </motion.div>

          {/* Orbit rings */}
          {orbitRings.map((ring) =>
          <motion.div
            key={ring.id}
            className="absolute top-1/2 left-1/2 rounded-full border border-white/10"
            style={{
              width: ring.radius * 2,
              height: ring.radius * 2,
              marginLeft: -ring.radius,
              marginTop: -ring.radius,
              transform: `rotateX(${ring.tilt}deg) rotateZ(${ring.rotation + time * ring.speed * 50}deg)`,
              transformStyle: 'preserve-3d',
              opacity: 0.3 + eased * 0.4
            }}>

              {/* Particles on the ring */}
              {Array.from({ length: ring.particles }).map((_, i) => {
              const angle = i / ring.particles * Math.PI * 2;
              const x = Math.cos(angle) * ring.radius;
              const y = Math.sin(angle) * ring.radius;
              const isHighlighted = i % 4 === 0;

              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: isHighlighted ? 6 : 3,
                    height: isHighlighted ? 6 : 3,
                    left: ring.radius + x - (isHighlighted ? 3 : 1.5),
                    top: ring.radius + y - (isHighlighted ? 3 : 1.5),
                    backgroundColor: isHighlighted ? '#3B82F6' : 'white',
                    boxShadow: isHighlighted ? '0 0 10px rgba(59, 130, 246, 0.8)' : 'none',
                    opacity: 0.6 + eased * 0.4
                  }} />);


            })}
            </motion.div>
          )}

          {/* Floating data nodes */}
          {[...Array(8)].map((_, i) => {
            const angle = i / 8 * Math.PI * 2 + time * 0.2;
            const radius = 100 + Math.sin(time * 0.5 + i) * 20;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.4;
            const z = Math.sin(angle) * radius * 0.6;
            const scale = 0.8 + (z + radius) / (radius * 2) * 0.4;

            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full"
                style={{
                  x: x - 8,
                  y: y - 8,
                  scale,
                  opacity: (0.4 + scale * 0.4) * (0.5 + eased * 0.5),
                  background: i % 2 === 0 ?
                  'linear-gradient(135deg, #3B82F6, #8B5CF6)' :
                  'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                  boxShadow: `0 0 20px rgba(59, 130, 246, ${0.3 * scale})`,
                  zIndex: Math.round(z)
                }} />);


          })}

          {/* Connection lines */}
          <svg data-ev-id="ev_4d9d9e990b" className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 + eased * 0.2 }}>
            <defs data-ev-id="ev_adc92a6714">
              <linearGradient data-ev-id="ev_27ef2a8a28" id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop data-ev-id="ev_0f36b0b21a" offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop data-ev-id="ev_f471c5da20" offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {[...Array(6)].map((_, i) => {
              const angle1 = i / 6 * Math.PI * 2 + time * 0.1;
              const angle2 = (i + 2) / 6 * Math.PI * 2 + time * 0.1;
              const r = 80;
              const x1 = 250 + Math.cos(angle1) * r;
              const y1 = 250 + Math.sin(angle1) * r * 0.5;
              const x2 = 250 + Math.cos(angle2) * r;
              const y2 = 250 + Math.sin(angle2) * r * 0.5;

              return (
                <line data-ev-id="ev_eff772147b"
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#lineGradient)"
                strokeWidth="1" />);


            })}
          </svg>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div data-ev-id="ev_874d40e61c" className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-black to-transparent" />
    </div>
    );
}