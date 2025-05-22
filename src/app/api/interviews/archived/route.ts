import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Filter archived interviews (completed or cancelled)
    const archivedInterviews = data.interviews.filter(
      (interview: any) => 
        interview.status === 'completed' || 
        interview.status === 'cancelled'
    ).sort((a: any, b: any) => {
      // Sort by createdAt date, most recent first
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
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