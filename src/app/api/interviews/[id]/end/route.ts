import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Interview, JobDescription, Candidate, ChatMessage } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data')
const MIN_QUESTIONS_FOR_POOR_PERFORMANCE = 5

// Helper function to count actual candidate responses
function countCandidateResponses(messages: ChatMessage[]): number {
  return messages.filter(msg => msg.role === 'user').length
}

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

    // Count actual candidate responses
    const responseCount = countCandidateResponses(interview.messages)

    // If no responses, mark as rejected with 0 score
    if (responseCount === 0) {
      interview.status = 'completed'
      interview.score = 0
      interview.feedback = `Interview ended with no responses from the candidate.\n\n` +
        `Final Score: 0/100\n` +
        `Questions Answered: 0/${MIN_QUESTIONS_FOR_POOR_PERFORMANCE} minimum required\n\n` +
        `Note: Candidate did not provide any responses during the interview.`

      // Update candidate status to rejected
      const candidateToUpdate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)
      if (candidateToUpdate) {
        candidateToUpdate.status = 'rejected'
        await fs.writeFile(path.join(dataPath, 'candidates.json'), JSON.stringify(candidatesData, null, 2))
      }

      // Save updated interview data
      await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

      return NextResponse.json({
        success: true,
        interview,
        message: 'Interview ended with no responses'
      })
    }

    // If there are responses but interview wasn't properly completed
    if (!interview.continuousScoring || !interview.score) {
      interview.status = 'completed'
      interview.score = Math.min(40, Math.round(30 * (responseCount / MIN_QUESTIONS_FOR_POOR_PERFORMANCE)))
      interview.feedback = `Interview ended prematurely.\n\n` +
        `Final Score: ${interview.score}/100\n` +
        `Questions Answered: ${responseCount}/${MIN_QUESTIONS_FOR_POOR_PERFORMANCE} minimum required\n\n` +
        `Note: Score was significantly reduced due to incomplete interview process.`

      // Update candidate status to rejected
      const candidateToUpdate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)
      if (candidateToUpdate) {
        candidateToUpdate.status = 'rejected'
        await fs.writeFile(path.join(dataPath, 'candidates.json'), JSON.stringify(candidatesData, null, 2))
      }
    }

    // Save updated interview data
    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

    return NextResponse.json({
      success: true,
      interview,
      message: 'Interview completed'
    })
  } catch (error) {
    console.error('Error in ending interview:', error)
    return NextResponse.json({ error: 'Failed to end interview' }, { status: 500 })
  }
} 