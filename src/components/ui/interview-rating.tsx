import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Interview } from "@/types"

interface InterviewRatingProps {
  interview: Interview
}

interface FeedbackSections {
  strengths: string[]
  improvements: string[]
  technical: string[]
  recommendations: string[]
  currentSection: 'strengths' | 'improvements' | 'technical' | 'recommendations' | ''
}

export function InterviewRating({ interview }: InterviewRatingProps) {
  if (!interview.score || !interview.feedback) {
    return null
  }

  // Parse feedback sections
  const feedbackSections = interview.feedback.split('\n').reduce<FeedbackSections>((acc, line) => {
    if (line.includes('Strengths demonstrated:')) {
      return { ...acc, strengths: [], currentSection: 'strengths' }
    } else if (line.includes('Areas for improvement:')) {
      return { ...acc, improvements: [], currentSection: 'improvements' }
    } else if (line.includes('Technical competency:')) {
      return { ...acc, technical: [], currentSection: 'technical' }
    } else if (line.includes('Recommendations:')) {
      return { ...acc, recommendations: [], currentSection: 'recommendations' }
    } else if (line.trim() && acc.currentSection) {
      return {
        ...acc,
        [acc.currentSection]: [...acc[acc.currentSection], line.trim()]
      }
    }
    return acc
  }, {
    strengths: [],
    improvements: [],
    technical: [],
    recommendations: [],
    currentSection: ''
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Interview Results
          <span className={`text-3xl font-bold ${getScoreColor(interview.score)}`}>
            {interview.score}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Technical Knowledge</p>
                <p className="font-medium">40%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problem Solving</p>
                <p className="font-medium">30%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Communication</p>
                <p className="font-medium">20%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role Fit</p>
                <p className="font-medium">10%</p>
              </div>
            </div>
          </div>

          {feedbackSections.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Strengths</h3>
              <ul className="list-disc pl-5 space-y-1">
                {feedbackSections.strengths.map((strength, index) => (
                  <li key={index} className="text-sm">{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {feedbackSections.improvements.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Areas for Improvement</h3>
              <ul className="list-disc pl-5 space-y-1">
                {feedbackSections.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm">{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {feedbackSections.technical.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Technical Assessment</h3>
              <div className="text-sm space-y-2">
                {feedbackSections.technical.map((tech, index) => (
                  <p key={index}>{tech}</p>
                ))}
              </div>
            </div>
          )}

          {feedbackSections.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-1">
                {feedbackSections.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm">{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 