import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"

export default function WebScraper() {
  const [url, setUrl] = useState("")
  const [fields, setFields] = useState<string[]>([])
  const [newField, setNewField] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [apiKey, setApiKey] = useState("")
  const [results, setResults] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0, cost: 0 })

  const addField = () => {
    if (newField && !fields.includes(newField)) {
      setFields([...fields, newField])
      setNewField("")
    }
  }

  const removeField = (field: string) => {
    setFields(fields.filter(f => f !== field))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setResults("")

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, fields, model, apiKey }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setResults(JSON.stringify(data.result, null, 2))
      setTokenUsage({
        input: data.inputTokens,
        output: data.outputTokens,
        cost: data.totalCost
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Web Scraper Settings</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="fields">Fields to Extract</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                id="newField"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                placeholder="Enter a field"
              />
              <Button type="button" onClick={addField} className="bg-blue-800 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field) => (
                <div key={field} className="flex items-center space-x-2 bg-white p-2 rounded">
                  <span>{field}</span>
                  <Button
                    type="button"
                    onClick={() => removeField(field)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="model">OpenAI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-800 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Scraping..." : "Start Scraping"}
          </Button>
        </form>
      </div>
      <div className="flex-1 p-8 bg-white">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Scraping Results</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {tokenUsage.input > 0 && (
          <div className="mb-4 p-4 bg-blue-100 rounded">
            <h3 className="font-bold text-blue-800">Token Usage</h3>
            <p>Input Tokens: {tokenUsage.input}</p>
            <p>Output Tokens: {tokenUsage.output}</p>
            <p>Total Cost: ${tokenUsage.cost.toFixed(4)}</p>
          </div>
        )}
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">{results}</pre>
      </div>
    </div>
  )
}