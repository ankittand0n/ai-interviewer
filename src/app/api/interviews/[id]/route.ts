import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Interview, JobDescription, Candidate } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    const interview = data.interviews.find((i: Interview) => i.id === id)

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Load related job and candidate data
    const jobsContent = await fs.readFile(path.join(process.cwd(), 'src/data/jobs.json'), 'utf8')
    const candidatesContent = await fs.readFile(path.join(process.cwd(), 'src/data/candidates.json'), 'utf8')
    const jobsData = JSON.parse(jobsContent)
    const candidatesData = JSON.parse(candidatesContent)

    const job = jobsData.jobs.find((j: JobDescription) => j.id === interview.jobId)
    const candidate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)

    return NextResponse.json({ interview, job, candidate })
  } catch (error) {
    console.error('Failed to fetch interview:', error)
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const interviewIndex = data.interviews.findIndex((i: Interview) => i.id === id)
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

    // Remove interview ID from candidate
    const candidatesPath = path.join(process.cwd(), 'src/data/candidates.json')
    const candidatesContent = await fs.readFile(candidatesPath, 'utf8')
    const candidatesData = JSON.parse(candidatesContent)
    
    const candidate = candidatesData.candidates.find((c: Candidate) => c.id === interview.candidateId)
    if (candidate && candidate.interviewId === id) {
      delete candidate.interviewId
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