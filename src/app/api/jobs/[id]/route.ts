import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { JobDescription } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/jobs.json')

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updatedJob: JobDescription = await request.json()
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const jobIndex = data.jobs.findIndex((j: JobDescription) => j.id === params.id)
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    data.jobs[jobIndex] = {
      ...data.jobs[jobIndex],
      ...updatedJob,
    }

    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true, job: data.jobs[jobIndex] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const jobIndex = data.jobs.findIndex((j: JobDescription) => j.id === params.id)
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if any candidates are linked to this job
    const candidatesPath = path.join(process.cwd(), 'src/data/candidates.json')
    const candidatesContent = await fs.readFile(candidatesPath, 'utf8')
    const candidatesData = JSON.parse(candidatesContent)
    
    const linkedCandidates = candidatesData.candidates.some((c: any) => c.jobId === params.id)
    if (linkedCandidates) {
      return NextResponse.json(
        { error: 'Cannot delete job with linked candidates' },
        { status: 400 }
      )
    }

    data.jobs.splice(jobIndex, 1)
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
} 