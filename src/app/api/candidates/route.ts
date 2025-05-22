import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Candidate } from '@/types'

const dataFilePath = path.join(process.cwd(), 'src/data/candidates.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ candidates: [] })
  }
}

export async function POST(request: Request) {
  try {
    const candidate: Candidate = await request.json()
    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    data.candidates.push(candidate)
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true, candidate })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 })
  }
} 