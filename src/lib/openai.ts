import OpenAI from 'openai'
import { Interview, JobDescription, Candidate } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateInterviewResponse(
  message: string,
  interview: Interview,
  job: JobDescription,
  candidate: Candidate
): Promise<string> {
  const systemPrompt = `You are an expert technical interviewer conducting an interview for the position of ${job.title}.
Your task is to:
1. Evaluate the candidate's responses
2. Ask relevant technical questions based on the job requirements
3. Follow-up on their answers when necessary
4. Keep the conversation professional and focused

Job Details:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${job.requirements.join(', ')}

Candidate Background:
${candidate.resumeText}

Interview Guidelines:
- Ask one question at a time
- Focus on technical skills mentioned in requirements
- Probe deeper on areas where candidate shows expertise
- Be encouraging but maintain professional distance
- If the candidate's answer is incomplete or incorrect, ask follow-up questions
- Vary between theoretical knowledge and practical experience questions

Current interview progress: ${interview.messages.length} messages exchanged.`

  const conversationHistory = interview.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }))

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || 'Could you please elaborate on your previous answer?'
  } catch (error) {
    console.error('OpenAI API error:', error)
    return 'I apologize, but I encountered an issue. Could you please rephrase your response?'
  }
}

export async function generateInterviewFeedback(
  interview: Interview,
  job: JobDescription,
  candidate: Candidate
): Promise<{ score: number; feedback: string }> {
  const feedbackPrompt = `You are an expert technical interviewer reviewing a completed interview.

Job Details:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${job.requirements.join(', ')}

Candidate Background:
${candidate.resumeText}

Interview Conversation:
${interview.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Please provide:
1. A score out of 100 based on:
   - Technical knowledge (40%)
   - Problem-solving ability (30%)
   - Communication skills (20%)
   - Overall fit for the role (10%)

2. Detailed feedback including:
   - Strengths demonstrated
   - Areas for improvement
   - Technical competency assessment
   - Recommendations

Format your response as:
SCORE: [number]
FEEDBACK: [detailed feedback]`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: feedbackPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || ''
    const scoreMatch = content.match(/SCORE:\s*(\d+)/)
    const feedbackMatch = content.match(/FEEDBACK:\s*(.+)/s)

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 70,
      feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Feedback generation failed.'
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      score: 70,
      feedback: 'Unable to generate detailed feedback due to an error.'
    }
  }
} 