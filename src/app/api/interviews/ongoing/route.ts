import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src/data/interviews.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Filter ongoing interviews (in progress only)
    const ongoingInterviews = data.interviews.filter(
      (interview: any) => interview.status === 'in_progress'
    ).sort((a: any, b: any) => {
      // Sort by createdAt date, most recent first
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({ interviews: ongoingInterviews })
  } catch (error) {
    console.error('Failed to fetch ongoing interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ongoing interviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 