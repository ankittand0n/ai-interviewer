import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

async function extractCandidateInfo(resumeText: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract candidate information from the resume text. Return a JSON object with the following fields: name, email, phone, currentRole, currentCompany, location, experience, skills (array), education (object with degree, university, graduationYear)."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content returned from OpenAI')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error extracting candidate info:', error)
    throw new Error('Failed to process resume')
  }
}

export async function POST(request: Request) {
  try {
    const { jobId, resumeText, status, interviewStage, createdAt } = await request.json()
    
    // Extract candidate information using OpenAI
    const candidateInfo = await extractCandidateInfo(resumeText)

    const dataPath = path.join(process.cwd(), 'src/data')
    const candidatesContent = await fs.readFile(path.join(dataPath, 'candidates.json'), 'utf8')
    const candidatesData = JSON.parse(candidatesContent)

    const newCandidate = {
      id: uuidv4(),
      ...candidateInfo,
      jobId,
      status,
      interviewStage,
      createdAt,
      resumeText,
    }

    candidatesData.candidates.push(newCandidate)

    await fs.writeFile(
      path.join(dataPath, 'candidates.json'),
      JSON.stringify(candidatesData, null, 2)
    )

    return NextResponse.json(newCandidate)
  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 