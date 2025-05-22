export interface JobDescription {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  resumeText: string;
  status: 'pending' | 'interviewed' | 'selected' | 'rejected';
  createdAt: string;
  interviewId?: string;
}

export interface User {
  username: string;
  password: string;
  role: 'hr';
}

export interface Interview {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  messages: ChatMessage[];
  score?: number;
  feedback?: string;
  createdAt: string;
  elapsedTime?: number;
  job: {
    title: string;
    requirements: string[];
    type: string;
  };
  candidate?: {
    name: string;
  };
  continuousScoring?: {
    currentScore: number;
    technicalAccuracy: number;
    jobAlignment: number;
    communicationClarity: number;
    uniqueTopicsAsked: number;
    responses: Array<{
      messageIndex: number;
      score: number;
      feedback: string;
    }>;
  };
}

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
} 