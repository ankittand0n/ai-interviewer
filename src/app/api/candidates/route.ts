import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Candidate } from '@/types'

const dataPath = path.join(process.cwd(), 'src/data/candidates.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch candidates:', error)
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const candidate: Candidate = await request.json()
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)

    const newCandidate = {
      ...candidate,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }

    data.candidates.push(newCandidate)
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true, candidate: newCandidate })
  } catch (error) {
    console.error('Failed to create candidate:', error)
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
  }
} 