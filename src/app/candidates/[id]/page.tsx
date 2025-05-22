'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, Briefcase, Building, GraduationCap, Mail, MapPin, Phone, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  status: string
  appliedFor: string
  jobId: string
  experience: string
  currentRole: string
  currentCompany: string
  location: string
  createdAt: string
  lastInterviewDate: string
  interviewStage: string
  skills: string[]
  education: {
    degree: string
    university: string
    graduationYear: number
  }
}

export default function CandidateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCandidate() {
      try {
        const response = await fetch(`/api/candidates/${params.id}`)
        if (!response.ok) {
          throw new Error('Candidate not found')
        }
        const data = await response.json()
        setCandidate(data.candidate)
      } catch (error) {
        console.error('Failed to load candidate:', error)
        router.push('/candidates')
      } finally {
        setLoading(false)
      }
    }

    loadCandidate()
  }, [params.id, router])

  if (loading) {
    return <div className="text-center p-6">Loading candidate details...</div>
  }

  if (!candidate) {
    return <div className="text-center p-6">Candidate not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{candidate.name}</h1>
        <Link href="/candidates">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {candidate.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {candidate.phone}
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                {candidate.location}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Education</h3>
              <div className="flex items-center text-sm">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                {candidate.education.degree} - {candidate.education.university} ({candidate.education.graduationYear})
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                Applied for {candidate.appliedFor}
              </div>
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                Current: {candidate.currentRole} at {candidate.currentCompany}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Experience: </span>
                {candidate.experience}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Interview Status</h3>
              <Badge variant="secondary">{candidate.interviewStage}</Badge>
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Last Interview: </span>
                {new Date(candidate.lastInterviewDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button>Schedule Next Interview</Button>
              {candidate.status === 'active' ? (
                <Button variant="outline" className="text-destructive-foreground">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Candidate
                </Button>
              ) : (
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reactivate Candidate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 