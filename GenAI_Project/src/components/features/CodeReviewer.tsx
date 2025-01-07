import { useState, useEffect, useRef } from 'react';
import { OpenAI } from "openai";
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Badge } from "@/components/ui/badge";
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { motion } from 'framer-motion';

const CodeReviewer = () => {
  const exampleMessages = [
    {
      heading: 'Review this JavaScript',
      subheading: 'Email Regex',
      message: `Review this JavaScript Email Regex:
  
  function ValidateEmail(mail) {
    if (/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/.test(mail)) {
      return true;
    }
    return false;
  }
  `
    },
    {
      heading: 'Review this JavaScript function to',
      subheading: 'reverse a string',
      message: `function reverseString(str) {
    let reversedStr = '';
    for (let i = str.length - 1; i >= 0; i--) {
      reversedStr += str[i];
    }
    return reversedStr;
  }
  `
    },
    {
      heading: 'Review this Python function to',
      subheading: 'check if a number is prime',
      message: `def is_prime(n):
      if n < 2:
          return False
      for i in range(2, int(n**0.5) + 1):
          if n % i == 0:
              return False
      return True
  `
    },
    {
      heading: 'Review this JavaScript code for',
      subheading: 'a simple calculator',
      message: `function calculate(operation, num1, num2) {
    switch (operation) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '*':
        return num1 * num2;
      case '/':
        if (num2 === 0) {
          return 'Cannot divide by zero';
        }
        return num1 / num2;
      default:
        return 'Invalid operation';
    }
  }
  `
    }
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
          { role: 'system', content: '<|start_header_id|>system<|end_header_id|>You are an AI Code Reviewer.Don\'t entertain any non-coding inquiries.If your response contains code blocks then provide the generated code within Markdown code blocks, specifying the language (e.g., ```javascript or ```python).<|eot_id|> ' },
          { role: 'user', content: currentInput },
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
              AI Code Reviewer
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
          autoFocus
        ></textarea>
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
                Review Code <CornerDownLeft className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default CodeReviewer;
