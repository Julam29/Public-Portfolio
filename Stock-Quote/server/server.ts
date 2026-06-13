import express from 'express'
import cors from 'cors'
import { describeCompany } from './agents/companyAgent'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/describe', async (req, res) => {
  const { ticker, companyName } = req.body
  const description = await describeCompany(ticker, companyName)
  res.json({ description })
})

app.listen(3000, () => console.log('Server running on port 3000'))