import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Interview, JobDescription, Candidate } from '@/types'
import { generateInterviewFeedback } from '@/lib/openai'

const dataPath = path.join(process.cwd(), 'src/data')

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
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

    if (interview.status === 'completed') {
      return NextResponse.json({ error: 'Interview is already completed' }, { status: 400 })
    }

    // Mark interview as completed
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
    })
  } catch (error) {
    console.error('Error in ending interview:', error)
    return NextResponse.json({ error: 'Failed to end interview' }, { status: 500 })
  }
} 