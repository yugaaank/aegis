import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const R_EARTH = 6371

// Simplex-style hash noise (fast, deterministic)
function hashNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)

  const a = hashNoise(ix, iy, seed)
  const b = hashNoise(ix + 1, iy, seed)
  const c = hashNoise(ix, iy + 1, seed)
  const d = hashNoise(ix + 1, iy + 1, seed)

  return a + sx * (b - a) + sy * (c - a) + sx * sy * (a - b - c + d)
}

function fbmNoise(x: number, y: number, seed: number, octaves: number): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 100)
    amplitude *= 0.5
    frequency *= 2
  }
  return value
}

function lonLatToXY(lon: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return [x, y]
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: [number, number][], width: number, height: number) {
  if (points.length === 0) return
  ctx.beginPath()
  const [sx, sy] = lonLatToXY(points[0][0], points[0][1], width, height)
  ctx.moveTo(sx, sy)
  for (let i = 1; i < points.length; i++) {
    const [x, y] = lonLatToXY(points[i][0], points[i][1], width, height)
    ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function isPointInPolygon(lon: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

const LAND_POLYGONS: [number, number][][] = [
  [[-168,65],[-150,70],[-130,70],[-105,68],[-95,75],[-80,73],[-65,60],[-55,52],[-65,44],[-75,35],[-80,25],[-90,16],[-105,20],[-115,30],[-124,48],[-140,58],[-168,65]],
  [[-115,32],[-100,28],[-90,16],[-105,20],[-115,32]],
  [[-55,78],[-20,83],[-25,70],[-45,60],[-55,78]],
  [[-80,10],[-60,10],[-35,-5],[-35,-15],[-50,-30],[-68,-55],[-75,-45],[-75,-15],[-80,10]],
  [[-75,5],[-55,5],[-50,-10],[-70,-10],[-75,5]],
  [[-10,36],[0,43],[10,45],[20,38],[30,42],[30,60],[20,71],[5,62],[-10,55],[-10,36]],
  [[-10,50],[-2,58],[2,52],[-5,50],[-10,50]],
  [[-18,28],[-6,36],[12,38],[33,30],[43,12],[51,11],[40,-10],[33,-28],[20,-35],[14,-23],[10,5],[-15,12],[-18,28]],
  [[-18,28],[-6,36],[12,38],[33,30],[35,18],[10,12],[-15,12],[-18,28]],
  [[43,-12],[50,-14],[47,-25],[43,-25],[43,-12]],
  [[30,60],[60,72],[100,76],[140,72],[170,66],[170,50],[140,35],[120,30],[110,20],[100,10],[80,8],[70,20],[60,25],[50,30],[40,30],[30,42],[30,60]],
  [[68,24],[88,22],[80,8],[73,15],[68,24]],
  [[35,30],[55,25],[58,12],[43,12],[35,30]],
  [[100,40],[125,42],[122,25],[105,20],[100,40]],
  [[130,31],[142,44],[145,42],[132,30],[130,31]],
  [[95,20],[108,10],[105,0],[115,-8],[125,-5],[100,15]],
  [[113,-22],[130,-12],[142,-12],[153,-28],[148,-38],[135,-34],[115,-35],[113,-22]],
  [[166,-34],[178,-47],[172,-47],[166,-34]],
  [[-180,-65],[180,-65],[180,-90],[-180,-90]],
  [[-180,78],[180,78],[180,90],[-180,90]],
]

function createEarthTexture(): THREE.CanvasTexture {
  const width = 4096
  const height = 2048
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  const isLand = (lon: number, lat: number): boolean => {
    for (const poly of LAND_POLYGONS) {
      if (isPointInPolygon(lon, lat, poly)) return true
    }
    return false
  }

  for (let py = 0; py < height; py++) {
    const lat = 90 - (py / height) * 180
    for (let px = 0; px < width; px++) {
      const lon = (px / width) * 360 - 180
      const idx = (py * width + px) * 4

      const nx = (px / width) * 8
      const ny = (py / height) * 8
      const noise1 = fbmNoise(nx, ny, 0, 6)
      const noise2 = fbmNoise(nx * 2, ny * 2, 50, 4)
      const noise3 = fbmNoise(nx * 0.5, ny * 0.5, 100, 3)

      const absLat = Math.abs(lat)

      if (isLand(lon, lat)) {
        let r: number, g: number, b: number

        if (absLat > 65) {
          const snowBlend = Math.min(1, (absLat - 65) / 15)
          const snowNoise = noise1 * 0.3 + noise2 * 0.15
          if (snowBlend + snowNoise > 0.55) {
            r = 220 + noise2 * 30
            g = 228 + noise2 * 20
            b = 235 + noise2 * 15
          } else {
            const tundraR = 85 + noise1 * 30
            const tundraG = 95 + noise1 * 25
            const tundraB = 75 + noise1 * 20
            r = tundraR
            g = tundraG
            b = tundraB
          }
        } else if (absLat > 45) {
          const forestGreen = 38 + noise1 * 25
          r = 35 + noise2 * 15 + noise3 * 10
          g = forestGreen + 20 + noise1 * 15
          b = 30 + noise1 * 12
        } else if (absLat > 23) {
          const isDesert = fbmNoise(nx * 1.5, ny * 1.5, 200, 4) > 0.48
          if (isDesert) {
            r = 160 + noise1 * 40 + noise2 * 20
            g = 130 + noise1 * 30 + noise2 * 15
            b = 80 + noise1 * 20
          } else {
            r = 45 + noise1 * 30
            g = 100 + noise1 * 35 + noise2 * 15
            b = 35 + noise1 * 15
          }
        } else {
          const isDense = fbmNoise(nx * 1.2, ny * 1.2, 300, 4) > 0.42
          if (isDense) {
            r = 22 + noise1 * 18
            g = 65 + noise1 * 30 + noise2 * 10
            b = 18 + noise1 * 10
          } else {
            r = 50 + noise1 * 25
            g = 110 + noise1 * 30
            b = 40 + noise1 * 15
          }
        }

        const variation = noise2 * 15 - 7
        r = Math.max(0, Math.min(255, r + variation))
        g = Math.max(0, Math.min(255, g + variation * 0.7))
        b = Math.max(0, Math.min(255, b + variation * 0.5))

        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 255
      } else {
        const depthNoise = noise1 * 0.4 + noise3 * 0.2
        const depth = Math.max(0, Math.min(1, 0.5 + depthNoise - absLat / 360))

        const shallowR = 15, shallowG = 75, shallowB = 130
        const deepR = 5, deepG = 18, deepB = 48

        let r = deepR + (shallowR - deepR) * depth + noise2 * 8
        let g = deepG + (shallowG - deepG) * depth + noise2 * 6
        let b = deepB + (shallowB - deepB) * depth + noise2 * 10

        r = Math.max(0, Math.min(255, r))
        g = Math.max(0, Math.min(255, g))
        b = Math.max(0, Math.min(255, b))

        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 255
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const cityCtx = ctx
  cityCtx.fillStyle = 'rgba(255, 200, 100, 0.5)'
  const cities: [number, number, number][] = [
    [-74, 40, 4], [-118, 34, 3], [-0.1, 51.5, 4], [2.3, 48.8, 3], [13.4, 52.5, 3],
    [37.6, 55.7, 3], [139.7, 35.6, 4], [121.4, 31.2, 4], [116.4, 39.9, 3],
    [77.2, 28.6, 3], [72.8, 19.0, 2], [55.3, 25.2, 3], [31.2, 30.0, 3],
    [-43.2, -22.9, 3], [151.2, -33.8, 3], [-87.6, 41.9, 3], [-79.4, 43.7, 2],
    [28.9, 41.0, 3], [126.9, 37.5, 3], [103.8, 1.4, 2], [-3.7, 40.4, 3],
    [114.1, 22.3, 4], [120.9, 14.6, 2], [100.5, 13.8, 2], [88.6, 22.6, 2],
    [51.4, 35.7, 3], [44.4, 33.3, 2], [3.4, 6.5, 2], [27.6, -33.9, 2],
    [149.1, -35.3, 2], [-99.1, 19.4, 3], [-66.6, 18.5, 2], [-58.4, -34.6, 2],
    [-46.6, -23.5, 3], [-70.7, -33.4, 2], [10.8, 59.9, 2], [18.1, 59.3, 2],
    [24.9, 60.2, 2], [30.3, 59.9, 2], [12.5, 42.2, 2], [8.5, 47.4, 2],
  ]
  cities.forEach(([lon, lat, size]) => {
    const [cx, cy] = lonLatToXY(lon, lat, width, height)
    const grad = cityCtx.createRadialGradient(cx, cy, 0, cx, cy, size * 2)
    grad.addColorStop(0, 'rgba(255, 210, 120, 0.7)')
    grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.3)')
    grad.addColorStop(1, 'rgba(255, 160, 60, 0)')
    cityCtx.fillStyle = grad
    cityCtx.beginPath()
    cityCtx.arc(cx, cy, size * 2, 0, Math.PI * 2)
    cityCtx.fill()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = 8
  return texture
}

function createBumpTexture(): THREE.CanvasTexture {
  const width = 2048
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const nx = (px / width) * 12
      const ny = (py / height) * 12
      const v = fbmNoise(nx, ny, 777, 6) * 255
      const idx = (py * width + px) * 4
      data[idx] = v
      data[idx + 1] = v
      data[idx + 2] = v
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function createSpecularTexture(): THREE.CanvasTexture {
  const width = 2048
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  const isLand = (lon: number, lat: number): boolean => {
    for (const poly of LAND_POLYGONS) {
      if (isPointInPolygon(lon, lat, poly)) return true
    }
    return false
  }

  for (let py = 0; py < height; py++) {
    const lat = 90 - (py / height) * 180
    for (let px = 0; px < width; px++) {
      const lon = (px / width) * 360 - 180
      const idx = (py * width + px) * 4
      const land = isLand(lon, lat)
      const v = land ? 20 : 220
      data[idx] = v
      data[idx + 1] = v
      data[idx + 2] = v
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function createCloudTexture(): THREE.CanvasTexture {
  const width = 2048
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const nx = (px / width) * 6
      const ny = (py / height) * 6
      const cloud = fbmNoise(nx + 10, ny + 10, 42, 7)
      const detail = fbmNoise(nx * 3, ny * 3, 43, 4)
      let v = cloud * 0.7 + detail * 0.3

      const lat = 90 - (py / height) * 180
      const absLat = Math.abs(lat)
      if (absLat > 55) {
        v = v * 0.8 + 0.2
      } else if (absLat < 15) {
        v *= 0.7
      }

      v = Math.max(0, Math.min(1, v))
      const alpha = Math.floor(v * 180)
      const idx = (py * width + px) * 4
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
      data[idx + 3] = alpha
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function createNightTexture(): THREE.CanvasTexture {
  const width = 2048
  const height = 1024
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  const cities: [number, number, number][] = [
    [-74, 40, 6], [-118, 34, 5], [-0.1, 51.5, 6], [2.3, 48.8, 5], [13.4, 52.5, 5],
    [37.6, 55.7, 4], [139.7, 35.6, 7], [121.4, 31.2, 6], [116.4, 39.9, 5],
    [77.2, 28.6, 5], [72.8, 19.0, 4], [55.3, 25.2, 4], [31.2, 30.0, 4],
    [-43.2, -22.9, 5], [151.2, -33.8, 4], [-87.6, 41.9, 4], [-79.4, 43.7, 3],
    [28.9, 41.0, 5], [126.9, 37.5, 4], [103.8, 1.4, 3], [-3.7, 40.4, 4],
    [114.1, 22.3, 6], [120.9, 14.6, 3], [100.5, 13.8, 3], [88.6, 22.6, 3],
    [51.4, 35.7, 4], [44.4, 33.3, 3], [3.4, 6.5, 3], [27.6, -33.9, 3],
    [149.1, -35.3, 3], [-99.1, 19.4, 5], [-66.6, 18.5, 3], [-58.4, -34.6, 3],
    [-46.6, -23.5, 5], [-70.7, -33.4, 3], [10.8, 59.9, 3], [18.1, 59.3, 3],
    [24.9, 60.2, 3], [30.3, 59.9, 3], [12.5, 42.2, 3], [8.5, 47.4, 3],
    [-84.4, 39.1, 3], [-77.0, 38.9, 4], [-71.1, 42.4, 3], [-95.4, 29.8, 3],
    [-80.2, 25.8, 4], [-122.4, 47.6, 3], [-123.1, 45.5, 2], [-104.7, 38.8, 2],
    [9.2, 45.5, 3], [16.4, 48.2, 3], [21.0, 44.8, 3], [23.3, 42.7, 3],
    [15.0, 51.1, 3], [21.0, 52.2, 3], [14.4, 50.1, 3], [37.6, 55.8, 4],
    [49.1, 55.8, 3], [69.0, 41.3, 3], [76.9, 43.2, 3], [87.6, 43.8, 2],
    [106.8, -6.2, 3], [112.7, -7.3, 3], [91.9, 21.9, 2], [96.2, 16.9, 2],
    [101.7, 3.1, 3], [106.5, 10.8, 2], [121.0, 14.6, 3], [128.6, 36.0, 3],
    [135.2, 34.7, 4], [139.9, 35.7, 5], [140.1, 36.1, 3], [132.5, 34.4, 2],
    [117.0, 31.8, 3], [113.0, 23.1, 3], [113.5, 22.2, 4], [110.3, 20.0, 2],
    [105.8, 21.0, 2], [72.9, 19.1, 4], [77.2, 28.6, 4], [80.3, 13.1, 2],
    [85.8, 20.3, 2], [88.4, 22.6, 2], [91.7, 21.9, 2], [93.0, 18.9, 2],
    [96.9, 16.9, 2], [-9.1, 38.7, 3], [-3.7, 40.4, 4], [-5.0, 40.5, 2],
    [2.2, 48.9, 5], [5.0, 47.4, 2], [6.1, 43.7, 2], [7.5, 46.5, 2],
    [8.5, 47.4, 3], [11.6, 48.1, 3], [13.4, 52.5, 4], [12.6, 55.7, 3],
    [10.0, 54.3, 2], [14.2, 52.0, 2], [16.4, 48.2, 3], [18.6, 47.5, 2],
    [21.0, 44.8, 3], [23.3, 42.7, 3], [26.1, 44.4, 2], [28.0, 41.1, 3],
    [30.3, 59.9, 3], [32.0, 48.0, 2], [35.0, 48.5, 2], [37.6, 55.8, 4],
    [41.0, 43.0, 2], [44.4, 33.3, 3], [47.6, 41.7, 2], [49.9, 40.5, 2],
    [51.4, 35.7, 3], [54.4, 24.5, 3], [55.3, 25.2, 3], [56.3, 26.6, 2],
    [58.4, 24.4, 2], [58.5, 23.6, 2], [67.0, 25.0, 2], [69.3, 34.5, 2],
  ]

  cities.forEach(([lon, lat, size]) => {
    const [cx, cy] = lonLatToXY(lon, lat, width, height)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2.5)
    grad.addColorStop(0, 'rgba(255, 210, 100, 0.9)')
    grad.addColorStop(0.3, 'rgba(255, 180, 60, 0.5)')
    grad.addColorStop(0.7, 'rgba(255, 140, 30, 0.15)')
    grad.addColorStop(1, 'rgba(200, 100, 20, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, size * 2.5, 0, Math.PI * 2)
    ctx.fill()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  const earthTexture = useMemo(() => createEarthTexture(), [])
  const bumpTexture = useMemo(() => createBumpTexture(), [])
  const specularTexture = useMemo(() => createSpecularTexture(), [])
  const cloudTexture = useMemo(() => createCloudTexture(), [])
  const nightTexture = useMemo(() => createNightTexture(), [])

  const earthMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 30,
      specularMap: specularTexture,
      specular: new THREE.Color('#6699cc'),
      shininess: 30,
      emissive: new THREE.Color('#000000'),
      emissiveMap: nightTexture,
      emissiveIntensity: 0.8,
    })
  }, [earthTexture, bumpTexture, specularTexture, nightTexture])

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      shininess: 5,
      specular: new THREE.Color('#333333'),
    })
  }, [cloudTexture])

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 sunDirection;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = 1.0 - dot(viewDir, vNormal);
          fresnel = pow(fresnel, 3.0);
          float sunFacing = dot(normalize(vWorldPosition), sunDirection);
          float sunInfluence = smoothstep(-0.3, 0.6, sunFacing);
          vec3 dayColor = vec3(0.3, 0.6, 1.0);
          vec3 twilightColor = vec3(0.9, 0.4, 0.15);
          vec3 color = mix(twilightColor, dayColor, sunInfluence);
          float intensity = fresnel * (0.3 + 0.7 * sunInfluence);
          gl_FragColor = vec4(color, intensity * 0.9);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025
    }
  })

  return (
    <group>
      <mesh ref={meshRef} material={earthMaterial}>
        <sphereGeometry args={[R_EARTH, 128, 128]} />
      </mesh>

      <mesh ref={cloudsRef} material={cloudMaterial}>
        <sphereGeometry args={[R_EARTH * 1.006, 128, 128]} />
      </mesh>

      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[R_EARTH * 1.03, 64, 64]} />
      </mesh>

      <mesh>
        <sphereGeometry args={[R_EARTH * 1.15, 64, 64]} />
        <meshBasicMaterial color="#1a4a8a" transparent opacity={0.02} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  )
}
