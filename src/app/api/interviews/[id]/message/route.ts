import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { ChatMessage, Interview, JobDescription, Candidate } from '@/types'
import { generateInterviewResponse, generateInterviewFeedback } from '@/lib/openai'

const dataPath = path.join(process.cwd(), 'src/data')
const INTERVIEW_DURATION = 45 * 60 * 1000 // 45 minutes in milliseconds

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const { message, elapsedTime } = await request.json()

    // Load all necessary data
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')
    const candidatesContent = await fs.readFile(path.join(dataPath, 'candidates.json'), 'utf8')

    const interviewsData = JSON.parse(interviewsContent)
    const jobsData = JSON.parse(jobsContent)
    const candidatesData = JSON.parse(candidatesContent)

    const interview = interviewsData.interviews.find((i: Interview) => i.id === id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const job = jobsData.jobs.find((j: JobDescription) => j.id === interview.jobId)
    const candidate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)

    // Update elapsed time
    interview.elapsedTime = elapsedTime

    // Check if interview should be completed based on elapsed time
    if (elapsedTime >= INTERVIEW_DURATION) {
      interview.status = 'completed'
      
      // Generate comprehensive feedback
      const { score, feedback } = await generateInterviewFeedback(interview, job, candidate)
      interview.score = score
      interview.feedback = feedback

      // Update candidate status
      const candidateToUpdate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)
      if (candidateToUpdate) {
        candidateToUpdate.status = 'interviewed'
        await fs.writeFile(path.join(dataPath, 'candidates.json'), JSON.stringify(candidatesData, null, 2))
      }

      // Save updated interview data
      await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

      return NextResponse.json({
        success: true,
        interview,
        job,
        candidate,
        message: 'Interview time limit reached'
      })
    }

    // Add user message
    interview.messages.push(message)

    // Generate AI response using OpenAI
    const aiResponse = await generateInterviewResponse(message.content, interview, job, candidate)
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    }
    interview.messages.push(aiMessage)

    // Save updated interview data
    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

    return NextResponse.json({
      success: true,
      interview,
      job,
      candidate,
    })
  } catch (error) {
    console.error('Error in message handling:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
} 