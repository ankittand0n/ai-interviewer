import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src/data')

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const interviewsData = JSON.parse(interviewsContent)
    
    const interview = interviewsData.interviews.find((i: any) => i.id === id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    if (interview.status !== 'scheduled') {
      return NextResponse.json({ error: 'Interview cannot be started' }, { status: 400 })
    }

    // Update interview status
    interview.status = 'in_progress'
    interview.startedAt = new Date().toISOString()
    interview.elapsedTime = 0

    // Save updated interview data
    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

    return NextResponse.json({
      id: interview.id,
      status: interview.status,
      messages: interview.messages,
      elapsedTime: interview.elapsedTime,
      startedAt: interview.startedAt,
      job: {
        title: interview.jobTitle
      }
    })
  } catch (error) {
    console.error('Failed to start interview:', error)
    return NextResponse.json({ error: 'Failed to start interview' }, { status: 500 })
  }
} 