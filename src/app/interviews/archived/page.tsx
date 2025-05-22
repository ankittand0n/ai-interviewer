'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Interview {
  id: string
  candidateId: string
  jobId: string
  createdAt: string
  status: string
  feedback?: string
  candidateName: string
  jobTitle: string
}

export default function ArchivedInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArchivedInterviews() {
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

    loadArchivedInterviews()
  }, [])

  if (loading) {
    return <div className="text-center p-6">Loading archived interviews...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Archived Interviews</h1>
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Active Interviews
          </Button>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No archived interviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{interview.candidateName}</h3>
                    <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                  </div>
                  <Badge 
                    variant={
                      interview.status === 'completed' ? 'secondary' :
                      interview.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }
                  >
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {new Date(interview.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/interviews/${interview.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 