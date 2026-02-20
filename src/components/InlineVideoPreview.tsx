import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Play, Pause, Volume2, VolumeX, ImageOff } from 'lucide-react'
import './InlineVideoPreview.css'

interface InlineVideoPreviewProps {
  src: string
  className?: string
}

let activeVideoElement: HTMLVideoElement | null = null

export default function InlineVideoPreview({ src, className = '' }: InlineVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [hasLoadedFrame, setHasLoadedFrame] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncState = () => {
      setIsPlaying(!video.paused)
      setIsMuted(video.muted)
    }
    const onLoadedData = () => {
      setHasLoadedFrame(true)
      setHasError(false)
    }
    const onError = () => {
      setHasError(true)
    }

    video.addEventListener('play', syncState)
    video.addEventListener('pause', syncState)
    video.addEventListener('volumechange', syncState)
    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('play', syncState)
      video.removeEventListener('pause', syncState)
      video.removeEventListener('volumechange', syncState)
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('error', onError)
      if (activeVideoElement === video) activeVideoElement = null
    }
  }, [])

  const togglePlay = async (event?: MouseEvent) => {
    event?.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      if (activeVideoElement && activeVideoElement !== video) {
        activeVideoElement.pause()
      }
      activeVideoElement = video
      try {
        await video.play()
      } catch {
        // autoplay policy or decode error
      }
    } else {
      video.pause()
    }
  }

  const toggleMute = (event: MouseEvent) => {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }

  if (hasError) {
    return (
      <div className={`inline-video-preview inline-video-preview--fallback ${className}`}>
        <ImageOff size={24} />
      </div>
    )
  }

  return (
    <div className={`inline-video-preview ${hasLoadedFrame ? 'is-loaded' : ''} ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="inline-video-preview__media"
        playsInline
        preload="metadata"
        muted={isMuted}
        onClick={togglePlay}
      />

      <button
        type="button"
        className="inline-video-preview__play"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <button
        type="button"
        className="inline-video-preview__sound"
        onClick={toggleMute}
        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
