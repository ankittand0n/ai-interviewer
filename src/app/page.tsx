'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import users from '@/data/users.json'

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function Home() {
  const router = useRouter()
  const [error, setError] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const user = users.users.find(
      (u) => u.username === values.username && u.password === values.password
    )

    if (user) {
      // Store user session
      sessionStorage.setItem('user', JSON.stringify(user))
      // Redirect to dashboard
      router.push('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>HR Login</CardTitle>
          <CardDescription>Sign in to manage job postings and candidates</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </main>
  )
}
