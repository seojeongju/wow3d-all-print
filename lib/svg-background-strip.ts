/**
 * ImageTracer SVG에서 배경(밝은·큰 면) path를 제거해 로고 실루엣만 남깁니다.
 * 배지 위에 올릴 때 전체 사각형이 덮여 로고가 안 보이던 문제를 막습니다.
 */
export function stripSvgBackgroundLayers(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') return svgContent

  const pathRe = /<path\b[^>]*>/gi
  const paths = svgContent.match(pathRe)
  if (!paths || paths.length <= 1) return svgContent

  type PathInfo = { raw: string; lum: number; areaHint: number }
  const infos: PathInfo[] = paths.map((raw) => {
    const fillMatch = raw.match(/\bfill\s*=\s*["']([^"']+)["']/i)
      || raw.match(/\bfill\s*:\s*([^;"'\s]+)/i)
    const fill = (fillMatch?.[1] || '#000000').trim()
    const lum = fillLuminance(fill)

    // d 속성 좌표로 대략 면적 힌트 (바운딩 박스)
    const dMatch = raw.match(/\bd\s*=\s*["']([^"']+)["']/i)
    const areaHint = pathBBoxAreaHint(dMatch?.[1] || '')
    return { raw, lum, areaHint }
  })

  const maxArea = Math.max(...infos.map((p) => p.areaHint), 1)
  const lightest = Math.max(...infos.map((p) => p.lum))
  const hasDarker = infos.some((p) => p.lum < lightest - 0.12)

  const keep = infos.filter((p) => {
    const coversMost = p.areaHint >= maxArea * 0.65
    // 거의 전체 화면을 덮는 가장 밝은(또는 밝은) 레이어 = 배경
    if (coversMost && hasDarker && p.lum >= lightest - 0.03 && p.lum >= 0.4) return false
    // 매우 밝은 단색이고 다른 어두운 path가 있으면 배경
    if (p.lum >= 0.82 && infos.some((o) => o.lum < 0.55)) return false
    return true
  })

  if (keep.length === 0) return svgContent

  let out = svgContent
  for (const p of infos) {
    if (!keep.includes(p)) {
      out = out.replace(p.raw, '')
    }
  }
  return out
}

function fillLuminance(fill: string): number {
  const s = fill.toLowerCase()
  if (s === 'none' || s === 'transparent') return 1
  if (s.startsWith('url(')) return 0.5

  let r = 0
  let g = 0
  let b = 0
  const rgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
  if (rgb) {
    r = Number(rgb[1]) / 255
    g = Number(rgb[2]) / 255
    b = Number(rgb[3]) / 255
  } else {
    let hex = s
    if (hex.startsWith('#')) hex = hex.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      r = parseInt(hex.slice(0, 2), 16) / 255
      g = parseInt(hex.slice(2, 4), 16) / 255
      b = parseInt(hex.slice(4, 6), 16) / 255
    } else if (s === 'white') {
      return 1
    } else if (s === 'black') {
      return 0
    } else {
      return 0.2
    }
  }
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function pathBBoxAreaHint(d: string): number {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!nums || nums.length < 4) return 0
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i])
    const y = Number(nums[i + 1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  if (!Number.isFinite(minX)) return 0
  return Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
}
