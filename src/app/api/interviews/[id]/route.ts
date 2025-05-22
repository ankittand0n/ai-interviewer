import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { Interview, JobDescription, Candidate } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const dataPath = path.join(process.cwd(), 'src/data')

interface ChatMessage {
  role: 'system' | 'assistant' | 'user'
  content: string
  timestamp: string
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const interviewsData = JSON.parse(interviewsContent)
    
    const interview = interviewsData.interviews.find((i: Interview) => i.id === id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Load job data
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')
    const jobsData = JSON.parse(jobsContent)
    const job = jobsData.jobs.find((j: JobDescription) => j.id === interview.jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Only return necessary information for public access
    const publicInterview = {
      id: interview.id,
      status: interview.status,
      messages: interview.messages,
      elapsedTime: interview.elapsedTime,
      score: interview.status === 'completed' ? interview.score : undefined,
      feedback: interview.status === 'completed' ? interview.feedback : undefined,
      job: {
        title: job.title,
        requirements: job.requirements,
        type: interview.type || 'technical' // Fallback to technical if not specified
      },
      createdAt: interview.createdAt
    }

    return NextResponse.json(publicInterview)
  } catch (error) {
    console.error('Failed to fetch interview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const { status, feedback, message } = await request.json()
    const fileContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const data = JSON.parse(fileContent)
    
    const interview = data.interviews.find((i: any) => i.id === id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Initialize messages array if it doesn't exist
    if (!interview.messages) {
      interview.messages = []
    }

    // Handle status and feedback update
    if (status) {
      interview.status = status
      interview.feedback = feedback
      interview.updatedAt = new Date().toISOString()

      // If interview is completed or cancelled, update candidate status
      if (status === 'completed' || status === 'cancelled') {
        const candidatesPath = path.join(process.cwd(), 'src/data/candidates.json')
        const candidatesContent = await fs.readFile(candidatesPath, 'utf8')
        const candidatesData = JSON.parse(candidatesContent)

        const candidate = candidatesData.candidates.find(
          (c: any) => c.id === interview.candidateId
        )
        if (candidate) {
          candidate.interviewScheduled = false
          await fs.writeFile(candidatesPath, JSON.stringify(candidatesData, null, 2))
        }
      }
    }

    // Handle new chat message
    if (message) {
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }
      interview.messages.push(userMessage)

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are conducting a ${interview.job.type} interview for a ${interview.job.title} position. 
            Previous messages: ${JSON.stringify(interview.messages)}
            Job requirements: ${interview.job.requirements.join('\n')}
            Interview type: ${interview.job.type}
            Please provide a relevant response or follow-up question.`
          },
          { role: "user", content: message }
        ]
      })

      const aiResponse = completion.choices[0].message.content
      if (!aiResponse) throw new Error('No response from AI')

      // Add AI response
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }
      interview.messages.push(aiMessage)
    }

    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(data, null, 2))

    return NextResponse.json(interview)
  } catch (error) {
    console.error('Failed to update interview:', error)
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const fileContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const data = JSON.parse(fileContent)
    
    const interviewIndex = data.interviews.findIndex((i: any) => i.id === id)
    if (interviewIndex === -1) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Check if interview is in progress
    const interview = data.interviews[interviewIndex]
    if (interview.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot delete an interview that is in progress' },
        { status: 400 }
      )
    }

    // Remove interview from candidate
    const candidatesPath = path.join(process.cwd(), 'src/data/candidates.json')
    const candidatesContent = await fs.readFile(candidatesPath, 'utf8')
    const candidatesData = JSON.parse(candidatesContent)
    
    const candidate = candidatesData.candidates.find((c: any) => c.id === interview.candidateId)
    if (candidate) {
      candidate.interviewScheduled = false
      await fs.writeFile(candidatesPath, JSON.stringify(candidatesData, null, 2))
    }

    // Delete the interview
    data.interviews.splice(interviewIndex, 1)
    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete interview:', error)
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 })
  }
} 