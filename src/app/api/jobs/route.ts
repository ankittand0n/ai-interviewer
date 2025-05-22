import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { JobDescription } from '@/types'

const dataFilePath = path.join(process.cwd(), 'src/data/jobs.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ jobs: [] })
  }
}

export async function POST(request: Request) {
  try {
    const job: JobDescription = await request.json()
    const fileContent = await fs.readFile(dataFilePath, 'utf8')
    const data = JSON.parse(fileContent)
    data.jobs.push(job)
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true, job })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add job' }, { status: 500 })
  }
} 