import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { Configuration, OpenAIApi } from 'openai'

function html_to_markdown_with_readability(html_content: string): string {
  const $ = cheerio.load(html_content)
  return $('body').text().trim()
}

function calculate_price(input_text: string, output_text: string, model: string): [number, number, number] {
  const inputTokens = input_text.split(/\s+/).length
  const outputTokens = output_text.split(/\s+/).length
  const cost = (inputTokens + outputTokens) * 0.00002 // Simplified cost calculation
  return [inputTokens, outputTokens, cost]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, fields, model, apiKey } = req.body

  if (!url || !fields || !model || !apiKey) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const { data: html } = await axios.get(url)
    const markdown = html_to_markdown_with_readability(html)

    const configuration = new Configuration({ apiKey })
    const openai = new OpenAIApi(configuration)

    const prompt = `Extract the following information from the given text: ${fields.join(', ')}. 
    Text: ${markdown.substring(0, 3000)}`

    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = completion.data.choices[0].message?.content

    if (!result) {
      throw new Error('No result from OpenAI')
    }

    const [inputTokens, outputTokens, totalCost] = calculate_price(prompt, result, model)

    res.status(200).json({ result, inputTokens, outputTokens, totalCost })
  } catch (error) {
    console.error('Error:', error)
    let errorMessage = 'An error occurred while scraping'
    
    if (error instanceof Error) {
      errorMessage = error.message
    }

    if (axios.isAxiosError(error)) {
      errorMessage = `Error fetching webpage: ${error.message}`
    }

    res.status(500).json({ error: errorMessage })
  }
}