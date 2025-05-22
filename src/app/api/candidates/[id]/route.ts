import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Candidate, Interview } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/candidates.json')

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const updatedCandidate: Candidate = await request.json()
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const candidateIndex = data.candidates.findIndex((c: Candidate) => c.id === id)
    if (candidateIndex === -1) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    data.candidates[candidateIndex] = {
      ...data.candidates[candidateIndex],
      ...updatedCandidate,
    }

    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true, candidate: data.candidates[candidateIndex] })
  } catch (error) {
    console.error('Failed to update candidate:', error)
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
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
    
    const candidateIndex = data.candidates.findIndex((c: Candidate) => c.id === id)
    if (candidateIndex === -1) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Check if candidate has an ongoing interview
    const interviewsPath = path.join(process.cwd(), 'src/data/interviews.json')
    const interviewsContent = await fs.readFile(interviewsPath, 'utf8')
    const interviewsData = JSON.parse(interviewsContent)
    
    const hasOngoingInterview = interviewsData.interviews.some(
      (interview: Interview) => interview.candidateId === id && interview.status === 'in_progress'
    )
    if (hasOngoingInterview) {
      return NextResponse.json(
        { error: 'Cannot delete candidate with ongoing interview' },
        { status: 400 }
      )
    }

    data.candidates.splice(candidateIndex, 1)
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete candidate:', error)
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 })
  }
} 