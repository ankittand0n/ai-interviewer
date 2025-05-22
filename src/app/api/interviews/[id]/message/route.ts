import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { ChatMessage, Interview, JobDescription } from '@/types'
import { generateInterviewResponse, evaluateResponse } from '@/lib/openai'

const dataPath = path.join(process.cwd(), 'src/data')
const INTERVIEW_DURATION = 45 * 60 * 1000 // 45 minutes in milliseconds

const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  DECENT: 60,
  MINIMUM: 40
}

const MIN_QUESTIONS_FOR_POOR_PERFORMANCE = 5

// Helper function to count actual candidate responses
function countCandidateResponses(messages: ChatMessage[]): number {
  return messages.filter(msg => msg.role === 'user').length
}

// Helper function to count unique topics
function countUniqueTopics(messages: ChatMessage[]): Set<string> {
  const topics = new Set<string>()
  let lastTopic = ''

  messages.forEach((msg, index) => {
    if (msg.role === 'assistant' && msg.content.includes('?')) {
      const topic = msg.content.split(/[?.!]/)[0].toLowerCase()
      if (!lastTopic || !topic.includes(lastTopic.split(' ')[0])) {
        topics.add(topic)
        lastTopic = topic
      }
    }
  })

  return topics
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const { message, elapsedTime } = await request.json()

    // Load interview and job data
    const interviewsContent = await fs.readFile(path.join(dataPath, 'interviews.json'), 'utf8')
    const jobsContent = await fs.readFile(path.join(dataPath, 'jobs.json'), 'utf8')

    const interviewsData = JSON.parse(interviewsContent)
    const jobsData = JSON.parse(jobsContent)

    const interview = interviewsData.interviews.find((i: Interview) => i.id === id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const job = jobsData.jobs.find((j: JobDescription) => j.id === interview.jobId)

    // Update elapsed time
    interview.elapsedTime = elapsedTime

    // Add user message
    interview.messages.push(message)

    // Only evaluate if this is an actual candidate response (not system or initial messages)
    const candidateResponses = countCandidateResponses(interview.messages)
    
    // Handle interview timeout without any responses
    if (elapsedTime >= INTERVIEW_DURATION && candidateResponses === 0) {
      interview.status = 'completed'
      interview.score = 0
      interview.feedback = `Interview ended with no responses from the candidate.\n\n` +
        `Final Score: 0/100\n` +
        `Questions Answered: 0/${MIN_QUESTIONS_FOR_POOR_PERFORMANCE} minimum required\n\n` +
        `Note: Candidate did not provide any responses during the interview.`

      // Save updated interview data
      await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

      return NextResponse.json({
        id: interview.id,
        status: interview.status,
        messages: interview.messages,
        elapsedTime: interview.elapsedTime,
        score: interview.score,
        feedback: interview.feedback
      })
    }

    if (message.role === 'user') {
      // Evaluate the response
      const evaluation = await evaluateResponse(message.content, interview, job)

      // Initialize continuous scoring if it doesn't exist
      if (!interview.continuousScoring) {
        interview.continuousScoring = {
          currentScore: evaluation.score,
          technicalAccuracy: evaluation.technicalAccuracy,
          jobAlignment: evaluation.jobAlignment,
          communicationClarity: evaluation.communicationClarity,
          responses: [],
          uniqueTopicsAsked: 0
        }
      } else {
        // Update running averages
        const responseCount = interview.continuousScoring.responses.length
        interview.continuousScoring.currentScore = 
          (interview.continuousScoring.currentScore * responseCount + evaluation.score) / (responseCount + 1)
        interview.continuousScoring.technicalAccuracy = 
          (interview.continuousScoring.technicalAccuracy * responseCount + evaluation.technicalAccuracy) / (responseCount + 1)
        interview.continuousScoring.jobAlignment = 
          (interview.continuousScoring.jobAlignment * responseCount + evaluation.jobAlignment) / (responseCount + 1)
        interview.continuousScoring.communicationClarity = 
          (interview.continuousScoring.communicationClarity * responseCount + evaluation.communicationClarity) / (responseCount + 1)
      }

      // Add response evaluation to history
      interview.continuousScoring.responses.push({
        messageIndex: interview.messages.length - 1,
        score: evaluation.score,
        feedback: evaluation.feedback
      })

      // Count unique topics asked so far
      const uniqueTopics = countUniqueTopics(interview.messages)
      interview.continuousScoring.uniqueTopicsAsked = uniqueTopics.size

      // Check if interview should be ended based on poor performance
      const shouldEndInterview = 
        (evaluation.shouldEndInterview && interview.continuousScoring.uniqueTopicsAsked >= MIN_QUESTIONS_FOR_POOR_PERFORMANCE) || 
        (interview.continuousScoring.currentScore <= SCORE_THRESHOLDS.MINIMUM && 
         interview.continuousScoring.uniqueTopicsAsked >= MIN_QUESTIONS_FOR_POOR_PERFORMANCE) ||
        (interview.continuousScoring.responses.length >= MIN_QUESTIONS_FOR_POOR_PERFORMANCE && 
         interview.continuousScoring.currentScore < SCORE_THRESHOLDS.DECENT &&
         interview.continuousScoring.uniqueTopicsAsked >= MIN_QUESTIONS_FOR_POOR_PERFORMANCE)

      if (shouldEndInterview || elapsedTime >= INTERVIEW_DURATION) {
        interview.status = 'completed'
        
        // Calculate final score based on performance and coverage
        let finalScore = interview.continuousScoring.currentScore
        const responseCount = candidateResponses
        const topicsCovered = interview.continuousScoring.uniqueTopicsAsked

        // Penalize for insufficient responses/coverage
        if (responseCount < MIN_QUESTIONS_FOR_POOR_PERFORMANCE) {
          finalScore = Math.min(finalScore, 
            finalScore * (responseCount / MIN_QUESTIONS_FOR_POOR_PERFORMANCE) * 0.8)
        }

        // Additional penalty for early termination due to poor performance
        if (shouldEndInterview && elapsedTime < INTERVIEW_DURATION) {
          finalScore = Math.min(finalScore, SCORE_THRESHOLDS.MINIMUM)
        }

        // Ensure score aligns with performance thresholds
        if (interview.continuousScoring.currentScore <= SCORE_THRESHOLDS.MINIMUM) {
          finalScore = Math.min(finalScore, SCORE_THRESHOLDS.MINIMUM)
        } else if (interview.continuousScoring.currentScore < SCORE_THRESHOLDS.DECENT) {
          finalScore = Math.min(finalScore, SCORE_THRESHOLDS.DECENT - 5)
        }

        interview.score = Math.round(finalScore)
        interview.feedback = `Interview ended ${shouldEndInterview ? 'early due to performance concerns' : ''} after evaluating ${topicsCovered} different skill areas.\n\n` +
          `Final Score: ${interview.score}/100\n` +
          `Technical Accuracy: ${Math.round(interview.continuousScoring.technicalAccuracy)}/100\n` +
          `Job Alignment: ${Math.round(interview.continuousScoring.jobAlignment)}/100\n` +
          `Communication Clarity: ${Math.round(interview.continuousScoring.communicationClarity)}/100\n\n` +
          `Questions Answered: ${responseCount}/${MIN_QUESTIONS_FOR_POOR_PERFORMANCE} minimum required\n` +
          `Topics Covered: ${topicsCovered}/${MIN_QUESTIONS_FOR_POOR_PERFORMANCE} minimum required\n\n` +
          `${responseCount < MIN_QUESTIONS_FOR_POOR_PERFORMANCE ? 
            'Note: Score was adjusted down due to insufficient number of responses.' : ''}\n` +
          `${shouldEndInterview ? 'Note: Interview was terminated early due to performance concerns.' : ''}\n\n` +
          `Detailed Feedback:\n${evaluation.feedback}`

        // Save updated interview data
        await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

        return NextResponse.json({
          id: interview.id,
          status: interview.status,
          messages: interview.messages,
          elapsedTime: interview.elapsedTime,
          score: interview.score,
          feedback: interview.feedback
        })
      }

      // Generate AI response
      const aiResponse = await generateInterviewResponse(message.content, interview, job)
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
      interview.messages.push(aiMessage)
    }

    // Save updated interview data
    await fs.writeFile(path.join(dataPath, 'interviews.json'), JSON.stringify(interviewsData, null, 2))

    return NextResponse.json({
      id: interview.id,
      status: interview.status,
      messages: interview.messages,
      elapsedTime: interview.elapsedTime
    })
  } catch (error) {
    console.error('Failed to process message:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
} 