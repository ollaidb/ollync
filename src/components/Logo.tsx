import { useMemo } from 'react'
import './Logo.css'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

const Logo = ({ className = '', width = 120, height = 60 }: LogoProps) => {
  const logoId = useMemo(() => `ollync-logo-${Math.random().toString(36).substring(7)}`, [])
  
  return (
    <svg
      className={`ollync-logo ${className}`}
      width={width}
      height={height}
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Dégradé pour le texte OLLYNC (bleu → violet → rose) */}
        <linearGradient id={`ollyncGradient-${logoId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="30%" stopColor="#7B68EE" />
          <stop offset="60%" stopColor="#9D4EDD" />
          <stop offset="100%" stopColor="#E91E63" />
        </linearGradient>
      </defs>
      
      {/* Grand O violet stylisé - anneau épais avec courbure organique vers l'intérieur en bas */}
      <circle
        cx="60"
        cy="18"
        r="14"
        fill="none"
        stroke="#9D4EDD"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Courbure organique vers l'intérieur en bas du O */}
      <path
        d="M52 18 Q60 28 68 18"
        stroke="#9D4EDD"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Texte OLLYNC avec dégradé horizontal centré sous le O */}
      <text
        x="60"
        y="48"
        fontSize="18"
        fontWeight="700"
        fill={`url(#ollyncGradient-${logoId})`}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
        textAnchor="middle"
        letterSpacing="0.5px"
      >
        OLLYNC
      </text>
    </svg>
  )
}

export default Logo
