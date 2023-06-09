import axios, {AxiosResponse} from 'axios'
import {submitMetircs} from './datadog'

interface BatchRuns {
  organization_name: string
  project_name: string
  batch_runs: BatchRun[]
}

interface BatchRun {
  batch_run_number: number
  test_setting_name: string
  status: string
  started_at: string
  finished_at: string
  test_cases: TestCases
  url: string
}

interface TestCases {
  succeeded: number
  failed: number
  aborted: number
  unresolved: number
  total: number
}

export async function getBatchRuns(
  magicpod_api_token: string,
  magicpod_organization_name: string,
  magicpod_project_name: string,
  magicpod_record_count: string
): Promise<BatchRuns | null> {
  const url = `https://app.magicpod.com/api/v1.0/${magicpod_organization_name}/${magicpod_project_name}/batch-runs/?count=${magicpod_record_count}`
  const headers = {
    accept: 'application/json',
    Authorization: `Token ${magicpod_api_token}`
  }

  try {
    const response: AxiosResponse<BatchRuns> = await axios.get(url, {headers})
    return response.data
  } catch (error) {
    console.error(`Error: ${error}`)
    return null
  }
}

export function processBatchRunsData(batchRunsData: BatchRuns): void {
  const organization_name = batchRunsData.organization_name
  const project_name = batchRunsData.project_name

  batchRunsData.batch_runs.forEach((batchRun, index) => {
    const durationSeconds = calculateTimeDifferenceSecond(
      batchRun.started_at,
      batchRun.finished_at
    )

    const batch_run_number = batchRun.batch_run_number
    const test_setting_name = batchRun.test_setting_name
    const status = batchRun.status
    const started_at = batchRun.started_at
    const timestampSeconds = getUnixTimestampSeconds(started_at)

    submitMetircs(
      timestampSeconds,
      durationSeconds,
      batch_run_number,
      test_setting_name,
      status,
      organization_name,
      project_name
    )
  })
}

function getUnixTimestampSeconds(dateString: string): number {
  const dateObject: Date = new Date(dateString)
  const unixTimestamp: number = dateObject.getTime()

  return unixTimestamp / 1000 // seconds
}

function calculateTimeDifferenceSecond(time1: string, time2: string): number {
  const date1 = new Date(time1)
  const date2 = new Date(time2)

  const difference = Math.abs(date2.getTime() - date1.getTime()) // milli seconds

  return difference / 1000 // seconds
}
