'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from './button'
import { useAuth } from '@/contexts/AuthContext'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  count?: number
  children?: {
    href: string
    label: string
    isActive: boolean
  }[]
}

function NavItem({ href, icon, label, isActive, count, children }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = children && children.length > 0

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  return (
    <div>
      <div className="flex">
        <Link href={href} className="flex-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 px-2",
              isActive && "bg-muted"
            )}
          >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {count !== undefined && (
              <span className="ml-auto text-muted-foreground text-sm">
                {count}
              </span>
            )}
          </Button>
        </Link>
        {hasChildren && (
          <Button
            variant="ghost"
            className="px-2"
            onClick={handleExpandClick}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {children.map((child) => (
            <Link key={child.href} href={child.href} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start px-2",
                  child.isActive && "bg-muted"
                )}
              >
                {child.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [jobsCount, setJobsCount] = useState(0)
  const [candidatesCount, setCandidatesCount] = useState(0)
  const [interviewsCount, setInterviewsCount] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      try {
        // Fetch jobs count
        const jobsResponse = await fetch('/api/jobs')
        const jobsData = await jobsResponse.json()
        setJobsCount(jobsData.jobs.length)

        // Fetch candidates count
        const candidatesResponse = await fetch('/api/candidates')
        const candidatesData = await candidatesResponse.json()
        setCandidatesCount(candidatesData.candidates.length)

        // Fetch interviews count
        const interviewsResponse = await fetch('/api/interviews')
        const interviewsData = await interviewsResponse.json()
        setInterviewsCount(interviewsData.interviews.length)
      } catch (error) {
        console.error('Failed to fetch counts:', error)
      }
    }

    fetchCounts()
  }, [])

  const navItems = [
    {
      href: '/jobs',
      icon: <Briefcase className="h-4 w-4" />,
      label: 'Jobs',
      isActive: pathname?.startsWith('/jobs'),
      count: jobsCount,
      children: [
        {
          href: '/jobs/create',
          label: 'Create Job',
          isActive: pathname === '/jobs/create'
        },
        {
          href: '/jobs/active',
          label: 'Active Jobs',
          isActive: pathname === '/jobs/active'
        },
        {
          href: '/jobs/archived',
          label: 'Archived Jobs',
          isActive: pathname === '/jobs/archived'
        }
      ]
    },
    {
      href: '/candidates',
      icon: <Users className="h-4 w-4" />,
      label: 'Candidates',
      isActive: pathname?.startsWith('/candidates'),
      count: candidatesCount,
      children: [
        {
          href: '/candidates/create',
          label: 'Add Candidate',
          isActive: pathname === '/candidates/create'
        },
        {
          href: '/candidates/pending',
          label: 'Pending Review',
          isActive: pathname === '/candidates/pending'
        },
        {
          href: '/candidates/interviewed',
          label: 'Interviewed',
          isActive: pathname === '/candidates/interviewed'
        },
        {
          href: '/candidates/selected',
          label: 'Selected',
          isActive: pathname === '/candidates/selected'
        },
        {
          href: '/candidates/rejected',
          label: 'Rejected',
          isActive: pathname === '/candidates/rejected'
        }
      ]
    },
    {
      href: '/interviews',
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Interviews',
      isActive: pathname?.startsWith('/interviews'),
      count: interviewsCount,
      children: [
        {
          href: '/interviews/schedule',
          label: 'Schedule Interview',
          isActive: pathname === '/interviews/schedule'
        },
        {
          href: '/interviews/ongoing',
          label: 'Ongoing',
          isActive: pathname === '/interviews/ongoing'
        },
        {
          href: '/interviews/archived',
          label: 'Completed',
          isActive: pathname === '/interviews/archived'
        }
      ]
    }
  ]

  return (
    <div className="w-64 border-r bg-background h-screen p-4 flex flex-col">
      <div className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
      <Button 
        variant="ghost" 
        className="w-full justify-start gap-2 mt-auto"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  )
} 