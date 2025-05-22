'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Users, Calendar, Archive, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  department: string
  location: string
  experience: string
  status: string
  createdAt: string
  interviewsCompleted: number
  interviewsScheduled: number
}

export default function ArchivedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs/archived')
        const data = await response.json()
        setJobs(data.jobs)
      } catch (error) {
        console.error('Failed to load archived jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  if (loading) {
    return <div className="text-center p-6">Loading archived jobs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Archived Jobs</h1>
          <Archive className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/jobs">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            View Active Jobs
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No archived jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Archived jobs will appear here when you archive them from the active jobs list
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.department}</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    Archived
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {job.experience}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Final Results</p>
                    <p className="text-sm">
                      {job.interviewsCompleted} interviews completed
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      Reactivate
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