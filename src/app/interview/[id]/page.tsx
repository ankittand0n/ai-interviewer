'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Interview, ChatMessage, JobDescription, Candidate } from '@/types'
import { toast } from 'sonner'

export default function InterviewPage() {
  const params = useParams()
  const id = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [job, setJob] = useState<JobDescription | null>(null)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleEndInterview = useCallback(async () => {
    if (!interview) return
    
    setIsEndingInterview(true)
    try {
      const response = await fetch(`/api/interviews/${id}/end`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        setInterview(data.interview)
        setTimeRemaining(0)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        toast.success('Interview completed successfully')
      }
    } catch (error) {
      console.error('Failed to end interview:', error)
      toast.error('Failed to end interview')
    }
    setIsEndingInterview(false)
  }, [id, interview, timerRef])

  useEffect(() => {
    // Load interview data
    fetch(`/api/interviews/${id}`)
      .then(res => res.json())
      .then(data => {
        setInterview(data.interview)
        setJob(data.job)
        setCandidate(data.candidate)
        
        // Calculate remaining time
        if (data.interview.status === 'in_progress') {
          const startTime = new Date(data.interview.createdAt).getTime()
          const elapsedTime = Date.now() - startTime
          const remainingTime = Math.max(45 * 60 * 1000 - elapsedTime, 0) // 45 minutes in milliseconds
          setTimeRemaining(remainingTime)
        }
      })

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [id])

  // Start timer if we have remaining time
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && interview?.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 1000) {
            return prev - 1000
          } else {
            // Time's up
            handleEndInterview()
            clearInterval(timerRef.current)
            return 0
          }
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [timeRemaining, interview?.status, handleEndInterview])

  // Handle page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (interview?.status === 'in_progress') {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [interview?.status])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [interview?.messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !interview) return

    const newMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/interviews/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })
      const data = await response.json()
      setInterview(data.interview)
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
    setIsLoading(false)
  }

  if (!interview || !job || !candidate) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interview for {job.title}</CardTitle>
              {interview.status === 'in_progress' && timeRemaining !== null && (
                <p className={`text-sm mt-1 ${timeRemaining < 5 * 60 * 1000 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Time Remaining: {formatTime(timeRemaining)}
                </p>
              )}
            </div>
            {interview.status === 'in_progress' && (
              <Button 
                variant="destructive"
                onClick={handleEndInterview}
                disabled={isEndingInterview}
              >
                {isEndingInterview ? 'Ending Interview...' : 'End Interview'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Candidate:</strong> {candidate.name}</p>
              <p><strong>Email:</strong> {candidate.email}</p>
            </div>
            <div>
              <p><strong>Status:</strong> {interview.status}</p>
              <p><strong>Started:</strong> {new Date(interview.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {interview.messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === 'assistant'
                    ? 'bg-primary/10 ml-4'
                    : msg.role === 'user'
                    ? 'bg-muted mr-4'
                    : 'bg-secondary/10'
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.role === 'assistant' ? 'Interviewer' : msg.role === 'user' ? 'You' : 'System'}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Type your response..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isLoading || interview.status === 'completed'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || interview.status === 'completed'}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {interview.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Score:</p>
                <p className="text-2xl">{interview.score}/100</p>
              </div>
              <div>
                <p className="font-semibold">Feedback:</p>
                <p className="whitespace-pre-wrap">{interview.feedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 