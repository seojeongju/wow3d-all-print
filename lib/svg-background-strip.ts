/**
 * ImageTracer SVG에서 배경·통짜 판 path를 제거하고 로고/텍스트 실루엣만 남깁니다.
 * - 흰 배경 + 검정 글자
 * - 검정 배경 + 흰 글자
 * - 전체 화면을 덮는 사각형 레이어
 */
export function stripSvgBackgroundLayers(svgContent: string): string {
  if (!svgContent || typeof svgContent !== 'string') return svgContent

  const pathRe = /<path\b[^>]*>/gi
  const paths = svgContent.match(pathRe)
  if (!paths || paths.length === 0) return svgContent
  if (paths.length === 1) return svgContent

  type PathInfo = {
    raw: string
    lum: number
    areaHint: number
    pointCount: number
  }

  const infos: PathInfo[] = paths.map((raw) => {
    const fillMatch =
      raw.match(/\bfill\s*=\s*["']([^"']+)["']/i) ||
      raw.match(/\bfill\s*:\s*([^;"'\s]+)/i)
    const fill = (fillMatch?.[1] || '#000000').trim()
    const dMatch = raw.match(/\bd\s*=\s*["']([^"']+)["']/i)
    const d = dMatch?.[1] || ''
    return {
      raw,
      lum: fillLuminance(fill),
      areaHint: pathBBoxAreaHint(d),
      pointCount: countPathPoints(d),
    }
  })

  const maxArea = Math.max(...infos.map((p) => p.areaHint), 1)
  const totalInkArea = infos.reduce((s, p) => s + p.areaHint, 0) || 1

  // 면적 가중 평균 밝기 → 어두운 배경(흰 글자)인지 판별
  const avgLum =
    infos.reduce((s, p) => s + p.lum * p.areaHint, 0) / totalInkArea
  const lightOnDark = avgLum < 0.45

  const keep = infos.filter((p) => {
    const coversMost = p.areaHint >= maxArea * 0.55
    const isSimplePlate = p.pointCount > 0 && p.pointCount <= 8 && coversMost

    // 거의 전체 화면을 덮는 단순 사각형 = 배경 판
    if (isSimplePlate && infos.length > 1) return false
    if (coversMost && p.areaHint >= totalInkArea * 0.5 && infos.length > 1) {
      // 큰 면이면서 다른 path보다 단순하면 배경
      const othersMoreComplex = infos.some(
        (o) => o !== p && o.pointCount > p.pointCount * 1.5
      )
      if (othersMoreComplex || p.pointCount <= 12) return false
    }

    if (lightOnDark) {
      // 어두운 배경 유지 X, 밝은 글자만
      if (p.lum < 0.55 && coversMost) return false
      if (p.lum < 0.35) return false
      return p.lum >= 0.5
    }

    // 밝은 배경 + 어두운 잉크
    if (p.lum >= 0.78) return false
    if (coversMost && p.lum >= 0.4 && infos.some((o) => o.lum < 0.5 && o.areaHint < p.areaHint * 0.8)) {
      return false
    }
    return true
  })

  // 필터 결과가 없거나 통짜 판만 남으면 대체 전략
  let selected = keep
  if (selected.length === 0) {
    selected = lightOnDark
      ? infos.filter((p) => p.lum >= 0.5)
      : infos.filter((p) => p.lum < 0.75)
  }

  // 여전히 최대 면적 1장만이면, 그보다 작은 path들만 남기기
  if (selected.length === 1 && infos.length > 1) {
    const only = selected[0]
    if (only.areaHint >= maxArea * 0.7) {
      const smaller = infos.filter((p) => p.areaHint < only.areaHint * 0.85)
      if (smaller.length > 0) selected = smaller
    }
  }

  if (selected.length === 0) return svgContent

  let out = svgContent
  for (const p of infos) {
    if (!selected.includes(p)) {
      out = out.replace(p.raw, '')
    }
  }

  // 흰 글자(밝은 잉크)면 돌출용으로 검정 fill로 통일 — Three 필터와 맞춤
  if (lightOnDark) {
    out = out.replace(/\bfill\s*=\s*["'][^"']+["']/gi, 'fill="#0f172a"')
    out = out.replace(/\bstroke\s*=\s*["'][^"']+["']/gi, 'stroke="#0f172a"')
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
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
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

function countPathPoints(d: string): number {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)
  if (!nums) return 0
  return Math.floor(nums.length / 2)
}
