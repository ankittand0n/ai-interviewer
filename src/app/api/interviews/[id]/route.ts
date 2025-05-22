import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Interview, JobDescription, Candidate } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    const interview = data.interviews.find((i: Interview) => i.id === id)

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Load related job and candidate data
    const jobsContent = await fs.readFile(path.join(process.cwd(), 'src/data/jobs.json'), 'utf8')
    const candidatesContent = await fs.readFile(path.join(process.cwd(), 'src/data/candidates.json'), 'utf8')
    const jobsData = JSON.parse(jobsContent)
    const candidatesData = JSON.parse(candidatesContent)

    const job = jobsData.jobs.find((j: JobDescription) => j.id === interview.jobId)
    const candidate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)

    return NextResponse.json({ interview, job, candidate })
  } catch (error) {
    console.error('Failed to fetch interview:', error)
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
  }
} 