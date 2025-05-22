import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Interview } from '@/types'

const dataFilePath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ interviews: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { candidateId, jobId } = await request.json()

    // Load job and candidate data for the initial message
    const jobsContent = await fs.readFile(path.join(process.cwd(), 'src/data/jobs.json'), 'utf8')
    const candidatesContent = await fs.readFile(path.join(process.cwd(), 'src/data/candidates.json'), 'utf8')
    
    const jobsData = JSON.parse(jobsContent)
    const candidatesData = JSON.parse(candidatesContent)

    const job = jobsData.jobs.find((j: any) => j.id === jobId)
    const candidateData = candidatesData.candidates.find((c: any) => c.id === candidateId)

    if (!job || !candidateData) {
      return NextResponse.json({ error: 'Job or candidate not found' }, { status: 404 })
    }
    
    const interview: Interview = {
      id: uuidv4(),
      candidateId,
      jobId,
      status: 'in_progress',
      messages: [
        {
          role: 'system',
          content: `Welcome to your technical interview for the ${job.title} position. I'll be your AI interviewer today.

I'll be asking you questions about your technical experience and knowledge related to this role. Please:
- Take your time to provide detailed answers
- Feel free to ask for clarification if needed
- Share specific examples from your experience
- Be honest if you're not familiar with a topic

Let's begin with your first question: Could you tell me about your relevant experience and what interests you about this ${job.title} position?`,
          timestamp: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
    }

    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    data.interviews.push(interview)
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))

    // Update candidate with interview ID
    if (candidateData) {
      candidateData.interviewId = interview.id
      await fs.writeFile(path.join(process.cwd(), 'src/data/candidates.json'), JSON.stringify(candidatesData, null, 2))
    }

    return NextResponse.json({ success: true, interview })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 })
  }
} 