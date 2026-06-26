export function cloudAuthHeaders(json = false): HeadersInit {
  if (typeof window === "undefined") return json ? { "Content-Type": "application/json" } : {}
  const token = localStorage.getItem("token")
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (json) headers["Content-Type"] = "application/json"
  return headers
}