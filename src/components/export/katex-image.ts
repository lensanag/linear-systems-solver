import katex from 'katex';
import 'katex/dist/katex.css';

/**
 * Cache for rendered KaTeX expressions to avoid re-rendering
 * Maps LaTeX string → data URL
 */
const katexCache = new Map<string, string>();

/**
 * Render a KaTeX expression to an SVG data URL
 * 
 * Uses KaTeX's renderToString with SVG output, then converts SVG to base64 data URL.
 * This provides crisp mathematical notation in PDFs.
 * 
 * @param latex - LaTeX expression (e.g., "\\frac{1}{2}")
 * @returns Data URL (base64 SVG) for embedding in PDF
 */
export function renderKaTeXToDataURL(latex: string): string {
  // Check cache first
  if (katexCache.has(latex)) {
    return katexCache.get(latex)!;
  }

  try {
    // Render to HTML/SVG string
    const htmlString = katex.renderToString(latex, {
      displayMode: false,
      output: 'html', // Contains inline SVG
      throwOnError: false,
    });

    // Extract SVG from HTML
    const container = document.createElement('div');
    container.innerHTML = htmlString;
    const svg = container.querySelector('svg');

    if (!svg) {
      // Fallback if SVG not found
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(latex)}`;
      katexCache.set(latex, dataUrl);
      return dataUrl;
    }

    // Add padding and styling to SVG
    const padding = 2;
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, w, h] = viewBox.split(' ').map(Number);
      svg.setAttribute('viewBox', `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`);
    }
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Set background color to white
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const vb = svg.getAttribute('viewBox')?.split(' ') || ['0', '0', '100', '100'];
    bg.setAttribute('width', vb[2]);
    bg.setAttribute('height', vb[3]);
    bg.setAttribute('fill', 'white');
    svg.insertBefore(bg, svg.firstChild);

    // Serialize SVG to string
    let svgString = new XMLSerializer().serializeToString(svg);

    // Optimize SVG to reduce size
    svgString = optimizeSVG(svgString);

    // Convert to base64 data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    katexCache.set(latex, dataUrl);
    return dataUrl;
  } catch (error) {
    console.error('Failed to render KaTeX:', latex, error);
    // Fallback to text
    const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(latex)}`;
    katexCache.set(latex, dataUrl);
    return dataUrl;
  }
}



/**
 * Clear the KaTeX cache if needed (for testing or memory management)
 */
export function clearKaTeXCache(): void {
  katexCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getKaTeXCacheStats(): { size: number; expressions: string[] } {
  return {
    size: katexCache.size,
    expressions: Array.from(katexCache.keys()),
  };
}

/**
 * Optimize SVG size by removing unnecessary attributes and whitespace
 */
function optimizeSVG(svgString: string): string {
  // Remove newlines and excess whitespace
  let optimized = svgString.replace(/\s+/g, ' ').trim();

  // Remove default values and unnecessary attributes
  optimized = optimized.replace(/style="[^"]*"/g, ''); // Remove inline styles
  optimized = optimized.replace(/fill="#000000"/g, ''); // Remove default black fill
  optimized = optimized.replace(/stroke="none"/g, ''); // Remove default no-stroke

  return optimized;
}
