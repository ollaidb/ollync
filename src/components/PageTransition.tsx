import { motion } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' as const }
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
