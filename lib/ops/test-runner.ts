import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export interface TestRunResult {
  passed: boolean
  simulated: boolean
  durationMs: number
  totalTests?: number
  failedTests?: string[]
  stdout?: string
  stderr?: string
}

function parseVitestOutput(stdout: string, stderr: string, durationMs: number): TestRunResult {
  let passed = true
  let totalTests = 0
  const failedTests: string[] = []

  try {
    const json = JSON.parse(stdout) as {
      numTotalTests?: number
      numFailedTests?: number
      testResults?: { name: string; status: string }[]
    }
    totalTests = json.numTotalTests ?? 0
    passed = (json.numFailedTests ?? 0) === 0
    for (const suite of json.testResults ?? []) {
      if (suite.status === "failed") failedTests.push(suite.name)
    }
  } catch {
    passed = !stderr.toLowerCase().includes("fail")
  }

  return {
    passed,
    simulated: false,
    durationMs,
    totalTests,
    failedTests: failedTests.length ? failedTests : undefined,
    stdout: stdout.slice(0, 4000),
    stderr: stderr.slice(0, 2000),
  }
}

export async function runSmokeTests(timeoutMs = 120_000): Promise<TestRunResult> {
  const start = Date.now()

  if (process.env.OPS_TEST_RUNNER_ENABLED !== "true") {
    return {
      passed: true,
      simulated: true,
      durationMs: Date.now() - start,
      stdout: "OPS_TEST_RUNNER_ENABLED=false — simulado",
    }
  }

  try {
    const { stdout, stderr } = await execAsync(
      "npx vitest run __tests__/smoke/ --reporter=json",
      { timeout: timeoutMs, cwd: process.cwd() },
    )

    return parseVitestOutput(stdout, stderr, Date.now() - start)
  } catch (error: any) {
    const stdout = error?.stdout ?? ""
    const stderr = error?.stderr ?? ""
    if (stdout) {
      try {
        return parseVitestOutput(stdout, stderr, Date.now() - start)
      } catch {
        // Fallback
      }
    }
    const msg = error instanceof Error ? error.message : String(error)
    return {
      passed: false,
      simulated: false,
      durationMs: Date.now() - start,
      failedTests: ["smoke_suite"],
      stderr: msg.slice(0, 2000),
    }
  }
}