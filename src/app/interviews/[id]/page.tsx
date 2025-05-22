'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Building, ArrowLeft, CheckCircle, XCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'system' | 'assistant' | 'user'
  content: string
  timestamp: string
}

interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobId: string
  jobTitle: string
  createdAt: string
  status: string
  feedback: string
  messages: Message[]
  jobDetails?: {
    requirements: string
  }
}

export default function InterviewDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [feedback, setFeedback] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function loadInterview() {
      try {
        const response = await fetch(`/api/interviews/${params.id}`)
        if (!response.ok) {
          throw new Error('Interview not found')
        }
        const data = await response.json()
        setInterview(data)
        setFeedback(data.feedback || '')
      } catch (error) {
        console.error('Failed to load interview:', error)
        router.push('/interviews')
      } finally {
        setLoading(false)
      }
    }

    loadInterview()
  }, [params.id, router])

  async function handleStatusUpdate(newStatus: string) {
    try {
      const response = await fetch(`/api/interviews/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          feedback: feedback,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update interview')
      }

      const updatedInterview = await response.json()
      setInterview(updatedInterview)
    } catch (error) {
      console.error('Error updating interview:', error)
    }
  }

  async function handleSendMessage() {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/interviews/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const updatedInterview = await response.json()
      setInterview(updatedInterview)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center p-6">Loading interview details...</div>
  }

  if (!interview) {
    return <div className="text-center p-6">Interview not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Interview Details</h1>
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold">{interview.candidateName}</h2>
                <p className="text-muted-foreground">{interview.jobTitle}</p>
              </div>
              <Badge
                variant={
                  interview.status === 'scheduled' ? 'default' :
                  interview.status === 'completed' ? 'secondary' :
                  interview.status === 'in_progress' ? 'default' :
                  'outline'
                }
              >
                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  {interview.jobTitle}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter interview feedback..."
                className="min-h-[150px]"
                disabled={interview.status === 'completed' || interview.status === 'cancelled'}
              />
            </div>

            {interview.status === 'scheduled' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('completed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Interview
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {interview.messages?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'assistant'
                          ? 'bg-muted'
                          : 'bg-muted/50 text-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {interview.status === 'in_progress' && (
              <div className="p-4 border-t flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  className="self-end"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 