import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Interview } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data')

export async function GET() {
  try {
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')
    
    const interviewsData = JSON.parse(interviewsContent)
    const jobsData = JSON.parse(jobsContent)

    // Filter completed interviews and add job information
    const archivedInterviews = interviewsData.interviews
      .filter((interview: Interview) => interview.status === 'completed')
      .map((interview: Interview) => {
        const job = jobsData.jobs.find((j: any) => j.id === interview.jobId)
        return {
          id: interview.id,
          status: interview.status,
          score: interview.score,
          feedback: interview.feedback,
          createdAt: interview.createdAt,
          continuousScoring: interview.continuousScoring,
          job: job ? {
            title: job.title,
            requirements: job.requirements
          } : undefined
        }
      })
      .sort((a: Interview, b: Interview) => {
        // Sort by date, most recent first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return NextResponse.json({ interviews: archivedInterviews })
  } catch (error) {
    console.error('Failed to fetch archived interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived interviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 