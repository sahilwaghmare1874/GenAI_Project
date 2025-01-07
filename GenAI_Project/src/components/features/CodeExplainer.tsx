import { useState, useEffect, useRef } from 'react';
import { OpenAI } from "openai";
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Badge } from "@/components/ui/badge"
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { motion } from 'framer-motion';

const CodeExplainer = () => {
  const exampleMessages = [
    {
      heading: 'Explain this JavaScript code',
      subheading: 'Fibonacci Sequence',
      message: `function fibonacci(n) {
    if (n <= 1) {
      return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  `
    },
    {
      heading: 'Explain this React component',
      subheading: 'Counter',
      message: `import React, { useState } from 'react';
  
  const Counter = () => {
    const [count, setCount] = useState(0);
  
    const incrementCount = () => {
      setCount(count + 1);
    };
  
    const decrementCount = () => {
      setCount(count - 1);
    };
  
    return (
      <div>
        <h1>Counter</h1>
        <p>Count: {count}</p>
        <button onClick={incrementCount}>Increment</button>
        <button onClick={decrementCount}>Decrement</button>
      </div>
    );
  };
  
  export default Counter;
  `
    },
    {
      heading: 'Explain this Python function',
      subheading: 'Calculate Factorial',
      message: `def factorial(n):
      if n == 0:
          return 1
      else:
          return n * factorial(n-1)
  `
    },
    {
      heading: 'Explain this JavaScript code',
      subheading: 'Array Flattening',
      message: `const flattenArray = (arr) => {
    return arr.reduce((acc, val) =>
      acc.concat(Array.isArray(val) ? flattenArray(val) : val), []);
  };
  ` }
  ];
  const [currentInput, setCurrentInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openai = new OpenAI({
    apiKey: "4dd3ec54aef08aea07c498f8c1b47627f00e9b506fa66f6b31ca4f47cceda434",
    baseURL: "https://api.together.xyz/v1",
    dangerouslyAllowBrowser: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentInput(e.target.value);
  };

  const handleButtonClick = async () => {
    if (currentInput.trim() === '') {
      return;
    }
  
    setIsLoading(true);
    setGeneratedCode('');
  
    try {
      const stream = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: '<|start_header_id|>system<|end_header_id|>You are an AI Code Explainer.Don\'t entertain any non-coding inquiries.If your response contains code blocks then provide the generated code within Markdown code blocks, specifying the language (e.g., ```javascript or ```python).<|eot_id|> ' },
          { role: 'user', content:  `<|start_header_id|>user<|end_header_id|>${currentInput}<|eot_id|> `},
        ],
        model: 'meta-llama/Llama-3-70b-chat-hf',
        max_tokens: 7000,
        stream: true,
      });
  
      for await (const chunk of stream) {
        const [choice] = chunk.choices;
        const { content } = choice.delta;
        const partialContent = content;
        if (partialContent) {
          setGeneratedCode(prev => (prev || '') + partialContent);
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsLoading(false);
      setCurrentInput('');
    }
  };

  const handleGenerateCode = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleButtonClick();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setCurrentInput(currentInput + '\n');
    }
  };

  const handlePromptClick = async (prompt: { heading?: string; subheading?: string; message: any; }) => {
    setCurrentInput(prompt.message);
    setSelectedPrompt(prompt.message);
    await handleButtonClick(); // Submit the form after setting the prompt
  };

  useEffect(() => {
    if (selectedPrompt !== '') {
      textareaRef.current?.focus();
      handleButtonClick();
    }
  }, [selectedPrompt]);

  const source = generatedCode || '';

  return (
    <div className="relative flex h-full min-h-screen flex-col rounded-xl p-4 lg:col-span-2">

      {source !== '' ? (
<>
            <Badge className="absolute right-3 top-3">Output</Badge>
      <br />
        <div className="flex-1">
          <MarkdownPreview source={source} style={{ padding: 26 }} />
        </div>
</>
      ) : (
    
          <motion.div className="flex-1 mx-auto max-w-2xl px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, translateY: -4 }}
            transition={{ duration: 2 }}
          >
          
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
                <h1 className="text-5xl md:text-6xl text-center font-semibold">
                  AI Code Explainer
                </h1>
                {selectedPrompt === '' && (
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold">Sample Prompts</h2>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {exampleMessages.map((prompt, index) => (
                        <div
                          key={index}
                          className="cursor-pointer rounded-lg bg-gray-200 p-4 hover:bg-gray-300"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          <h3 className="text-lg font-semibold">
                            {prompt.heading} <span className="text-gray-600">{prompt.subheading}</span>
                          </h3>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
       
          </motion.div>
  
      )}
      <br />
      <form className="sticky bottom-5 overflow-hidden rounded-lg border bg-opacity-75 backdrop-blur-md focus-within:ring-1 focus-within:ring-ring ">
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <textarea
          id="message"
          placeholder="Paste your code here..."
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleGenerateCode}
          ref={textareaRef}
          className="min-h-12 resize-vertical border-0 bg-transparent p-3 shadow-none focus:outline-none focus:border-none w-full"
        autoFocus></textarea>
        <div className="flex items-center p-3 pt-0 ">
          <Button
            type="submit"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={handleButtonClick}
            disabled={isLoading || currentInput.trim() === ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                Explain Code <CornerDownLeft className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CodeExplainer;
