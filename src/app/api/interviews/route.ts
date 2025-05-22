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

    // Create initial system message with interview context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `Welcome to your technical interview for the ${job.title} position. I'll be your AI interviewer today.

I'll be asking you questions about your technical experience and knowledge related to this role. Please:
- Take your time to provide detailed answers
- Feel free to ask for clarification if needed
- Share specific examples from your experience
- Be honest if you're not familiar with a topic`,
      timestamp: new Date().toISOString(),
    }

    // Create initial AI message
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello! I'll be conducting your technical interview for the ${job.title} position today. Let's start by having you tell me about your relevant experience and what interests you about this role.`,
      timestamp: new Date().toISOString(),
    }

    // Create new interview
    const interview: Interview = {
      id: uuidv4(),
      candidateId,
      jobId,
      status: 'in_progress',
      messages: [systemMessage, aiMessage],
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