import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Interview, Candidate, JobDescription } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch interviews:', error)
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { candidateId, jobId } = await request.json()
    
    // Load candidate and job data
    const candidatesContent = await fs.readFile(path.join(process.cwd(), 'src/data/candidates.json'), 'utf8')
    const jobsContent = await fs.readFile(path.join(process.cwd(), 'src/data/jobs.json'), 'utf8')
    const candidatesData = JSON.parse(candidatesContent)
    const jobsData = JSON.parse(jobsContent)
    
    const candidate = candidatesData.candidates.find((c: Candidate) => c.id === candidateId)
    const job = jobsData.jobs.find((j: JobDescription) => j.id === jobId)

    if (!candidate || !job) {
      return NextResponse.json({ error: 'Candidate or job not found' }, { status: 404 })
    }

    // Create new interview
    const interview: Interview = {
      id: uuidv4(),
      candidateId,
      jobId,
      status: 'in_progress',
      messages: [
        {
          role: 'system',
          content: 'Interview started. The AI interviewer will now begin the assessment.',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    }

    // Update candidate with interview ID
    candidate.interviewId = interview.id
    await fs.writeFile(path.join(process.cwd(), 'src/data/candidates.json'), JSON.stringify(candidatesData, null, 2))

    // Save interview
    const interviewsContent = await fs.readFile(dataPath, 'utf8')
    const interviewsData = JSON.parse(interviewsContent)
    interviewsData.interviews.push(interview)
    await fs.writeFile(dataPath, JSON.stringify(interviewsData, null, 2))

    return NextResponse.json({ success: true, interview })
  } catch (error) {
    console.error('Failed to create interview:', error)
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 })
  }
} 