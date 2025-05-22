import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src/data')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Load interview data
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const interviewsData = JSON.parse(interviewsContent)
    const interview = interviewsData.interviews.find((i: any) => i.id === params.id)

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Load related job and candidate data
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')
    const candidatesContent = await fs.readFile(path.join(dataPath, 'candidates.json'), 'utf8')
    
    const jobsData = JSON.parse(jobsContent)
    const candidatesData = JSON.parse(candidatesContent)

    const job = jobsData.jobs.find((j: any) => j.id === interview.jobId)
    const candidate = candidatesData.candidates.find((c: any) => c.id === interview.candidateId)

    return NextResponse.json({ interview, job, candidate })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load interview' }, { status: 500 })
  }
} 