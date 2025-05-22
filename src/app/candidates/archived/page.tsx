'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Archive, Briefcase, Building, GraduationCap, Mail, MapPin, Phone, RotateCcw, User } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

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

export default function ArchivedCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCandidates() {
      try {
        const response = await fetch('/api/candidates/archived')
        const data = await response.json()
        setCandidates(data.candidates)
      } catch (error) {
        console.error('Failed to load archived candidates:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [])

  if (loading) {
    return <div className="text-center p-6">Loading archived candidates...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Archived Candidates</h1>
          <Archive className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/candidates">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            View Active Candidates
          </Button>
        </Link>
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No archived candidates found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Archived candidates will appear here when you archive them from the active candidates list
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground">{candidate.currentRole}</p>
                  </div>
                  <Badge variant="secondary">Archived</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      Applied for {candidate.appliedFor}
                    </div>
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.currentCompany}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.education.degree} - {candidate.education.university}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/candidates/${candidate.id}`}>View Details</Link>
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