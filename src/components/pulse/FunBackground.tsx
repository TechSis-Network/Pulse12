import { motion } from 'framer-motion';

const blobs = [
  {
    className: 'left-[-12%] top-[-12%] h-80 w-80 bg-primary/30',
    animate: { x: [0, 40, -20, 0], y: [0, 30, -10, 0], scale: [1, 1.15, 0.95, 1] },
  },
  {
    className: 'right-[-10%] top-[12%] h-96 w-96 bg-chart-2/25',
    animate: { x: [0, -35, 25, 0], y: [0, 45, -20, 0], scale: [1, 0.9, 1.12, 1] },
  },
  {
    className: 'left-[18%] bottom-[-18%] h-80 w-80 bg-chart-3/20',
    animate: { x: [0, 28, -32, 0], y: [0, -28, 16, 0], scale: [1, 1.12, 0.9, 1] },
  },
  {
    className: 'right-[12%] bottom-[-12%] h-72 w-72 bg-chart-5/20',
    animate: { x: [0, -22, 32, 0], y: [0, -32, 12, 0], scale: [1, 1.2, 0.95, 1] },
  },
];

const particles = Array.from({ length: 14 }).map((_, i) => ({
  className: `h-2 w-2 rounded-full ${
    ['bg-primary/40', 'bg-chart-2/40', 'bg-chart-3/40', 'bg-chart-5/40'][i % 4]
  }`,
  left: `${(i * 37) % 95}%`,
  top: `${(i * 53) % 90}%`,
  animate: { y: [0, -24, 0], opacity: [0.15, 0.7, 0.15] },
  duration: 6 + (i % 5),
}));

export default function FunBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* drifting color blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={`blob-${i}`}
          className={`absolute rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen ${b.className}`}
          animate={b.animate}
          transition={{ duration: 18 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* abstract rotating ring */}
      <motion.svg
        className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 text-primary/10"
        viewBox="0 0 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 10" />
        <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 8" />
        <circle cx="100" cy="100" r="44" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="14 6" />
      </motion.svg>

      {/* counter-rotating arcs */}
      <motion.svg
        className="absolute right-[8%] top-[55%] h-48 w-48 text-chart-2/15"
        viewBox="0 0 100 100"
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        <path d="M50 5 A45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 95 A45 45 0 0 1 5 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </motion.svg>

      {/* dotted grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          color: 'hsl(var(--foreground))',
        }}
      />

      {/* floating particles */}
      {particles.map((p, i) => (
        <motion.span
          key={`p-${i}`}
          className={`absolute ${p.className}`}
          style={{ left: p.left, top: p.top }}
          animate={p.animate}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}