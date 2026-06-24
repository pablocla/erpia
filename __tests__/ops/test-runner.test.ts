import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { runSmokeTests } from "@/lib/ops/test-runner"

vi.mock("child_process", () => ({
  exec: vi.fn(),
}))

import { exec } from "child_process"

describe("test-runner", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv("OPS_TEST_RUNNER_ENABLED", "true")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("simula cuando OPS_TEST_RUNNER_ENABLED=false", async () => {
    vi.stubEnv("OPS_TEST_RUNNER_ENABLED", "false")
    const result = await runSmokeTests()
    expect(result.simulated).toBe(true)
    expect(result.passed).toBe(true)
  })

  it("parses successful JSON report from vitest", async () => {
    const mockOutput = {
      numTotalTests: 4,
      numFailedTests: 0,
      testResults: [
        { name: "readiness 1", status: "passed" },
        { name: "readiness 2", status: "passed" },
      ],
    }

    const execMock = exec as unknown as any
    execMock.mockImplementation((cmd: string, opts: any, callback: any) => {
      callback(null, { stdout: JSON.stringify(mockOutput), stderr: "" })
    })

    const res = await runSmokeTests()
    expect(res.passed).toBe(true)
    expect(res.simulated).toBe(false)
    expect(res.totalTests).toBe(4)
    expect(res.failedTests).toBeUndefined()
  })

  it("handles failed tests in JSON output", async () => {
    const mockOutput = {
      numTotalTests: 5,
      numFailedTests: 2,
      testResults: [
        { name: "readiness 1", status: "passed" },
        { name: "readiness 2", status: "failed" },
        { name: "readiness 3", status: "failed" },
      ],
    }

    const execMock = exec as unknown as any
    execMock.mockImplementation((cmd: string, opts: any, callback: any) => {
      const err = new Error("Command failed")
      ;(err as any).stdout = JSON.stringify(mockOutput)
      ;(err as any).stderr = "Failures detected"
      callback(err, { stdout: JSON.stringify(mockOutput), stderr: "Failures detected" })
    })

    const res = await runSmokeTests()
    expect(res.passed).toBe(false)
    expect(res.simulated).toBe(false)
    expect(res.totalTests).toBe(5)
    expect(res.failedTests).toEqual(["readiness 2", "readiness 3"])
  })
})