import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Interview, Candidate, JobDescription, ChatMessage } from '@/types'
import { generateInterviewResponse } from '@/lib/openai'

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

    // Read the current interviews data
    const interviewsContent = await fs.readFile(dataPath, 'utf8')
    const interviewsData = JSON.parse(interviewsContent)

    // Read candidates data to get candidate details
    const candidatesPath = path.join(process.cwd(), 'src/data/candidates.json')
    const candidatesContent = await fs.readFile(candidatesPath, 'utf8')
    const candidatesData = JSON.parse(candidatesContent)

    const candidate = candidatesData.candidates.find((c: any) => c.id === candidateId)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Get job details
    const jobsPath = path.join(process.cwd(), 'src/data/jobs.json')
    const jobsContent = await fs.readFile(jobsPath, 'utf8')
    const jobsData = JSON.parse(jobsContent)
    const job = jobsData.jobs.find((j: any) => j.id === jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create new interview
    const newInterview = {
      id: uuidv4(),
      candidateId,
      candidateName: candidate.name,
      jobId,
      jobTitle: job.title,
      status: 'scheduled',
      messages: [
        {
          role: 'system',
          content: `Welcome to your technical interview for the ${job.title} position. I'll be your AI interviewer today.

I'll be asking you questions about your technical experience and knowledge related to this role. Please:
- Take your time to provide detailed answers
- Feel free to ask for clarification if needed
- Share specific examples from your experience
- Be honest if you're not familiar with a topic`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    interviewsData.interviews.push(newInterview)

    // Update candidate's interview status
    candidate.interviewScheduled = true
    await fs.writeFile(candidatesPath, JSON.stringify(candidatesData, null, 2))

    // Save updated interviews data
    await fs.writeFile(dataPath, JSON.stringify(interviewsData, null, 2))

    return NextResponse.json(newInterview)
  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: 'Failed to create interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 