import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { Interview, JobDescription, Candidate } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

interface ChatMessage {
  role: 'system' | 'assistant' | 'user'
  content: string
  timestamp: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const interview = data.interviews.find((i: any) => i.id === params.id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    return NextResponse.json(interview)
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
  { params }: { params: { id: string } }
) {
  try {
    const { status, feedback, message } = await request.json()
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const interview = data.interviews.find((i: any) => i.id === params.id)
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

      // Get job details for context
      const jobsPath = path.join(process.cwd(), 'src/data/jobs.json')
      const jobsContent = await fs.readFile(jobsPath, 'utf8')
      const jobsData = JSON.parse(jobsContent)
      const job = jobsData.jobs.find((j: any) => j.id === interview.jobId)

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are conducting a ${interview.type} interview for a ${job.title} position. 
            Previous messages: ${JSON.stringify(interview.messages)}
            Job requirements: ${job.requirements}
            Interview type: ${interview.type}
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

    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))

    return NextResponse.json(interview)
  } catch (error) {
    console.error('Failed to update interview:', error)
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const interviewIndex = data.interviews.findIndex((i: any) => i.id === params.id)
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
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete interview:', error)
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 })
  }
} 