import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  status: string
  appliedFor: string
  jobId: string
  experience: string
  currentRole: string
  currentCompany: string
  location: string
  createdAt: string
  lastInterviewDate: string
  interviewStage: string
  skills: string[]
  education: {
    degree: string
    university: string
    graduationYear: number
  }
}

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data')
    const candidatesContent = await fs.readFile(path.join(dataPath, 'candidates.json'), 'utf8')
    const candidatesData = JSON.parse(candidatesContent)

    // Filter active candidates
    const activeCandidates = candidatesData.candidates
      .filter((candidate: Candidate) => candidate.status === 'active')
      .map((candidate: Candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
        appliedFor: candidate.appliedFor,
        jobId: candidate.jobId,
        experience: candidate.experience,
        currentRole: candidate.currentRole,
        currentCompany: candidate.currentCompany,
        location: candidate.location,
        createdAt: candidate.createdAt,
        lastInterviewDate: candidate.lastInterviewDate,
        interviewStage: candidate.interviewStage,
        skills: candidate.skills,
        education: candidate.education
      }))

    return NextResponse.json({ candidates: activeCandidates })
  } catch (error) {
    console.error('Error loading active candidates:', error)
    return NextResponse.json(
      { error: 'Failed to load active candidates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 