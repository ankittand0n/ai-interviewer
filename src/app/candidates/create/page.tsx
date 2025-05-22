'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  resumeText: z.string().min(50, 'Resume text should be at least 50 characters'),
})

export default function CreateCandidatePage() {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: values.resumeText,
          status: 'active',
          interviewStage: 'Screening',
          createdAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create candidate')
      }

      router.push('/candidates')
    } catch (error) {
      console.error('Error creating candidate:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Candidate</h1>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="resumeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste the candidate's resume text here..." 
                        className="min-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste the complete resume text. Our AI will automatically extract relevant information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit">Add Candidate</Button>
                <Button type="button" variant="outline" onClick={() => router.push('/candidates')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 