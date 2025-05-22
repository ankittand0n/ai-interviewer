'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

interface Candidate {
  id: string
  name: string
  interviewScheduled?: boolean
}

interface Job {
  id: string
  title: string
}

const formSchema = z.object({
  candidateId: z.string().min(1, 'Please select a candidate'),
  jobId: z.string().min(1, 'Please select a job'),
})

export default function ScheduleInterviewPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateId: '',
      jobId: '',
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        // Load candidates
        const candidatesResponse = await fetch('/api/candidates')
        const candidatesData = await candidatesResponse.json()
        // Filter only candidates that don't have scheduled interviews
        const eligibleCandidates = candidatesData.candidates.filter(
          (candidate: Candidate) => !candidate.interviewScheduled
        )
        setCandidates(eligibleCandidates)

        // Load jobs
        const jobsResponse = await fetch('/api/jobs')
        const jobsData = await jobsResponse.json()
        setJobs(jobsData.jobs)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule interview')
      }

      router.push('/interviews')
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  if (loading) {
    return <div className="text-center p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Schedule Interview</h1>
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Schedule Interview
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 