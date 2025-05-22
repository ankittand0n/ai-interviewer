'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Interview, ChatMessage } from '@/types'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const INTERVIEW_DURATION = 45 * 60 * 1000 // 45 minutes in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
const TYPING_SPEED_THRESHOLD = 100 // characters per second
const SUSPICIOUS_LENGTH_THRESHOLD = 200 // characters

export default function InterviewPage() {
  const params = useParams()
  const id = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [lastInputTime, setLastInputTime] = useState<number>(Date.now())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef<number>(Date.now())
  const startTimeRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  const messageStartTimeRef = useRef<number | null>(null)
  const previousMessageLengthRef = useRef<number>(0)

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
  }, [id, interview])

  // Handle activity tracking and timer pausing
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (isPaused) {
      setIsPaused(false)
      const pausedDuration = pausedAtRef.current ? Date.now() - pausedAtRef.current : 0
      startTimeRef.current = (startTimeRef.current || Date.now()) + pausedDuration
      pausedAtRef.current = null
    }
  }, [isPaused])

  // Check for inactivity
  useEffect(() => {
    if (!interview || interview.status !== 'in_progress') return

    const checkInactivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current >= INACTIVITY_TIMEOUT && !isPaused) {
        setIsPaused(true)
        pausedAtRef.current = now
      }
    }

    const inactivityInterval = setInterval(checkInactivity, 1000)
    return () => clearInterval(inactivityInterval)
  }, [interview, isPaused])

  // Timer effect
  useEffect(() => {
    if (!interview || interview.status !== 'in_progress') return

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now() - (interview.elapsedTime || 0)
      setTimeElapsed(interview.elapsedTime || 0)
    }

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Date.now() - (startTimeRef.current || Date.now())
        setTimeElapsed(elapsed)

        if (elapsed >= INTERVIEW_DURATION) {
          handleEndInterview()
        }
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [interview, isPaused, handleEndInterview])

  // Tab visibility handling
  useEffect(() => {
    if (!interview || interview.status !== 'in_progress') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowTabWarning(true)
        setIsPaused(true)
        pausedAtRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interview])

  useEffect(() => {
    // Load interview data
    fetch(`/api/interviews/${id}`)
      .then(res => res.json())
      .then(data => {
        setInterview(data)
        
        // If interview is scheduled, automatically start it
        if (data.status === 'scheduled') {
          fetch(`/api/interviews/${id}/start`, {
            method: 'POST'
          })
          .then(res => res.json())
          .then(updatedData => {
            setInterview(updatedData)
            startTimeRef.current = Date.now()
          })
          .catch(error => {
            console.error('Failed to start interview:', error)
            toast.error('Failed to start interview')
          })
        } else if (data.status === 'in_progress') {
          startTimeRef.current = Date.now() - (data.elapsedTime || 0)
        }
      })
      .catch(error => {
        console.error('Failed to load interview:', error)
        toast.error('Failed to load interview')
      })
  }, [id])

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

    // Check for suspicious typing speed
    const now = Date.now()
    const timeDiff = now - lastInputTime
    const charDiff = message.length - previousMessageLengthRef.current
    const currentTypingSpeed = (charDiff / timeDiff) * 1000 // chars per second

    let newMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    // Add warning for suspicious activity
    if (currentTypingSpeed > TYPING_SPEED_THRESHOLD && message.length > SUSPICIOUS_LENGTH_THRESHOLD) {
      const warningMessage: ChatMessage = {
        role: 'system',
        content: '⚠️ Warning: Suspicious rapid input detected. This incident has been logged.',
        timestamp: new Date().toISOString(),
      }
      newMessage = {
        ...newMessage,
        content: message + '\n\n[System Note: This response was flagged for suspicious input speed]'
      }
      setInterview(prev => prev ? {
        ...prev,
        messages: [...prev.messages, warningMessage]
      } : null)
    }

    updateLastActivity()
    setIsLoading(true)
    try {
      const response = await fetch(`/api/interviews/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: newMessage,
          elapsedTime: timeElapsed
        }),
      })
      const data = await response.json()
      setInterview(data.interview)
      setMessage('')
      previousMessageLengthRef.current = 0
      messageStartTimeRef.current = null
    } catch (error) {
      console.error('Failed to send message:', error)
    }
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const now = Date.now()

    if (!messageStartTimeRef.current) {
      messageStartTimeRef.current = now
      previousMessageLengthRef.current = 0
    }

    setMessage(newValue)
    if (newValue.trim()) {
      updateLastActivity()
    }

    setLastInputTime(now)
    previousMessageLengthRef.current = newValue.length
  }

  if (!interview) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Tab Switch Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Switching tabs or minimizing the window during an interview is not allowed.
              This incident has been logged. Please remain focused on the interview.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowTabWarning(false)
              setIsPaused(false)
              updateLastActivity()
            }}>
              Resume Interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interview for {interview.job?.title}</CardTitle>
              {interview.status === 'in_progress' && (
                <div className="text-sm mt-1">
                  <p className={timeElapsed >= INTERVIEW_DURATION - 5 * 60 * 1000 ? 'text-red-500' : 'text-muted-foreground'}>
                    Time Elapsed: {formatTime(timeElapsed)}
                  </p>
                  {isPaused && (
                    <p className="text-yellow-500">
                      Timer paused due to inactivity. Start typing to resume.
                    </p>
                  )}
                </div>
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
              <p><strong>Status:</strong> {interview.status}</p>
              <p><strong>Started:</strong> {new Date(interview.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p><strong>Type:</strong> Technical Interview</p>
              {interview.status === 'in_progress' && (
                <p><strong>Time Remaining:</strong> {formatTime(INTERVIEW_DURATION - timeElapsed)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Technical Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {interview.messages.map((msg, index) => {
              const evaluation = interview.status === 'completed' ? 
                interview.continuousScoring?.responses.find(r => r.messageIndex === index) : 
                undefined;
              return (
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
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold">
                      {msg.role === 'assistant' ? 'Interviewer' : msg.role === 'user' ? 'You' : 'System'}
                    </p>
                    {evaluation && (
                      <span className={`text-sm font-medium ${
                        evaluation.score >= 80 ? 'text-green-500' :
                        evaluation.score >= 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        Score: {evaluation.score}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {evaluation && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {evaluation.feedback}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={isPaused ? "Start typing to resume the interview..." : "Type your response..."}
              value={message}
              onChange={handleInputChange}
              onPaste={(e) => {
                e.preventDefault()
                toast.error('Pasting is not allowed during the interview')
              }}
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