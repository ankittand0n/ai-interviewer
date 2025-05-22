import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface Job {
  id: string
  title: string
  department: string
  location: string
  experience: string
  status: string
  createdAt: string
  interviewsCompleted: number
  interviewsScheduled: number
  description: string
  requirements: string[]
}

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data')
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')
    const jobsData = JSON.parse(jobsContent)

    // Filter active jobs and map to include only necessary fields
    const activeJobs = jobsData.jobs
      .filter((job: Job) => job.status === 'active')
      .map((job: Job) => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        experience: job.experience,
        status: job.status,
        createdAt: job.createdAt,
        interviewsCompleted: job.interviewsCompleted,
        interviewsScheduled: job.interviewsScheduled
      }))

    return NextResponse.json({ jobs: activeJobs })
  } catch (error) {
    console.error('Error loading jobs:', error)
    return NextResponse.json(
      { error: 'Failed to load jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 