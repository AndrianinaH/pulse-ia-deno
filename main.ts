import { Hono } from 'hono'
import { postRoute } from './src/post/post.route.ts'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/posts', postRoute)

Deno.serve(app.fetch)
