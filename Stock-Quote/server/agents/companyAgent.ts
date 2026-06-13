import { groq } from '../groqClient'

export async function describeCompany(ticker: string, companyName: string) {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content: 'You are a financial analyst. Give concise, factual company descriptions.'
      },
      {
        role: 'user',
        content: `Describe ${companyName} (${ticker}) in 3-4 sentences. Cover what they do, market position, and key business segments.`
      }
    ]
  })
  return response.choices[0].message.content
}