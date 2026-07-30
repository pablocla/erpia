import { describe, expect, it } from "vitest"
import {
  buildGoogleMapsUrl,
  buildWazeUrl,
  buildAppleMapsUrl,
  buildRouteGoogleMapsUrl,
} from "@/lib/maps/mobile-directions"

describe("mobile-directions", () => {
  const coords = { lat: -34.6037, lon: -58.3816, direccion: "Av. Corrientes 1234" }
  const textOnly = { direccion: "San Martín 500, Rosario" }

  it("builds google maps url with coords or text", () => {
    expect(buildGoogleMapsUrl(coords)).toBe("https://www.google.com/maps/dir/?api=1&destination=-34.6037,-58.3816")
    expect(buildGoogleMapsUrl(textOnly)).toBe("https://www.google.com/maps/dir/?api=1&destination=San%20Mart%C3%ADn%20500%2C%20Rosario")
    expect(buildGoogleMapsUrl({})).toBeNull()
  })

  it("builds waze url with coords or text", () => {
    expect(buildWazeUrl(coords)).toBe("https://waze.com/ul?ll=-34.6037,-58.3816&navigate=yes")
    expect(buildWazeUrl(textOnly)).toBe("https://waze.com/ul?q=San%20Mart%C3%ADn%20500%2C%20Rosario&navigate=yes")
    expect(buildWazeUrl({})).toBeNull()
  })

  it("builds apple maps url with coords or text", () => {
    expect(buildAppleMapsUrl(coords)).toBe("https://maps.apple.com/?daddr=-34.6037,-58.3816")
    expect(buildAppleMapsUrl(textOnly)).toBe("https://maps.apple.com/?daddr=San%20Mart%C3%ADn%20500%2C%20Rosario")
    expect(buildAppleMapsUrl({})).toBeNull()
  })

  it("builds multi-waypoint google maps route url", () => {
    const p1 = { lat: -34.1, lon: -58.1 }
    const p2 = { lat: -34.2, lon: -58.2 }
    const p3 = { lat: -34.3, lon: -58.3 }

    const url = buildRouteGoogleMapsUrl([p1, p2, p3])
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&origin=-34.1,-58.1&destination=-34.3,-58.3&waypoints=-34.2,-58.2")
  })
})
