import { motion, type HTMLMotionProps } from 'framer-motion'

type PressableProps = HTMLMotionProps<'div'> & {
  /** Intensité du scale au clic (défaut 0.98) */
  tapScale?: number
  /** Enfants */
  children: React.ReactNode
}

/**
 * Wrapper pour un feedback visuel au clic (scale léger).
 * Utiliser pour les zones cliquables (cartes, boutons custom, liens) pour un flux vivant.
 */
export function Pressable({
  tapScale = 0.98,
  children,
  style,
  ...rest
}: PressableProps) {
  return (
    <motion.div
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default Pressable
