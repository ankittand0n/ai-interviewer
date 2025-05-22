'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Interview } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Clock, Star, Award, Brain, MessageSquare } from 'lucide-react'

export default function ArchivedInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInterviews() {
      try {
        const response = await fetch('/api/interviews/archived')
        const data = await response.json()
        setInterviews(data.interviews)
      } catch (error) {
        console.error('Failed to load archived interviews:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInterviews()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return <div className="text-center p-6">Loading archived interviews...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Archived Interviews</h1>
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center p-6 text-muted-foreground">
          No archived interviews found.
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Interview for {interview.job?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed on {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(interview.score || 0)}`}>
                    {interview.score}/100
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {interview.continuousScoring && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Technical</p>
                          <p className="text-lg">{Math.round(interview.continuousScoring.technicalAccuracy)}/100</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Job Fit</p>
                          <p className="text-lg">{Math.round(interview.continuousScoring.jobAlignment)}/100</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-teal-500" />
                        <div>
                          <p className="text-sm font-medium">Communication</p>
                          <p className="text-lg">{Math.round(interview.continuousScoring.communicationClarity)}/100</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Topics Covered</p>
                          <p className="text-lg">{interview.continuousScoring.uniqueTopicsAsked}/5</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {interview.feedback && (
                    <div>
                      <h3 className="font-medium mb-2">Feedback</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interview.feedback}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/interview/${interview.id}`}>View Full Interview</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 