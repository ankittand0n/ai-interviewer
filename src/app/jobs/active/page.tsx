'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Users, Calendar } from 'lucide-react'
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

export default function ActiveJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs/active')
        const data = await response.json()
        setJobs(data.jobs.filter((job: Job) => job.status === 'active'))
      } catch (error) {
        console.error('Failed to load jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  if (loading) {
    return <div className="text-center p-6">Loading active jobs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Active Jobs</h1>
        <Link href="/jobs/create">
          <Button>Post New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">No active jobs found</p>
            <Link href="/jobs/create">
              <Button className="mt-4">Post Your First Job</Button>
            </Link>
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
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Active
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
                    <p className="text-sm text-muted-foreground">Interviews</p>
                    <p className="text-sm">
                      {job.interviewsCompleted} completed, {job.interviewsScheduled} scheduled
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/jobs/${job.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/jobs/${job.id}/candidates`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Candidates
                      </Button>
                    </Link>
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