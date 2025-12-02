import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const { theme } = useTheme()
  
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false })
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        targetMouseRef.current = {
          x: e.touches[0].clientX / window.innerWidth,
          y: e.touches[0].clientY / window.innerHeight
        }
      }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    class LiquidBlob {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      baseRadius: number
      color: { r: number; g: number; b: number; a: number }
      points: { x: number; y: number; angle: number }[]
      numPoints: number
      wobbleSpeed: number
      wobbleAmount: number

      constructor(x: number, y: number, radius: number, color: { r: number; g: number; b: number; a: number }) {
        this.x = x
        this.y = y
        this.radius = radius
        this.baseRadius = radius
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.color = color
        this.numPoints = 8 + Math.floor(Math.random() * 4)
        this.wobbleSpeed = 0.02 + Math.random() * 0.02
        this.wobbleAmount = 20 + Math.random() * 20
        
        this.points = []
        for (let i = 0; i < this.numPoints; i++) {
          this.points.push({
            x: 0,
            y: 0,
            angle: (Math.PI * 2 / this.numPoints) * i + Math.random() * 0.5
          })
        }
      }

      update(time: number, mouseX: number, mouseY: number, allBlobs: LiquidBlob[]) {
        // Mouse attraction
        const mouseDx = mouseX * canvas!.width - this.x
        const mouseDy = mouseY * canvas!.height - this.y
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy)
        const attractionRadius = 400
        
        if (mouseDist < attractionRadius && mouseDist > 0) {
          const force = (1 - mouseDist / attractionRadius) * 0.3
          this.vx += (mouseDx / mouseDist) * force
          this.vy += (mouseDy / mouseDist) * force
        }

        // Blob-to-blob interaction (liquid cohesion)
        allBlobs.forEach(other => {
          if (other === this) return
          const dx = other.x - this.x
          const dy = other.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = this.radius + other.radius

          if (dist < minDist * 1.5 && dist > 0) {
            // Attraction when close
            const force = 0.02
            this.vx += (dx / dist) * force
            this.vy += (dy / dist) * force
          }
          
          if (dist < minDist && dist > 0) {
            // Repulsion when too close
            const force = 0.5
            this.vx -= (dx / dist) * force
            this.vy -= (dy / dist) * force
          }
        })

        // Apply velocity with damping
        this.x += this.vx
        this.y += this.vy
        this.vx *= 0.95
        this.vy *= 0.95

        // Boundary collision with bounce
        const margin = this.radius
        if (this.x < margin) {
          this.x = margin
          this.vx = Math.abs(this.vx) * 0.5
        }
        if (this.x > canvas!.width - margin) {
          this.x = canvas!.width - margin
          this.vx = -Math.abs(this.vx) * 0.5
        }
        if (this.y < margin) {
          this.y = margin
          this.vy = Math.abs(this.vy) * 0.5
        }
        if (this.y > canvas!.height - margin) {
          this.y = canvas!.height - margin
          this.vy = -Math.abs(this.vy) * 0.5
        }

        // Update organic shape points
        this.points.forEach(point => {
          const wobble = Math.sin(time * this.wobbleSpeed + point.angle) * this.wobbleAmount
          const radiusWithWobble = this.radius + wobble
          point.x = this.x + Math.cos(point.angle + time * 0.3) * radiusWithWobble
          point.y = this.y + Math.sin(point.angle + time * 0.3) * radiusWithWobble
        })

        // Breathing effect
        const breathe = Math.sin(time * 0.5) * 0.1 + 1
        this.radius = this.baseRadius * breathe
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw organic blob shape
        ctx.beginPath()
        
        for (let i = 0; i < this.points.length; i++) {
          const current = this.points[i]
          const next = this.points[(i + 1) % this.points.length]
          
          if (i === 0) {
            ctx.moveTo(current.x, current.y)
          }
          
          // Create smooth curves between points
          const cpx = (current.x + next.x) / 2
          const cpy = (current.y + next.y) / 2
          ctx.quadraticCurveTo(current.x, current.y, cpx, cpy)
        }
        
        ctx.closePath()

        // Create gradient for liquid effect
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 1.5
        )
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`)
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a * 0.6})`)
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`)

        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    const isDark = theme === 'dark'
    
    // Create liquid blobs with theme-appropriate colors
    const blobs: LiquidBlob[] = [
      new LiquidBlob(
        canvas.width * 0.2,
        canvas.height * 0.3,
        180,
        isDark ? { r: 139, g: 92, b: 246, a: 0.25 } : { r: 139, g: 92, b: 246, a: 0.15 }
      ),
      new LiquidBlob(
        canvas.width * 0.8,
        canvas.height * 0.4,
        200,
        isDark ? { r: 236, g: 72, b: 153, a: 0.25 } : { r: 236, g: 72, b: 153, a: 0.15 }
      ),
      new LiquidBlob(
        canvas.width * 0.5,
        canvas.height * 0.7,
        160,
        isDark ? { r: 6, g: 182, b: 212, a: 0.25 } : { r: 6, g: 182, b: 212, a: 0.15 }
      ),
      new LiquidBlob(
        canvas.width * 0.7,
        canvas.height * 0.2,
        190,
        isDark ? { r: 168, g: 85, b: 247, a: 0.22 } : { r: 168, g: 85, b: 247, a: 0.12 }
      ),
      new LiquidBlob(
        canvas.width * 0.3,
        canvas.height * 0.8,
        150,
        isDark ? { r: 59, g: 130, b: 246, a: 0.22 } : { r: 59, g: 130, b: 246, a: 0.12 }
      ),
      new LiquidBlob(
        canvas.width * 0.6,
        canvas.height * 0.5,
        170,
        isDark ? { r: 192, g: 132, b: 252, a: 0.2 } : { r: 192, g: 132, b: 252, a: 0.1 }
      ),
      new LiquidBlob(
        canvas.width * 0.4,
        canvas.height * 0.4,
        140,
        isDark ? { r: 14, g: 165, b: 233, a: 0.2 } : { r: 14, g: 165, b: 233, a: 0.1 }
      )
    ]

    const animate = () => {
      time += 0.02

      // Smooth mouse interpolation
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.08
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.08

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply heavy blur for liquid merging effect
      ctx.filter = 'blur(40px) contrast(1.8)'
      
      blobs.forEach(blob => {
        blob.update(time, mouseRef.current.x, mouseRef.current.y, blobs)
        blob.draw(ctx)
      })

      ctx.filter = 'none'

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [theme])

  const prefersReduced = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReduced) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.9
      }}
    />
  )
}
