const fs = require('fs');
const filepath = 'app/dashboard/configuracion/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const target1 = `  const searchParams = useSearchParams()
  useEffect(() => {
    if (seccionActiva) return
    const sec = searchParams.get("section") || searchParams.get("seccion")
    if (!sec) return
    const normalized = sec.toLowerCase() as SectionKey
    if (SECCIONES.some((s) => s.key === normalized)) {
      setSeccionActiva(normalized)
    }
  }, [searchParams, seccionActiva])`;

const rep1 = `  const searchParams = useSearchParams()
  const [countryFeatures, setCountryFeatures] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    async function fetchCountryFeatures() {
      try {
        const res = await fetch("/api/config/country-context", { headers: authHeaders() })
        if (res.ok) {
          const data = await res.json()
          if (data?.features) setCountryFeatures(data.features)
        }
      } catch (e) {}
    }
    fetchCountryFeatures()
  }, [authHeaders])

  useEffect(() => {
    if (seccionActiva) return
    const sec = searchParams.get("section") || searchParams.get("seccion")
    if (!sec) return
    const normalized = sec.toLowerCase() as SectionKey
    if (SECCIONES.some((s) => s.key === normalized)) {
      if (normalized === "afip" && countryFeatures && countryFeatures.showAfip === false) return
      setSeccionActiva(normalized)
    }
  }, [searchParams, seccionActiva, countryFeatures])`;

content = content.replace(target1, rep1);

const target2 = `            {SECCIONES.filter(s => s.key === "empresa" || s.key === "afip").map((sec) => {`;
const rep2 = `            {SECCIONES.filter(s => s.key === "empresa" || (s.key === "afip" && (!countryFeatures || countryFeatures.showAfip !== false))).map((sec) => {`;
content = content.replace(target2, rep2);

const target3 = `                {SECCIONES.filter(s => s.grupo === grupo).map((sec) => {`;
const rep3 = `                {SECCIONES.filter(s => s.grupo === grupo && (s.key !== "afip" || !countryFeatures || countryFeatures.showAfip !== false)).map((sec) => {`;
content = content.replace(target3, rep3);

fs.writeFileSync(filepath, content);
console.log("Successfully replaced contents");
