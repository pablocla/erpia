/**
 * Vercel API Client for Ops Orchestrator.
 * 
 * Env vars requeridas:
 * - VERCEL_TOKEN
 * - VERCEL_PROJECT_ID 
 * - VERCEL_TEAM_ID (opcional, si el proyecto está en un team)
 * - OPS_ORCHESTRATOR_ENABLED=false (safe mode por defecto)
 */

const VERCEL_API = "https://api.vercel.com"

function getHeaders() {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error("VERCEL_TOKEN no configurado")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }
}

function getBaseUrl(path: string) {
  const teamId = process.env.VERCEL_TEAM_ID
  const url = new URL(`${VERCEL_API}${path}`)
  if (teamId) {
    url.searchParams.append("teamId", teamId)
  }
  return url.toString()
}

export async function createDeployment(branch = "main", targetProjectId?: string) {
  const projectId = targetProjectId || process.env.VERCEL_PROJECT_ID
  if (!projectId) throw new Error("VERCEL_PROJECT_ID no configurado")

  const url = getBaseUrl("/v13/deployments")
  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: "claver-cloud",
      project: projectId,
      target: "production",
      gitSource: {
        type: "github",
        ref: branch,
      }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error en Vercel createDeployment: ${err}`)
  }

  const data = await response.json()
  return data // { id, url, readyState, ... }
}

export async function getDeploymentStatus(deploymentId: string) {
  const url = getBaseUrl(`/v13/deployments/${deploymentId}`)
  const response = await fetch(url, {
    headers: getHeaders()
  })
  
  if (!response.ok) {
    throw new Error(`Error obteniendo status del deploy ${deploymentId}`)
  }
  return response.json()
}
