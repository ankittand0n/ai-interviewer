'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { JobDescription, Candidate, Interview } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { InterviewRating } from "@/components/ui/interview-rating"

export default function Dashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirementsText: '',
  })
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    resumeText: '',
  })
  const [editingJob, setEditingJob] = useState<(JobDescription & { requirementsText: string }) | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'job' | 'candidate' | 'interview'; id: string } | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/candidates')
      ])
      const [jobsData, candidatesData] = await Promise.all([
        jobsRes.json(),
        candidatesRes.json()
      ])
      setJobs(jobsData.jobs)
      setCandidates(candidatesData.candidates)
      setDeleteConfirmation(null)
    } catch (error) {
      console.error('Failed to refresh data:', error)
      toast.error('Failed to refresh data')
    }
  }, [])

  useEffect(() => {
    // Check if user is logged in
    const user = sessionStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }

    // Load jobs and candidates
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data.jobs))
    
    fetch('/api/candidates')
      .then(res => res.json())
      .then(data => setCandidates(data.candidates))

    // Load interviews
    fetch('/api/interviews')
      .then(res => res.json())
      .then(data => setInterviews(data.interviews))
  }, [router])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const handleAddJob = () => {
    const job: JobDescription = {
      id: uuidv4(),
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirementsText.split('\n').filter(r => r.trim()),
      createdAt: new Date().toISOString(),
    }

    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
      .then(res => res.json())
      .then(() => {
        setJobs([...jobs, job])
        setNewJob({ title: '', description: '', requirementsText: '' })
      })
  }

  const handleAddCandidate = () => {
    const candidate: Candidate = {
      id: uuidv4(),
      ...newCandidate,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    })
      .then(res => res.json())
      .then(() => {
        setCandidates([...candidates, candidate])
        setNewCandidate({ name: '', email: '', phone: '', jobId: '', resumeText: '' })
      })
  }

  const handleEditJob = async (job: JobDescription & { requirementsText: string }) => {
    try {
      const updatedJob: JobDescription = {
        ...job,
        requirements: job.requirementsText.split('\n').filter(r => r.trim()),
      }
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedJob),
      })
      const data = await response.json()
      if (data.success) {
        setJobs(jobs.map(j => (j.id === job.id ? updatedJob : j)))
        setEditingJob(null)
        toast.success('Job updated successfully')
      }
    } catch (error) {
      console.error('Failed to update job:', error)
      toast.error('Failed to update job')
    }
  }

  const handleDeleteJob = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete job')
        return
      }
      
      await response.json() // Consume the response
      toast.success('Job deleted successfully')
      refreshData()
    } catch (error) {
      console.error('Failed to delete job:', error)
      toast.error('Failed to delete job')
    }
  }

  const handleEditCandidate = async (candidate: Candidate) => {
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      })
      const data = await response.json()
      if (data.success) {
        setCandidates(candidates.map(c => (c.id === candidate.id ? candidate : c)))
        setEditingCandidate(null)
        toast.success('Candidate updated successfully')
      }
    } catch (error) {
      console.error('Failed to update candidate:', error)
      toast.error('Failed to update candidate')
    }
  }

  const handleDeleteCandidate = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete candidate')
        return
      }
      
      await response.json() // Consume the response
      toast.success('Candidate deleted successfully')
      refreshData()
    } catch (error) {
      console.error('Failed to delete candidate:', error)
      toast.error('Failed to delete candidate')
    }
  }

  const handleDeleteInterview = async (id: string) => {
    try {
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete interview')
        return
      }
      
      await response.json()
      toast.success('Interview deleted successfully')
      refreshData()
    } catch (error) {
      console.error('Failed to delete interview:', error)
      toast.error('Failed to delete interview')
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <Button onClick={() => {
          sessionStorage.removeItem('user')
          router.push('/')
        }}>Logout</Button>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Job</CardTitle>
                <CardDescription>Create a new job posting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Input
                    placeholder="Job Title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Job Description"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  />
                  <Textarea
                    placeholder="Requirements (one per line)"
                    value={newJob.requirementsText}
                    onChange={(e) => setNewJob({ 
                      ...newJob, 
                      requirementsText: e.target.value
                    })}
                    className="min-h-[100px]"
                  />
                  <div className="pt-2">
                    <Button type="button" onClick={handleAddJob}>Add Job</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>Posted on {new Date(job.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={editingJob?.id === job.id} onOpenChange={(open) => !open && setEditingJob(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => setEditingJob({
                              ...job,
                              requirementsText: job.requirements.join('\n')
                            })}>Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Job</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-4">
                                <Input
                                  placeholder="Job Title"
                                  value={editingJob?.title || ''}
                                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                                <Textarea
                                  placeholder="Job Description"
                                  value={editingJob?.description || ''}
                                  onChange={(e) => setEditingJob(prev => prev ? { ...prev, description: e.target.value } : null)}
                                />
                                <Textarea
                                  placeholder="Requirements (one per line)"
                                  value={editingJob?.requirementsText || ''}
                                  onChange={(e) => setEditingJob(prev => prev ? {
                                    ...prev,
                                    requirementsText: e.target.value
                                  } : null)}
                                  className="min-h-[100px]"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
                                  <Button type="button" onClick={() => editingJob && handleEditJob(editingJob)}>Save Changes</Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          onClick={() => setDeleteConfirmation({ type: 'job', id: job.id })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{job.description}</p>
                    <div>
                      <h4 className="font-semibold mb-2">Requirements:</h4>
                      <ul className="list-disc pl-4">
                        {job.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="candidates">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Candidate</CardTitle>
                <CardDescription>Add a candidate for a job position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Candidate Name"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                />
                <select
                  className="w-full p-2 border rounded"
                  value={newCandidate.jobId}
                  onChange={(e) => setNewCandidate({ ...newCandidate, jobId: e.target.value })}
                >
                  <option value="">Select Job Position</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                <Textarea
                  placeholder="Resume Text"
                  value={newCandidate.resumeText}
                  onChange={(e) => setNewCandidate({ ...newCandidate, resumeText: e.target.value })}
                />
                <Button onClick={handleAddCandidate}>Add Candidate</Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{candidate.name}</CardTitle>
                        <CardDescription>
                          Applied for: {jobs.find(j => j.id === candidate.jobId)?.title}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={editingCandidate?.id === candidate.id} onOpenChange={(open) => !open && setEditingCandidate(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => setEditingCandidate(candidate)}>Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Candidate</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Input
                                placeholder="Candidate Name"
                                value={editingCandidate?.name || ''}
                                onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, name: e.target.value } : null)}
                              />
                              <Input
                                placeholder="Email"
                                type="email"
                                value={editingCandidate?.email || ''}
                                onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, email: e.target.value } : null)}
                              />
                              <Input
                                placeholder="Phone"
                                value={editingCandidate?.phone || ''}
                                onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, phone: e.target.value } : null)}
                              />
                              <select
                                className="w-full p-2 border rounded"
                                value={editingCandidate?.jobId || ''}
                                onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, jobId: e.target.value } : null)}
                              >
                                <option value="">Select Job Position</option>
                                {jobs.map((job) => (
                                  <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                              </select>
                              <Textarea
                                placeholder="Resume Text"
                                value={editingCandidate?.resumeText || ''}
                                onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, resumeText: e.target.value } : null)}
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingCandidate(null)}>Cancel</Button>
                              <Button onClick={() => editingCandidate && handleEditCandidate(editingCandidate)}>
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          onClick={() => setDeleteConfirmation({ type: 'candidate', id: candidate.id })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Email:</strong> {candidate.email}</p>
                      <p><strong>Phone:</strong> {candidate.phone}</p>
                      <p><strong>Status:</strong> {candidate.status}</p>
                      <p><strong>Applied on:</strong> {new Date(candidate.createdAt).toLocaleDateString()}</p>
                      
                      {/* View Resume Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">View Resume</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Resume - {candidate.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 overflow-y-auto flex-grow pr-2">
                            <p className="whitespace-pre-wrap">{candidate.resumeText}</p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Interview Results */}
                      {candidate.interviewId && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="ml-2">
                              View Interview Results
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Interview Results - {candidate.name}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 overflow-y-auto flex-grow pr-2">
                              {interviews.find((i: Interview) => i.id === candidate.interviewId && i.status === 'completed') ? (
                                <>
                                  <InterviewRating 
                                    interview={interviews.find((i: Interview) => i.id === candidate.interviewId)!} 
                                  />
                                  <div className="mt-4 flex justify-end">
                                    <Button
                                      variant="destructive"
                                      onClick={() => setDeleteConfirmation({ type: 'interview', id: candidate.interviewId! })}
                                    >
                                      Delete Interview
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <p>Interview is still in progress.</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* View Job Description Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="ml-2">View Job Description</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Job Description - {jobs.find(j => j.id === candidate.jobId)?.title}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 overflow-y-auto flex-grow pr-2">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">Description:</h3>
                                <p className="whitespace-pre-wrap">
                                  {jobs.find(j => j.id === candidate.jobId)?.description}
                                </p>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Requirements:</h3>
                                <ul className="list-disc pl-5">
                                  {jobs.find(j => j.id === candidate.jobId)?.requirements.map((req, i) => (
                                    <li key={i}>{req}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={async () => {
                          if (candidate.interviewId) {
                            router.push(`/interview/${candidate.interviewId}`)
                          } else {
                            try {
                              const response = await fetch('/api/interviews', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  candidateId: candidate.id,
                                  jobId: candidate.jobId,
                                }),
                              })
                              const data = await response.json()
                              if (data.success) {
                                router.push(`/interview/${data.interview.id}`)
                              }
                            } catch (error) {
                              console.error('Failed to start interview:', error)
                            }
                          }
                        }}
                      >
                        {candidate.interviewId ? 'Continue Interview' : 'Start Interview'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this {deleteConfirmation?.type}? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation?.type === 'job') {
                  handleDeleteJob(deleteConfirmation.id)
                } else if (deleteConfirmation?.type === 'candidate') {
                  handleDeleteCandidate(deleteConfirmation.id)
                } else if (deleteConfirmation?.type === 'interview') {
                  handleDeleteInterview(deleteConfirmation.id)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 