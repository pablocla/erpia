export interface CountryFeatures {
  showAfip: boolean
  showIibb: boolean
  showCaea: boolean
  showPadron: boolean
  showSat: boolean
  showCfdi: boolean
  showRfc: boolean
  defaultDocumentType: "CUIT" | "RFC"
}

const featuresAR: CountryFeatures = {
  showAfip: true,
  showIibb: true,
  showCaea: true,
  showPadron: true,
  showSat: false,
  showCfdi: false,
  showRfc: false,
  defaultDocumentType: "CUIT",
}

const featuresMX: CountryFeatures = {
  showAfip: false,
  showIibb: false,
  showCaea: false,
  showPadron: false,
  showSat: true,
  showCfdi: true,
  showRfc: true,
  defaultDocumentType: "RFC",
}

export function getCountryFeatures(paisFiscal: string): CountryFeatures {
  switch (paisFiscal.toUpperCase()) {
    case "MX":
      return featuresMX
    case "AR":
    default:
      return featuresAR
  }
}
