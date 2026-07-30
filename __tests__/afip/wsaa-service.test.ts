import { describe, it, expect, beforeEach } from "vitest"
import {
  invalidateTaCache,
  getTaCacheStats,
  signTRA,
} from "@/lib/afip/wsaa-service"
import forge from "node-forge"

function makeSelfSignedPem(): { certB64: string; keyB64: string } {
  const keys = forge.pki.rsa.generateKeyPair(1024)
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = "01"
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)
  const attrs = [{ name: "commonName", value: "Test AFIP" }]
  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(keys.privateKey, forge.md.sha256.create())
  const certPem = forge.pki.certificateToPem(cert)
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey)
  return {
    certB64: Buffer.from(certPem).toString("base64"),
    keyB64: Buffer.from(keyPem).toString("base64"),
  }
}

describe("wsaa-service", () => {
  beforeEach(() => {
    invalidateTaCache()
  })

  it("invalida cache", () => {
    invalidateTaCache()
    expect(getTaCacheStats().size).toBe(0)
  })

  it("firma TRA y produce CMS base64", () => {
    const { certB64, keyB64 } = makeSelfSignedPem()
    const tra = `<?xml version="1.0"?><loginTicketRequest version="1.0"><header><uniqueId>1</uniqueId></header><service>wsfe</service></loginTicketRequest>`
    const cms = signTRA(tra, certB64, keyB64)
    expect(cms.length).toBeGreaterThan(50)
    // base64 decodable
    expect(() => Buffer.from(cms, "base64")).not.toThrow()
  })
})
