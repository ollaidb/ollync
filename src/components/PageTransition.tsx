import { motion } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const }
}

type PageTransitionProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper pour les transitions de page : entrée fluide (fade + léger slide).
 * Utilisé autour du contenu des routes pour un flux visuel cohérent.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
